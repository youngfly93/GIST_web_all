# ---------------------------------------------------------------------------
# Plumber REST API — dbGIST Proteomics
#
# Wraps the pure analysis functions from GIST_Protemics/Protemic.R as REST
# endpoints consumed by GIST_agent_pi's OmicsClient.
#
# Endpoints:
#   GET  /health               → { "status": "ok" }
#   POST /proteins/check       → gene availability + datasets
#   POST /analyze/batch        → batch clinical association plots (base64)
#   POST /analyze/survival     → Kaplan-Meier survival analysis
#   POST /analyze/drug-resistance → imatinib resistance boxplot + ROC
# ---------------------------------------------------------------------------

library(plumber)
library(jsonlite)

# ---------------------------------------------------------------------------
# Bootstrap: load data & functions from the Shiny app directory
# ---------------------------------------------------------------------------

# Resolve script directory robustly (works in plumber, Rscript, source)
.this_dir <- tryCatch(
  dirname(sys.frame(1)$ofile),
  error = function(e) {
    # Fallback: commandArgs or getwd
    for (arg in commandArgs(trailingOnly = FALSE)) {
      if (grepl("^--file=", arg)) return(dirname(sub("^--file=", "", arg)))
    }
    getwd()
  }
)

PROTEMIC_DIR <- normalizePath(
  file.path(.this_dir, "..", "GIST_Protemics"),
  mustWork = FALSE
)

# Allow override via env var
if (nzchar(Sys.getenv("PROTEMIC_DIR"))) {
  PROTEMIC_DIR <- Sys.getenv("PROTEMIC_DIR")
}

cat("📂 Proteomics dir:", PROTEMIC_DIR, "\n")

# Load required packages (same as Protemic.R)
suppressPackageStartupMessages({
  library(data.table)
  library(stringr)
  library(ggpubr)
  library(tidyverse)
  library(ggplot2)
  library(ggsci)
  library(patchwork)
  library(pROC)
  library(survival)
  library(survminer)
})

# Load the data
rds_path <- file.path(PROTEMIC_DIR, "Protemics_list.rds")
if (!file.exists(rds_path)) {
  stop("❌ Cannot find Protemics_list.rds at: ", rds_path)
}
cat("📦 Loading Protemics_list.rds ...\n")
Protemics_list <- readRDS(rds_path)
cat("✅ Loaded", length(Protemics_list), "datasets\n")

# Source the analysis functions
fn_path <- file.path(PROTEMIC_DIR, "Protemic.R")
if (!file.exists(fn_path)) {
  stop("❌ Cannot find Protemic.R at: ", fn_path)
}

# Protemic.R has inline test code at the bottom (ID = "MCM7" etc.)
# It also uses relative paths internally, so we must cd to its directory.
ID <- "MCM7"  # dummy value so inline test lines don't error
cat("📦 Loading analysis functions from Protemic.R ...\n")
old_wd <- getwd()
setwd(PROTEMIC_DIR)
tryCatch(
  source(fn_path, local = FALSE),
  error = function(e) cat("⚠️ Non-fatal source error:", conditionMessage(e), "\n")
)
setwd(old_wd)
cat("✅ Analysis functions loaded\n")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

#' Render a ggplot to base64-encoded PNG
plot_to_base64 <- function(p, width = 800, height = 600, res = 150) {
  if (is.null(p)) return(NULL)
  tmp <- tempfile(fileext = ".png")
  on.exit(unlink(tmp), add = TRUE)
  png(tmp, width = width, height = height, res = res)
  tryCatch(print(p), error = function(e) NULL)
  dev.off()
  base64enc::base64encode(tmp)
}

#' Dataset IDs present in Protemics_list
dataset_ids <- function() {
  vapply(Protemics_list, function(ds) as.character(ds$ID), character(1))
}

#' Map full dataset names to short aliases for OmicsClient compatibility
#' The TypeScript client checks: datasets.includes("Sun")
short_alias <- function(ds_name) {
  if (grepl("Sun", ds_name, ignore.case = TRUE)) return("Sun")
  if (grepl("Liu", ds_name, ignore.case = TRUE)) return("Liu")
  if (grepl("ZZU", ds_name, ignore.case = TRUE)) return("ZZU")
  ds_name
}

#' Check if a gene exists in any dataset matrix
gene_in_datasets <- function(gene) {
  hits <- vapply(Protemics_list, function(ds) {
    gene %in% rownames(ds$Matrix)
  }, logical(1))
  ds_names <- dataset_ids()[hits]
  # Include both full names and short aliases for client compatibility
  aliases <- unique(vapply(ds_names, short_alias, character(1), USE.NAMES = FALSE))
  list(
    available = any(hits),
    datasets  = unique(c(ds_names, aliases))
  )
}

