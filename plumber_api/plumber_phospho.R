# ---------------------------------------------------------------------------
# Plumber REST API — dbGIST Phosphoproteomics
#
# Wraps analysis functions from GIST_Phosphoproteomics/Phosphoproteomics.R
# as REST endpoints consumed by GIST_agent_pi's PhosphoClient.
#
# Endpoints:
#   GET  /health               → { "status": "ok" }
#   POST /proteins/check       → gene/phosphosite availability + datasets
#   POST /analyze/batch        → batch clinical association plots (base64)
#   POST /analyze/survival     → Kaplan-Meier survival analysis
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
    for (arg in commandArgs(trailingOnly = FALSE)) {
      if (grepl("^--file=", arg)) return(dirname(sub("^--file=", "", arg)))
    }
    getwd()
  }
)

PHOSPHO_DIR <- normalizePath(
  file.path(.this_dir, "..", "GIST_Phosphoproteomics"),
  mustWork = FALSE
)

if (nzchar(Sys.getenv("PHOSPHO_DIR"))) {
  PHOSPHO_DIR <- Sys.getenv("PHOSPHO_DIR")
}

cat("📂 Phosphoproteomics dir:", PHOSPHO_DIR, "\n")

# Load required packages
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
rds_path <- file.path(PHOSPHO_DIR, "Phosphoproteomics_list.RDS")
if (!file.exists(rds_path)) {
  stop("❌ Cannot find Phosphoproteomics_list.RDS at: ", rds_path)
}
cat("📦 Loading Phosphoproteomics_list.RDS ...\n")
Phosphoproteomics_list <- readRDS(rds_path)
cat("✅ Loaded", length(Phosphoproteomics_list), "datasets\n")

# Source the analysis functions
fn_path <- file.path(PHOSPHO_DIR, "Phosphoproteomics.R")
if (!file.exists(fn_path)) {
  stop("❌ Cannot find Phosphoproteomics.R at: ", fn_path)
}

ID <- "MCM7/T227"  # dummy so inline test lines don't error
cat("📦 Loading analysis functions from Phosphoproteomics.R ...\n")
old_wd <- getwd()
setwd(PHOSPHO_DIR)
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

#' Dataset IDs
dataset_ids <- function() {
  vapply(Phosphoproteomics_list, function(ds) as.character(ds$ID), character(1))
}

#' Short alias for OmicsClient compatibility
short_alias <- function(ds_name) {
  if (grepl("Sun", ds_name, ignore.case = TRUE)) return("Sun")
  if (grepl("Liu", ds_name, ignore.case = TRUE)) return("Liu")
  if (grepl("ZZU", ds_name, ignore.case = TRUE)) return("ZZU")
  ds_name
}

#' For phosphoproteomics, the user queries by protein symbol (e.g., "KIT")
#' but the matrix rownames are phosphosite IDs (e.g., "KIT/Y703").
#' We check if any rowname starts with "GENE/" pattern.
gene_in_datasets <- function(gene) {
  pattern <- paste0("^", gene, "/")
  hits <- vapply(Phosphoproteomics_list, function(ds) {
    any(grepl(pattern, rownames(ds$Matrix)))
  }, logical(1))
  ds_names <- dataset_ids()[hits]
  aliases <- unique(vapply(ds_names, short_alias, character(1), USE.NAMES = FALSE))
  list(
    available = any(hits),
    datasets  = unique(c(ds_names, aliases))
  )
}

#' Get all phosphosite IDs for a gene
get_phosphosites <- function(gene) {
  pattern <- paste0("^", gene, "/")
  sites <- character(0)
  for (ds in Phosphoproteomics_list) {
    rn <- rownames(ds$Matrix)
    sites <- union(sites, rn[grepl(pattern, rn)])
  }
  sites
}

