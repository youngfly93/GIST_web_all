# ---------------------------------------------------------------------------
# Plumber REST API — dbGIST Transcriptomics
#
# Wraps analysis functions from GIST_Transcriptome/global.R as REST endpoints
# consumed by GIST_agent_pi's TranscriptomicsClient.
#
# Endpoints:
#   GET  /health               → { "status": "ok" }
#   POST /proteins/check       → gene availability across mRNA datasets
#   POST /analyze/batch        → batch clinical association plots (base64)
#   POST /analyze/survival     → Kaplan-Meier survival analysis
#   POST /analyze/drug-resistance → drug response + ROC
# ---------------------------------------------------------------------------

library(plumber)
library(jsonlite)

# ---------------------------------------------------------------------------
# Bootstrap: load data & functions from the Shiny app directory
# ---------------------------------------------------------------------------

.this_dir <- tryCatch(
  dirname(sys.frame(1)$ofile),
  error = function(e) {
    for (arg in commandArgs(trailingOnly = FALSE)) {
      if (grepl("^--file=", arg)) return(dirname(sub("^--file=", "", arg)))
    }
    getwd()
  }
)

TRANSCRIPTOME_DIR <- normalizePath(
  file.path(.this_dir, "..", "GIST_Transcriptome"),
  mustWork = FALSE
)

if (nzchar(Sys.getenv("TRANSCRIPTOME_DIR"))) {
  TRANSCRIPTOME_DIR <- Sys.getenv("TRANSCRIPTOME_DIR")
}

cat("📂 Transcriptome dir:", TRANSCRIPTOME_DIR, "\n")

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

# Load the data matrix
rds_path <- file.path(TRANSCRIPTOME_DIR, "dbGIST_matrix_20250828.rds")
if (!file.exists(rds_path)) {
  stop("❌ Cannot find dbGIST_matrix_20250828.rds at: ", rds_path)
}
cat("📦 Loading dbGIST_matrix_20250828.rds ...\n")
dbGIST_matrix <- readRDS(rds_path)
cat("✅ Loaded", length(dbGIST_matrix), "datasets\n")

# Source the analysis functions
fn_path <- file.path(TRANSCRIPTOME_DIR, "global.R")
if (!file.exists(fn_path)) {
  stop("❌ Cannot find global.R at: ", fn_path)
}

ID <- "MCM7"  # dummy so inline test lines don't error
cat("📦 Loading analysis functions from global.R ...\n")
old_wd <- getwd()
setwd(TRANSCRIPTOME_DIR)

source_transcriptome_global <- function(path) {
  optional_packages <- c("slickR", "eoffice")
  missing_optional <- optional_packages[!vapply(optional_packages, requireNamespace, logical(1), quietly = TRUE)]

  if (length(missing_optional) == 0) {
    source(path, local = FALSE)
    return(invisible(TRUE))
  }

  cat("⚠️ Optional transcriptome packages missing:", paste(missing_optional, collapse = ", "), "\n")
  lines <- readLines(path, warn = FALSE, encoding = "UTF-8")
  for (pkg in missing_optional) {
    pkg_pattern <- gsub("\\.", "\\\\.", pkg)
    pattern <- paste0("^\\s*(library|require)\\(", pkg_pattern, "\\)\\s*$")
    lines <- lines[!grepl(pattern, lines)]
  }

  tmp_path <- tempfile(fileext = ".R")
  writeLines(lines, tmp_path, useBytes = TRUE)
  on.exit(unlink(tmp_path), add = TRUE)
  source(tmp_path, local = FALSE)
  invisible(TRUE)
}

tryCatch(
  source_transcriptome_global(fn_path),
  error = function(e) cat("⚠️ Non-fatal source error:", conditionMessage(e), "\n")
)
setwd(old_wd)
cat("✅ Analysis functions loaded\n")

# ---------------------------------------------------------------------------
# Constants — mRNA dataset indices
# ---------------------------------------------------------------------------

mRNA_ID <- 1:14

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

plot_to_base64 <- function(p, width = 800, height = 600, res = 150) {
  if (is.null(p)) return(NULL)
  tmp <- tempfile(fileext = ".png")
  on.exit(unlink(tmp), add = TRUE)
  png(tmp, width = width, height = height, res = res)
  tryCatch(print(p), error = function(e) NULL)
  dev.off()
  base64enc::base64encode(tmp)
}

dataset_ids <- function() {
  vapply(dbGIST_matrix[mRNA_ID], function(ds) as.character(ds$ID), character(1))
}

short_alias <- function(ds_name) {
  if (grepl("Sun", ds_name, ignore.case = TRUE)) return("Sun")
  if (grepl("Liu", ds_name, ignore.case = TRUE)) return("Liu")
  if (grepl("ZZU", ds_name, ignore.case = TRUE)) return("ZZU")
  ds_name
}

gene_in_datasets <- function(gene) {
  hits <- vapply(dbGIST_matrix[mRNA_ID], function(ds) {
    gene %in% rownames(ds$Matrix)
  }, logical(1))
  ds_names <- dataset_ids()[hits]
  aliases <- unique(vapply(ds_names, short_alias, character(1), USE.NAMES = FALSE))
  list(
    available = any(hits),
    datasets  = unique(c(ds_names, aliases))
  )
}