# Clinical analysis function map
CLINICAL_FUNCTIONS <- list(
  TvsN         = "dbGIST_Proteomics_boxplot_TvsN",
  Risk         = "dbGIST_Proteomics_boxplot_Risk",
  Gender       = "dbGIST_Proteomics_boxplot_Gender",
  Age          = "dbGIST_Proteomics_boxplot_Age",
  Tumor_size   = "dbGIST_Proteomics_boxplot_Tumor.size",
  Mitotic      = "dbGIST_Proteomics_boxplot_Mitotic.count",
  Location     = "dbGIST_Proteomics_boxplot_Location",
  WHO          = "dbGIST_Proteomics_boxplot_WHO",
  Ki67         = "dbGIST_Proteomics_boxplot_Ki.67",
  CD34         = "dbGIST_Proteomics_boxplot_CD34",
  Mutation     = "dbGIST_Proteomics_boxplot_Mutation"
)

required_function_status <- function(function_names) {
  setNames(
    lapply(function_names, function(name) exists(name, envir = .GlobalEnv, inherits = FALSE)),
    function_names
  )
}

build_readiness <- function() {
  started_at <- Sys.time()
  datasets_loaded <- sum(vapply(Protemics_list, function(ds) {
    !is.null(ds$Matrix)
  }, logical(1)))
  required_functions <- required_function_status(unique(c(
    unname(unlist(CLINICAL_FUNCTIONS, use.names = FALSE)),
    "KM_function",
    "dbGIST_Proteomics_boxplot_IM.Response"
  )))
  blockers <- character(0)

  if (datasets_loaded == 0) blockers <- c(blockers, "no_datasets_loaded")
  if (!all(unlist(required_functions, use.names = FALSE))) blockers <- c(blockers, "missing_required_functions")

  list(
    module = "proteomics",
    ready = datasets_loaded > 0 && all(unlist(required_functions, use.names = FALSE)),
    datasets_loaded = datasets_loaded,
    required_functions = required_functions,
    blockers = blockers,
    warmup_ms = as.integer(round(as.numeric(difftime(Sys.time(), started_at, units = "secs")) * 1000)),
    notes = c(
      "legacy_wrapper",
      "supports_health_ready_capabilities",
      "plots returned as base64 png"
    )
  )
}

build_capabilities <- function() {
  list(
    module = "proteomics",
    label = "蛋白质组",
    supports = list(
      gene_check = TRUE,
      batch = TRUE,
      survival = TRUE,
      drug_resistance = TRUE,
      plots = TRUE,
      async_jobs = FALSE,
      summary_mode = TRUE,
      render_mode = FALSE
    ),
    analyses = c(
      "availability",
      "clinical",
      "survival",
      "drug_response"
    ),
    artifact_kinds = c("png"),
    latency_class = "medium",
    notes = c(
      "current_api_is_legacy_full_mode",
      "drug_resistance_uses_imatinib_response"
    )
  )
}