# Clinical analysis function map
CLINICAL_FUNCTIONS <- list(
  TvsN         = "dbGIST_Phosphoproteome_boxplot_TvsN",
  Risk         = "dbGIST_Phosphoproteome_boxplot_Risk",
  Gender       = "dbGIST_Phosphoproteome_boxplot_Gender",
  Age          = "dbGIST_Phosphoproteome_boxplot_Age",
  Tumor_size   = "dbGIST_Phosphoproteome_boxplot_Tumor.size",
  Mitotic      = "dbGIST_Phosphoproteome_boxplot_Mitotic.count",
  Location     = "dbGIST_Phosphoproteome_boxplot_Location",
  WHO          = "dbGIST_Phosphoproteome_boxplot_WHO",
  Mutation     = "dbGIST_Phosphoproteome_boxplot_Mutation",
  IM_Response  = "dbGIST_Phosphoproteome_boxplot_IM.Response"
)

required_function_status <- function(function_names) {
  setNames(
    lapply(function_names, function(name) exists(name, envir = .GlobalEnv, inherits = FALSE)),
    function_names
  )
}

build_readiness <- function() {
  started_at <- Sys.time()
  datasets_loaded <- sum(vapply(Phosphoproteomics_list, function(ds) {
    !is.null(ds$Matrix)
  }, logical(1)))
  required_functions <- required_function_status(unique(c(
    unname(unlist(CLINICAL_FUNCTIONS, use.names = FALSE)),
    "Pho_KM_function"
  )))
  blockers <- character(0)

  if (datasets_loaded == 0) blockers <- c(blockers, "no_datasets_loaded")
  if (!all(unlist(required_functions, use.names = FALSE))) blockers <- c(blockers, "missing_required_functions")

  list(
    module = "phospho",
    ready = datasets_loaded > 0 && all(unlist(required_functions, use.names = FALSE)),
    datasets_loaded = datasets_loaded,
    required_functions = required_functions,
    blockers = blockers,
    warmup_ms = as.integer(round(as.numeric(difftime(Sys.time(), started_at, units = "secs")) * 1000)),
    notes = c(
      "legacy_wrapper",
      "supports_health_ready_capabilities",
      "query_by_gene_resolves_to_first_phosphosite"
    )
  )
}