# Clinical analysis function map
CLINICAL_FUNCTIONS <- list(
  Risk               = "dbGIST_boxplot_Risk",
  Mutation_ID        = "dbGIST_boxplot_Mutation_ID",
  Age                = "dbGIST_boxplot_Age",
  Site               = "dbGIST_boxplot_Site",
  Gender             = "dbGIST_boxplot_Gender",
  Stage              = "dbGIST_boxplot_Stage",
  Tumor_size         = "dbGIST_boxplot_Tumor_size",
  Grade              = "dbGIST_boxplot_Grade",
  Metastatic_Primary = "dbGIST_boxplot_Metastatic_Primary"
)

required_function_status <- function(function_names) {
  setNames(
    lapply(function_names, function(name) exists(name, envir = .GlobalEnv, inherits = FALSE)),
    function_names
  )
}

build_readiness <- function() {
  started_at <- Sys.time()
  datasets_loaded <- sum(vapply(mRNA_ID, function(idx) {
    idx <= length(dbGIST_matrix) && !is.null(dbGIST_matrix[[idx]]$Matrix)
  }, logical(1)))
  required_functions <- required_function_status(unique(c(
    unname(unlist(CLINICAL_FUNCTIONS, use.names = FALSE)),
    "dbGIST_boxplot_Drug"
  )))
  blockers <- character(0)

  if (datasets_loaded == 0) blockers <- c(blockers, "no_datasets_loaded")
  if (!all(unlist(required_functions, use.names = FALSE))) blockers <- c(blockers, "missing_required_functions")

  list(
    module = "transcriptomics",
    ready = datasets_loaded > 0 && all(unlist(required_functions, use.names = FALSE)),
    datasets_loaded = datasets_loaded,
    required_functions = required_functions,
    blockers = blockers,
    warmup_ms = as.integer(round(as.numeric(difftime(Sys.time(), started_at, units = "secs")) * 1000)),
    notes = c(
      "legacy_wrapper",
      "supports_health_ready_capabilities",
      "optional_ui_packages_are_filtered_when_missing"
    )
  )
}

build_capabilities <- function() {
  list(
    module = "transcriptomics",
    label = "转录组",
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
      "uses_mrna_dataset_indices_1_to_14"
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
        p <- fn(ID = gene)
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

  survival_entries <- Filter(Negate(is.null), lapply(c("OS", "PFS"), function(type) {
    tryCatch({
      surv_ds_idx <- NULL
      for (idx in mRNA_ID) {
        ds <- dbGIST_matrix[[idx]]
        if (gene %in% rownames(ds$Matrix)) {
          time_col <- ifelse(type == "OS", "OS.time", "PFS.time")
          event_col <- ifelse(type == "OS", "OS", "PFS")
          if (all(c(time_col, event_col) %in% colnames(ds$Clinical))) {
            surv_ds_idx <- idx
            break
          }
        }
      }
      if (is.null(surv_ds_idx)) return(NULL)

      ds <- dbGIST_matrix[[surv_ds_idx]]
      clinical_df <- ds$Clinical
      clinical_df$Expr <- as.numeric(ds$Matrix[gene, ])

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
        cutoff_value = cutoff_value,
        dataset = as.character(ds$ID)
      )
    }, error = function(e) NULL)
  }))
  if (length(survival_entries) > 0) result$survival <- unname(survival_entries)

  drug_resistance <- tryCatch({
    IM_ID <- c(13, 3)
    found <- NULL
    for (idx in IM_ID) {
      ds <- dbGIST_matrix[[idx]]
      if (!(gene %in% rownames(ds$Matrix)) || !("Imatinib" %in% colnames(ds$Clinical))) next

      values <- as.numeric(ds$Matrix[gene, ])
      response <- ds$Clinical$Imatinib
      df <- data.frame(val = values, grp = response, stringsAsFactors = FALSE)
      df <- na.omit(df)
      if (nrow(df) == 0) next

      auc_val <- NULL
      if (length(unique(df$grp)) == 2) {
        tryCatch({
          roc_obj <- pROC::roc(df$grp, df$val, quiet = TRUE)
          auc_val <- as.numeric(pROC::auc(roc_obj))
        }, error = function(e) NULL)
      }

      found <- list(
        auc = auc_val,
        n_samples = nrow(df)
      )
      break
    }
    found
  }, error = function(e) NULL)
  if (!is.null(drug_resistance)) result$drug_resistance <- drug_resistance

  result
}

# =========================================================================
# Plumber API definition
# =========================================================================

#* @apiTitle dbGIST Transcriptomics API
#* @apiDescription REST wrapper around GIST transcriptome analysis functions