build_summary <- function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, available = FALSE, datasets = character(0)))
  }

  info <- gene_in_datasets(gene)
  result <- list(
    gene = gene,
    available = info$available,
    datasets = info$datasets
  )

  if (!info$available) {
    return(result)
  }

  clinical <- unname(lapply(names(CLINICAL_FUNCTIONS), function(name) {
    fn_name <- CLINICAL_FUNCTIONS[[name]]
    fn <- tryCatch(get(fn_name, envir = .GlobalEnv), error = function(e) NULL)

    entry <- list(variable = name)
    if (is.null(fn)) {
      entry$error <- paste0("Function ", fn_name, " not found")
    } else {
      tryCatch({
        p <- fn(ID = gene, DB = Protemics_list)
        if (is.null(p)) {
          entry$error <- paste0("No data for ", gene, " in ", name)
        }
      }, error = function(e) {
        entry$error <<- conditionMessage(e)
      })
    }
    entry
  }))
  if (length(clinical) > 0) result$clinical_associations <- clinical

  has_sun <- "Sun" %in% info$datasets
  if (has_sun) {
    survival_entries <- Filter(Negate(is.null), lapply(c("OS", "PFS"), function(type) {
      tryCatch({
        clinical_df <- Protemics_list[[2]]$Clinical
        clinical_df$Expr <- as.numeric(Protemics_list[[2]]$Matrix[gene, ])

        time_col <- ifelse(type == "OS", "OS.time", "PFS.time")
        event_col <- ifelse(type == "OS", "OS", "PFS")
        valid <- !is.na(clinical_df[[time_col]]) & !is.na(clinical_df[[event_col]]) & !is.na(clinical_df$Expr)
        clinical_df <- clinical_df[valid, ]
        if (nrow(clinical_df) < 10) return(NULL)

        res.cut <- survminer::surv_cutpoint(
          clinical_df,
          time = time_col,
          event = event_col,
          variables = "Expr"
        )
        cutoff_value <- res.cut$cutpoint$cutpoint
        res.cat <- survminer::surv_categorize(res.cut)
        res.cat$Expr <- factor(res.cat$Expr, levels = c("low", "high"))
        formula <- as.formula(paste("Surv(", time_col, ",", event_col, ") ~ Expr"))
        cox_fit <- survival::coxph(formula, data = res.cat)
        cox_sum <- summary(cox_fit)

        list(
          type = type,
          hazard_ratio = cox_sum$coefficients[, "exp(coef)"],
          p_value = cox_sum$coefficients[, "Pr(>|z|)"],
          ci_lower = cox_sum$conf.int[, "lower .95"],
          ci_upper = cox_sum$conf.int[, "upper .95"],
          n_high = sum(res.cat$Expr == "high", na.rm = TRUE),
          n_low = sum(res.cat$Expr == "low", na.rm = TRUE),
          cutoff_value = cutoff_value
        )
      }, error = function(e) NULL)
    }))
    if (length(survival_entries) > 0) result$survival <- unname(survival_entries)

    drug_resistance <- tryCatch({
      values <- as.numeric(Protemics_list[[2]]$Matrix[gene, ])
      response <- Protemics_list[[2]]$Clinical$IM.Response[
        match(colnames(Protemics_list[[2]]$Matrix), Protemics_list[[2]]$Clinical$Sample.ID)
      ]
      df <- data.frame(val = values, grp = response, stringsAsFactors = FALSE)
      df <- na.omit(df)
      if (nrow(df) == 0) {
        NULL
      } else {
        auc_val <- NULL
        if (length(unique(df$grp)) == 2) {
          tryCatch({
            roc_obj <- pROC::roc(df$grp, df$val, quiet = TRUE)
            auc_val <- as.numeric(pROC::auc(roc_obj))
          }, error = function(e) NULL)
        }

        list(
          auc = auc_val,
          n_samples = nrow(df)
        )
      }
    }, error = function(e) NULL)
    if (!is.null(drug_resistance)) result$drug_resistance <- drug_resistance
  }

  result
}

# =========================================================================
# Plumber API definition
# =========================================================================

#* @apiTitle dbGIST Proteomics API
#* @apiDescription REST wrapper around GIST proteomics analysis functions

#* Health check
#* @get /health
function() {
  list(status = "ok", module = "proteomics", datasets = length(Protemics_list))
}

#* Readiness check
#* @get /ready
function() {
  build_readiness()
}

#* Module capabilities
#* @get /capabilities
function() {
  build_capabilities()
}

#* Summary-first analysis payload
#* @post /summary
#* @param gene:str Gene symbol
function(gene = "") {
  build_summary(gene)
}

#* Check gene availability across datasets
#* @post /proteins/check
#* @param gene_symbols:str Comma-separated gene symbols
function(gene_symbols = "") {
  symbols <- trimws(unlist(strsplit(gene_symbols, ",")))
  symbols <- symbols[nzchar(symbols)]

  if (length(symbols) == 0) {
    return(list(results = list()))
  }

  results <- lapply(symbols, function(sym) {
    info <- gene_in_datasets(sym)
    list(
      gene      = sym,
      available = info$available,
      datasets  = info$datasets
    )
  })

  list(results = results)
}

#* Batch clinical association analysis
#* @post /analyze/batch
#* @param gene:str Gene symbol
function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, analyses = list()))
  }

  analyses <- list()
  for (name in names(CLINICAL_FUNCTIONS)) {
    fn_name <- CLINICAL_FUNCTIONS[[name]]
    fn <- tryCatch(get(fn_name, envir = .GlobalEnv), error = function(e) NULL)

    entry <- list(variable = name)
    if (is.null(fn)) {
      entry$error <- paste0("Function ", fn_name, " not found")
    } else {
      tryCatch({
        p <- fn(ID = gene, DB = Protemics_list)
        if (!is.null(p)) {
          entry$plot <- plot_to_base64(p)
        } else {
          entry$error <- paste0("No data for ", gene, " in ", name)
        }
      }, error = function(e) {
        entry$error <<- conditionMessage(e)
      })
    }
    analyses[[name]] <- entry
  }

  list(gene = gene, analyses = analyses)
}