build_capabilities <- function() {
  list(
    module = "phospho",
    label = "磷酸化蛋白质组",
    supports = list(
      gene_check = TRUE,
      batch = TRUE,
      survival = TRUE,
      drug_resistance = FALSE,
      plots = TRUE,
      async_jobs = FALSE,
      summary_mode = TRUE,
      render_mode = FALSE
    ),
    analyses = c(
      "availability",
      "clinical",
      "survival"
    ),
    artifact_kinds = c("png"),
    latency_class = "medium",
    notes = c(
      "current_api_is_legacy_full_mode",
      "gene_queries_resolve_to_first_matching_phosphosite"
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

  sites <- get_phosphosites(gene)
  if (length(sites) == 0) {
    return(result)
  }
  site_id <- sites[1]

  clinical <- unname(lapply(names(CLINICAL_FUNCTIONS), function(name) {
    fn_name <- CLINICAL_FUNCTIONS[[name]]
    fn <- tryCatch(get(fn_name, envir = .GlobalEnv), error = function(e) NULL)

    entry <- list(variable = name)
    if (is.null(fn)) {
      entry$error <- paste0("Function ", fn_name, " not found")
    } else {
      tryCatch({
        p <- fn(ID = site_id, DB = Phosphoproteomics_list)
        if (is.null(p)) {
          entry$error <- paste0("No data for ", site_id, " in ", name)
        }
      }, error = function(e) {
        entry$error <<- conditionMessage(e)
      })
    }
    entry
  }))
  if (length(clinical) > 0) result$clinical_associations <- clinical

  has_sun <- "Sun" %in% info$datasets
  if (has_sun && (site_id %in% rownames(Phosphoproteomics_list[[1]]$Matrix))) {
    survival_entries <- Filter(Negate(is.null), lapply(c("OS", "PFS"), function(type) {
      tryCatch({
        clinical_df <- Phosphoproteomics_list[[1]]$Clinical
        clinical_df$Expr <- as.numeric(Phosphoproteomics_list[[1]]$Matrix[site_id, ])

        time_col <- ifelse(type == "OS", "OS.time", "PFS.time")
        event_col <- ifelse(type == "OS", "OS", "PFS")
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
  }

  result
}

# =========================================================================
# Plumber API definition
# =========================================================================

#* @apiTitle dbGIST Phosphoproteomics API
#* @apiDescription REST wrapper around GIST phosphoproteomics analysis functions

#* Health check
#* @get /health
function() {
  list(status = "ok", module = "phospho", datasets = length(Phosphoproteomics_list))
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
    sites <- if (info$available) get_phosphosites(sym) else character(0)
    list(
      gene         = sym,
      available    = info$available,
      datasets     = info$datasets,
      phosphosites = sites
    )
  })

  list(results = results)
}

#* Batch clinical association analysis
#* @post /analyze/batch
#* @param gene:str Gene symbol (protein name, e.g. "KIT"); uses the first phosphosite found
function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, analyses = list()))
  }

  # Resolve to a phosphosite ID
  sites <- get_phosphosites(gene)
  if (length(sites) == 0) {
    return(list(gene = gene, analyses = list(), error = paste0("No phosphosites for ", gene)))
  }

  # Use the first phosphosite for batch analysis
  site_id <- sites[1]

  analyses <- list()
  for (name in names(CLINICAL_FUNCTIONS)) {
    fn_name <- CLINICAL_FUNCTIONS[[name]]
    fn <- tryCatch(get(fn_name, envir = .GlobalEnv), error = function(e) NULL)

    entry <- list(variable = name)
    if (is.null(fn)) {
      entry$error <- paste0("Function ", fn_name, " not found")
    } else {
      tryCatch({
        p <- fn(ID = site_id, DB = Phosphoproteomics_list)
        if (!is.null(p)) {
          entry$plot <- plot_to_base64(p)
        } else {
          entry$error <- paste0("No data for ", site_id, " in ", name)
        }
      }, error = function(e) {
        entry$error <<- conditionMessage(e)
      })
    }
    analyses[[name]] <- entry
  }

  list(gene = gene, phosphosite = site_id, analyses = analyses)
}

#* Survival analysis (Kaplan-Meier)
#* @post /analyze/survival
#* @param gene:str Gene symbol (resolves to first phosphosite)
#* @param type:str Survival type (OS or PFS)
#* @param cutoff:str Cutoff method (Auto, Median, Mean)
function(gene = "", type = "OS", cutoff = "Auto") {
  gene <- trimws(gene)
  type <- match.arg(type, c("OS", "PFS"))
  cutoff <- match.arg(cutoff, c("Auto", "Median", "Mean"))

  if (!nzchar(gene)) {
    return(list(gene = gene, type = type, error = "Empty gene symbol"))
  }

  # Resolve to phosphosite
  sites <- get_phosphosites(gene)
  if (length(sites) == 0) {
    return(list(gene = gene, type = type, error = paste0("No phosphosites for ", gene)))
  }
  site_id <- sites[1]

  # Check availability in dataset 1 (tumor data with clinical info)
  if (!(site_id %in% rownames(Phosphoproteomics_list[[1]]$Matrix))) {
    return(list(gene = gene, type = type, error = paste0(site_id, " not in tumor dataset")))
  }

  tryCatch({
    p <- Pho_KM_function(
      Protemics2_Clinical = Phosphoproteomics_list[[1]]$Clinical,
      CutOff_point = cutoff,
      Survival_type = type,
      ID = site_id
    )

    result <- list(gene = gene, phosphosite = site_id, type = type, cutoff = cutoff)

    if (!is.null(p)) {
      # ggsurvplot returns a list with $plot
      plot_obj <- if (is.list(p) && !is.null(p$plot)) p$plot else p
      result$plot <- plot_to_base64(plot_obj, width = 1000, height = 800)

      # Extract survival statistics
      tryCatch({
        clinical <- Phosphoproteomics_list[[1]]$Clinical
        clinical$Expr <- as.numeric(Phosphoproteomics_list[[1]]$Matrix[site_id, ])

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
        cat("⚠️ Phospho stats extraction error:", conditionMessage(e), "\n")
      })
    }

    result
  }, error = function(e) {
    list(gene = gene, type = type, error = conditionMessage(e))
  })
}