#* Health check
#* @get /health
function() {
  list(status = "ok", module = "transcriptomics", datasets = length(mRNA_ID))
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

#* Check gene availability across mRNA datasets
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
        p <- fn(ID = gene)
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

  # Find first dataset with survival data for this gene
  surv_ds_idx <- NULL
  for (idx in mRNA_ID) {
    ds <- dbGIST_matrix[[idx]]
    if (gene %in% rownames(ds$Matrix)) {
      time_col <- ifelse(type == "OS", "OS.time", "PFS.time")
      event_col <- ifelse(type == "OS", "OS", "PFS")
      if (all(c(time_col, event_col) %in% colnames(ds$Clinical))) {
        surv_ds_idx <- idx
        break
      }
    }
  }

  if (is.null(surv_ds_idx)) {
    return(list(gene = gene, type = type, error = paste0(gene, " not found in any dataset with ", type, " data")))
  }

  tryCatch({
    ds <- dbGIST_matrix[[surv_ds_idx]]
    clinical <- ds$Clinical
    clinical$Expr <- as.numeric(ds$Matrix[gene, ])

    time_col  <- ifelse(type == "OS", "OS.time", "PFS.time")
    event_col <- ifelse(type == "OS", "OS", "PFS")

    # Remove rows with NA in survival columns
    valid <- !is.na(clinical[[time_col]]) & !is.na(clinical[[event_col]]) & !is.na(clinical$Expr)
    clinical <- clinical[valid, ]

    if (nrow(clinical) < 10) {
      return(list(gene = gene, type = type, error = "Too few samples with survival data"))
    }

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

    res.cat <- survminer::surv_categorize(res.cut)
    if (cutoff != "Auto") {
      res.cat$Expr <- ifelse(clinical$Expr > cutoff_value, "high", "low")
    }
    res.cat$Expr <- factor(res.cat$Expr, levels = c("low", "high"))

    formula <- as.formula(paste("Surv(", time_col, ",", event_col, ") ~ Expr"))
    fit <- survival::survfit(formula, data = res.cat)
    cox_fit <- survival::coxph(formula, data = res.cat)
    cox_sum <- summary(cox_fit)

    p <- survminer::ggsurvplot(fit, data = res.cat,
      pval = TRUE, risk.table = TRUE,
      title = paste0(gene, " - ", type, " (", ds$ID, ")"),
      xlab = "Time", ylab = paste0(type, " probability")
    )

    plot_obj <- if (is.list(p) && !is.null(p$plot)) p$plot else p

    result <- list(
      gene   = gene,
      type   = type,
      cutoff = cutoff,
      cutoff_value = cutoff_value,
      dataset = as.character(ds$ID),
      plot = plot_to_base64(plot_obj, width = 1000, height = 800),
      statistics = list(
        hazard_ratio = cox_sum$coefficients[, "exp(coef)"],
        p_value      = cox_sum$coefficients[, "Pr(>|z|)"],
        ci_lower     = cox_sum$conf.int[, "lower .95"],
        ci_upper     = cox_sum$conf.int[, "upper .95"],
        n_high       = sum(res.cat$Expr == "high", na.rm = TRUE),
        n_low        = sum(res.cat$Expr == "low", na.rm = TRUE)
      )
    )

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

  tryCatch({
    fn <- tryCatch(get("dbGIST_boxplot_Drug", envir = .GlobalEnv), error = function(e) NULL)
    if (is.null(fn)) {
      return(list(gene = gene, error = "dbGIST_boxplot_Drug function not found"))
    }

    p <- fn(ID = gene)

    result <- list(gene = gene)

    if (!is.null(p)) {
      # Use suggested size from the function if available
      w <- 1200
      h <- 800
      sz <- attr(p, "suggested_size_px")
      if (!is.null(sz)) {
        w <- min(sz$width %/% 2, 1600)
        h <- min(sz$height %/% 2, 1200)
      }
      result$plot <- plot_to_base64(p, width = w, height = h)

      # Try to extract AUC from the drug-resistance datasets
      tryCatch({
        IM_ID <- c(13, 3)
        n_total <- 0
        auc_val <- NULL
        for (idx in IM_ID) {
          ds <- dbGIST_matrix[[idx]]
          if (gene %in% rownames(ds$Matrix) && "Imatinib" %in% colnames(ds$Clinical)) {
            values <- as.numeric(ds$Matrix[gene, ])
            response <- ds$Clinical$Imatinib
            df <- data.frame(val = values, grp = response, stringsAsFactors = FALSE)
            df <- na.omit(df)
            n_total <- n_total + nrow(df)
            if (length(unique(df$grp)) == 2 && is.null(auc_val)) {
              tryCatch({
                roc_obj <- pROC::roc(df$grp, df$val, quiet = TRUE)
                auc_val <- as.numeric(pROC::auc(roc_obj))
              }, error = function(e) NULL)
            }
          }
        }
        result$statistics <- list(
          auc       = auc_val,
          n_samples = n_total
        )
      }, error = function(e) {
        cat("⚠️ Drug resistance stats error:", conditionMessage(e), "\n")
      })
    } else {
      result$error <- paste0("No drug response data for ", gene)
    }

    result
  }, error = function(e) {
    list(gene = gene, error = conditionMessage(e))
  })
}