#* Survival analysis (Kaplan-Meier)
#* @post /analyze/survival
#* @param gene:str Gene symbol
#* @param type:str Survival type (OS or PFS)
#* @param cutoff:str Cutoff method (Auto, Median, Mean)
function(gene = "", type = "OS", cutoff = "Auto") {
  gene <- trimws(gene)
  type <- match.arg(type, c("OS", "PFS"))
  cutoff <- match.arg(cutoff, c("Auto", "Median", "Mean"))

  if (!nzchar(gene)) {
    return(list(gene = gene, type = type, error = "Empty gene symbol"))
  }

  # Check gene availability in dataset 2 (Sun dataset with clinical data)
  if (!(gene %in% rownames(Protemics_list[[2]]$Matrix))) {
    return(list(gene = gene, type = type, error = paste0(gene, " not found in Sun dataset")))
  }

  tryCatch({
    p <- KM_function(
      Protemics2_Clinical = Protemics_list[[2]]$Clinical,
      CutOff_point = cutoff,
      Survival_type = type,
      ID = gene
    )

    result <- list(
      gene   = gene,
      type   = type,
      cutoff = cutoff
    )

    if (!is.null(p)) {
      result$plot <- plot_to_base64(p, width = 1000, height = 800)

      # Extract survival statistics
      tryCatch({
        clinical <- Protemics_list[[2]]$Clinical
        clinical$Expr <- as.numeric(Protemics_list[[2]]$Matrix[gene, ])

        time_col  <- ifelse(type == "OS", "OS.time", "PFS.time")
        event_col <- ifelse(type == "OS", "OS", "PFS")

        res.cut <- survminer::surv_cutpoint(clinical,
          time = time_col, event = event_col, variables = "Expr"
        )
        cutoff_value <- if (cutoff == "Median") {
          median(clinical$Expr, na.rm = TRUE)
        } else if (cutoff == "Mean") {
          mean(clinical$Expr, na.rm = TRUE)
        } else {
          res.cut$cutpoint$cutpoint
        }
        result$cutoff_value <- cutoff_value

        res.cat <- survminer::surv_categorize(res.cut)
        if (cutoff != "Auto") {
          res.cat$Expr <- ifelse(clinical$Expr > cutoff_value, "high", "low")
        }
        # Ensure low is reference level (consistent with KM_function in Protemic.R)
        res.cat$Expr <- factor(res.cat$Expr, levels = c("low", "high"))

        formula <- as.formula(paste("Surv(", time_col, ",", event_col, ") ~ Expr"))
        cox_fit <- survival::coxph(formula, data = res.cat)
        cox_sum <- summary(cox_fit)

        result$statistics <- list(
          hazard_ratio = cox_sum$coefficients[, "exp(coef)"],
          p_value      = cox_sum$coefficients[, "Pr(>|z|)"],
          ci_lower     = cox_sum$conf.int[, "lower .95"],
          ci_upper     = cox_sum$conf.int[, "upper .95"],
          n_high       = sum(res.cat$Expr == "high", na.rm = TRUE),
          n_low        = sum(res.cat$Expr == "low", na.rm = TRUE)
        )
      }, error = function(e) {
        cat("⚠️ Stats extraction error:", conditionMessage(e), "\n")
      })
    }

    result
  }, error = function(e) {
    list(gene = gene, type = type, error = conditionMessage(e))
  })
}

#* Drug resistance analysis (Imatinib response)
#* @post /analyze/drug-resistance
#* @param gene:str Gene symbol
function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, error = "Empty gene symbol"))
  }

  # Drug resistance uses dataset 2 (Sun dataset)
  if (!(gene %in% rownames(Protemics_list[[2]]$Matrix))) {
    return(list(gene = gene, error = paste0(gene, " not found in Sun dataset")))
  }

  tryCatch({
    p <- dbGIST_Proteomics_boxplot_IM.Response(ID = gene, DB = Protemics_list)

    result <- list(gene = gene)

    if (!is.null(p)) {
      result$plot <- plot_to_base64(p, width = 1000, height = 600)

      # Extract basic statistics
      tryCatch({
        values  <- as.numeric(Protemics_list[[2]]$Matrix[gene, ])
        response <- Protemics_list[[2]]$Clinical$IM.Response[
          match(colnames(Protemics_list[[2]]$Matrix), Protemics_list[[2]]$Clinical$Sample.ID)
        ]
        df <- data.frame(val = values, grp = response, stringsAsFactors = FALSE)
        df <- na.omit(df)

        n_samples <- nrow(df)
        groups <- table(df$grp)

        # Compute AUC if two groups
        auc_val <- NULL
        if (length(unique(df$grp)) == 2) {
          tryCatch({
            roc_obj <- pROC::roc(df$grp, df$val, quiet = TRUE)
            auc_val <- as.numeric(pROC::auc(roc_obj))
          }, error = function(e) NULL)
        }

        result$statistics <- list(
          auc       = auc_val,
          n_samples = n_samples,
          groups    = as.list(groups)
        )
      }, error = function(e) {
        cat("⚠️ Drug resistance stats error:", conditionMessage(e), "\n")
      })
    } else {
      result$error <- paste0("No IM response data for ", gene)
    }

    result
  }, error = function(e) {
    list(gene = gene, error = conditionMessage(e))
  })
}
