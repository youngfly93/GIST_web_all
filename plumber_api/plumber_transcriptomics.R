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
assign("dbGIST_matrix", dbGIST_matrix, envir = .GlobalEnv)
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
dbGIST_matrix <- get("dbGIST_matrix", envir = .GlobalEnv)
cat("🔄 Transcriptome object refreshed from global.R aliases\n")
cat("✅ Analysis functions loaded\n")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

dataset_class <- function(ds) {
  tolower(trimws(as.character(ds$Class %||% "")))
}

dataset_id <- function(ds) {
  as.character(ds$ID %||% "")
}

`%||%` <- function(x, y) {
  if (is.null(x)) y else x
}

find_dataset_indices <- function(ids = NULL, classes = NULL) {
  hits <- seq_along(dbGIST_matrix)

  if (!is.null(ids)) {
    id_set <- unique(ids)
    hits <- hits[vapply(hits, function(idx) dataset_id(dbGIST_matrix[[idx]]) %in% id_set, logical(1))]
    ord <- match(vapply(hits, function(idx) dataset_id(dbGIST_matrix[[idx]]), character(1)), id_set)
    hits <- hits[order(ord, na.last = TRUE)]
  }

  if (!is.null(classes)) {
    class_set <- tolower(unique(classes))
    hits <- hits[vapply(hits, function(idx) dataset_class(dbGIST_matrix[[idx]]) %in% class_set, logical(1))]
  }

  hits
}

subset_datasets <- function(ids = NULL, classes = NULL) {
  dbGIST_matrix[find_dataset_indices(ids = ids, classes = classes)]
}

subset_indices <- function(ids = NULL, classes = NULL) {
  find_dataset_indices(ids = ids, classes = classes)
}

TRANSCRIPTOME_DATASET_IDS <- list(
  Age = c("GSE8167", "GSE20708", "GSE31802", "GSE47911", "GSE136755", "GSE75479"),
  Gender = c("GSE8167", "GSE17743", "GSE20708", "GSE31802", "GSE47911", "GSE136755", "GSE75479"),
  Risk = c("GSE31802", "GSE47911", "GSE136755"),
  Site = c("GSE8167", "GSE31802", "GSE132542", "GSE136755", "GSE21315", "GSE75479"),
  Mutation_ID = c("GSE14755", "GSE17743", "GSE20708", "GSE47911", "GSE136755"),
  Stage = c("GSE17743", "GSE136755"),
  Tumor_size = c("GSE8167", "GSE17743"),
  Grade = c("GSE17743", "GSE136755"),
  Metastatic_Primary = c("GSE21315", "GSE136755"),
  Drug = c("GSE132542", "GSE15966")
)

mRNA_ID <- subset_indices(classes = "mRNA")

invoke_transcriptome_fn <- function(fn_name, gene, variable = NULL) {
  fn <- tryCatch(get(fn_name, envir = .GlobalEnv), error = function(e) NULL)
  if (is.null(fn)) {
    stop(paste0("Function ", fn_name, " not found"))
  }

  db_ids <- if (!is.null(variable)) TRANSCRIPTOME_DATASET_IDS[[variable]] else NULL
  db_arg <- if (!is.null(db_ids)) subset_datasets(ids = db_ids, classes = "mRNA") else NULL

  args <- list(ID = gene)
  if (!is.null(db_arg)) args$DB <- db_arg
  do.call(fn, args)
}

drug_resistance_indices <- function() {
  subset_indices(ids = TRANSCRIPTOME_DATASET_IDS$Drug, classes = "mRNA")
}

plot_to_base64 <- function(p, width = 800, height = 600, res = 150) {
  if (is.null(p)) return(NULL)
  tmp_dir <- file.path(tempdir(check = TRUE), "dbgist_api_plots")
  dir.create(tmp_dir, recursive = TRUE, showWarnings = FALSE)
  tmp <- tempfile(tmpdir = tmp_dir, fileext = ".png")
  png(tmp, width = width, height = height, res = res)
  ok <- FALSE
  tryCatch({
    print(p)
    ok <- TRUE
  }, error = function(e) NULL)
  dev.off()
  if (!ok || !file.exists(tmp)) return(NULL)
  on.exit(unlink(tmp), add = TRUE)
  base64enc::base64encode(tmp)
}

normalize_matrix_sample_id <- function(x) {
  x <- trimws(as.character(x))
  x <- sub("\\.(gz|bz2)$", "", x, ignore.case = TRUE)
  x <- sub("_hyb.*$", "", x, ignore.case = TRUE)
  x <- sub("\\.(cel|txt|idat|tsv|csv)$", "", x, ignore.case = TRUE)
  x
}

normalize_imatinib_response <- function(x) {
  raw <- trimws(as.character(x))
  low <- tolower(raw)
  out <- rep(NA_character_, length(raw))
  observed <- unique(toupper(raw[!is.na(raw) & nzchar(raw)]))

  if (length(observed) > 0 && all(observed %in% c("NR", "R"))) {
    out[toupper(raw) == "NR"] <- "Resistant"
    out[toupper(raw) == "R"] <- "Sensitive"
    return(out)
  }

  if (length(observed) > 0 && all(observed %in% c("N", "R"))) {
    out[toupper(raw) == "R"] <- "Resistant"
    return(out)
  }

  out[grepl("non[- ]?response|resistan", low)] <- "Resistant"
  out[grepl("^response$|sensitive", low)] <- "Sensitive"
  out
}

match_transcriptome_matrix_to_clinical <- function(ds, candidate_cols = c("Sample_geo_accession", "geo_accession", "Sample", "title", "Sample.ID", ".rowname")) {
  matrix_ids <- normalize_matrix_sample_id(colnames(ds$Matrix))
  best <- NULL
  best_score <- -1L

  for (col in candidate_cols) {
    if (!(col %in% colnames(ds$Clinical))) next
    clinical_ids <- normalize_matrix_sample_id(ds$Clinical[[col]])
    idx <- match(matrix_ids, clinical_ids)
    score <- sum(!is.na(idx))
    if (score > best_score) {
      best <- list(column = col, index = idx, score = score)
      best_score <- score
    }
  }

  if ((is.null(best) || best_score <= 0L) && nrow(ds$Clinical) == ncol(ds$Matrix)) {
    best <- list(column = ".positional", index = seq_len(ncol(ds$Matrix)), score = ncol(ds$Matrix))
  }

  best
}

aligned_transcriptome_clinical <- function(ds, gene = NULL, candidate_cols = c("Sample_geo_accession", "geo_accession", "Sample", "title", "Sample.ID", ".rowname")) {
  if (!is.null(gene) && !(gene %in% rownames(ds$Matrix))) {
    return(NULL)
  }

  matched <- match_transcriptome_matrix_to_clinical(ds, candidate_cols = candidate_cols)
  if (is.null(matched) || is.null(matched$index) || all(is.na(matched$index))) {
    return(NULL)
  }

  clinical <- ds$Clinical[matched$index, , drop = FALSE]
  list(clinical = clinical, matched = matched)
}

build_transcriptome_drug_response <- function(gene) {
  plots <- list()
  stats <- list()

  for (idx in drug_resistance_indices()) {
    ds <- dbGIST_matrix[[idx]]
    if (!(gene %in% rownames(ds$Matrix)) || !("Imatinib" %in% colnames(ds$Clinical))) next

    matched <- match_transcriptome_matrix_to_clinical(ds)
    if (is.null(matched) || is.null(matched$index) || all(is.na(matched$index))) next

    clinical <- ds$Clinical[matched$index, , drop = FALSE]
    expr <- as.numeric(ds$Matrix[gene, ])
    response <- normalize_imatinib_response(clinical$Imatinib)
    keep <- !is.na(expr) & !is.na(response)
    if (!any(keep)) next

    df <- data.frame(
      value = expr[keep],
      response = factor(response[keep], levels = c("Sensitive", "Resistant")),
      stringsAsFactors = FALSE
    )
    if (length(unique(df$response)) < 2) next

    roc_obj <- tryCatch(pROC::roc(df$response, df$value, quiet = TRUE), error = function(e) NULL)
    auc_val <- if (!is.null(roc_obj)) as.numeric(pROC::auc(roc_obj)) else NULL

    box_plot <- ggplot(df, aes(response, value, fill = response)) +
      geom_boxplot(outlier.colour = NA, notch = FALSE, size = 0.4) +
      geom_jitter(shape = 21, size = 2, width = 0.2) +
      geom_violin(position = position_dodge(width = 0.75), size = 0.4, alpha = 0.4, trim = TRUE) +
      scale_fill_lancet() +
      theme_bw() +
      ylab(gene) +
      ggtitle(str_c(ds$ID, " (n = ", nrow(df), ")")) +
      theme(
        legend.position = "none",
        plot.title = element_text(hjust = 0.5, size = 14),
        axis.title.y = element_text(size = 12),
        axis.text.x = element_text(size = 12, angle = 45, hjust = 1),
        axis.title.x = element_blank()
      )

    roc_plot <- NULL
    if (!is.null(roc_obj)) {
      dd <- data.frame(
        fp = 1 - roc_obj$specificities,
        tp = roc_obj$sensitivities
      ) %>% arrange(desc(fp), tp)
      roc_plot <- ggplot(dd, aes(fp, tp)) +
        geom_line(linewidth = 1) +
        labs(x = "1-Specificity", y = "Sensitivity", color = NULL) +
        theme_bw(base_rect_size = 1.5) +
        geom_abline(slope = 1, color = "grey70") +
        ggtitle(str_c(ds$ID, " ROC")) +
        annotate("text", x = 0.7, y = 0.2, label = str_c("AUC: ", round(auc_val, 2)), color = "darkred") +
        theme(
          plot.title = element_text(hjust = 0.5, size = 14),
          axis.text = element_text(size = 11),
          axis.title = element_text(size = 13)
        )
    }

    plots[[length(plots) + 1L]] <- if (!is.null(roc_plot)) (box_plot + roc_plot) else box_plot
    stats[[length(stats) + 1L]] <- list(
      dataset = as.character(ds$ID),
      matched_by = matched$column,
      matched_samples = nrow(df),
      auc = auc_val,
      groups = as.list(table(df$response))
    )
  }

  if (length(plots) == 0) return(NULL)

  list(
    plot = wrap_plots(plots, ncol = 1),
    statistics = stats
  )
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
  smoke_tests <- list(
    risk_mcm7 = tryCatch(
      !is.null(invoke_transcriptome_fn("dbGIST_boxplot_Risk", "MCM7", variable = "Risk")),
      error = function(e) FALSE
    ),
    mutation_kit = tryCatch(
      !is.null(invoke_transcriptome_fn("dbGIST_boxplot_Mutation_ID", "KIT", variable = "Mutation_ID")),
      error = function(e) FALSE
    ),
    age_abl1 = tryCatch(
      !is.null(invoke_transcriptome_fn("dbGIST_boxplot_Age", "ABL1", variable = "Age")),
      error = function(e) FALSE
    ),
    survival_mcm7 = tryCatch({
      surv <- build_summary("MCM7")$survival
      !is.null(surv) && length(surv) > 0
    }, error = function(e) FALSE)
  )
  blockers <- character(0)

  if (datasets_loaded == 0) blockers <- c(blockers, "no_datasets_loaded")
  if (!all(unlist(required_functions, use.names = FALSE))) blockers <- c(blockers, "missing_required_functions")
  if (!all(unlist(smoke_tests, use.names = FALSE))) blockers <- c(blockers, "smoke_test_failure")

  list(
    module = "transcriptomics",
    ready = datasets_loaded > 0 &&
      all(unlist(required_functions, use.names = FALSE)) &&
      all(unlist(smoke_tests, use.names = FALSE)),
    datasets_loaded = datasets_loaded,
    required_functions = required_functions,
    smoke_tests = smoke_tests,
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
      "uses_dynamic_mrna_dataset_resolution"
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

    entry <- list(variable = name)
    tryCatch({
      p <- invoke_transcriptome_fn(fn_name, gene, variable = name)
      if (is.null(p)) {
        entry$error <- paste0("No data for ", gene, " in ", name)
      }
    }, error = function(e) {
      entry$error <<- conditionMessage(e)
    })
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
      aligned <- aligned_transcriptome_clinical(ds, gene = gene)
      if (is.null(aligned)) return(NULL)

      clinical_df <- aligned$clinical
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
      surv_formula <- as.formula(paste("Surv(", time_col, ",", event_col, ") ~ Expr"))
      cox_fit <- survival::coxph(formula = surv_formula, data = res.cat)
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
    found <- NULL
    for (idx in drug_resistance_indices()) {
      ds <- dbGIST_matrix[[idx]]
      if (!(gene %in% rownames(ds$Matrix)) || !("Imatinib" %in% colnames(ds$Clinical))) next

      aligned <- aligned_transcriptome_clinical(ds, gene = gene)
      if (is.null(aligned)) next

      values <- as.numeric(ds$Matrix[gene, ])
      response <- normalize_imatinib_response(aligned$clinical$Imatinib)
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

    entry <- list(variable = name)
    tryCatch({
      p <- invoke_transcriptome_fn(fn_name, gene, variable = name)
      if (!is.null(p)) {
        entry$plot <- plot_to_base64(p)
      } else {
        entry$error <- paste0("No data for ", gene, " in ", name)
      }
    }, error = function(e) {
      entry$error <<- conditionMessage(e)
    })
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
    return(list(
      gene = gene,
      type = type,
      error = paste0(
        "No mRNA cohort currently contains both ",
        gene,
        " expression and ",
        type,
        " survival endpoints"
      )
    ))
  }

  tryCatch({
    ds <- dbGIST_matrix[[surv_ds_idx]]
    aligned <- aligned_transcriptome_clinical(ds, gene = gene)
    if (is.null(aligned)) {
      return(list(gene = gene, type = type, error = "Unable to align matrix columns to clinical rows"))
    }

    clinical <- aligned$clinical
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

    surv_formula <- as.formula(paste("Surv(", time_col, ",", event_col, ") ~ Expr"))
    fit <- survival::survfit(surv_formula, data = res.cat)
    fit$call$formula <- surv_formula
    cox_fit <- survival::coxph(formula = surv_formula, data = res.cat)
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
    drug <- build_transcriptome_drug_response(gene)
    result <- list(gene = gene)

    if (!is.null(drug)) {
      result$plot <- plot_to_base64(drug$plot, width = 1200, height = 800)
      result$statistics <- drug$statistics
    } else {
      result$error <- paste0("No drug response data for ", gene)
    }

    result
  }, error = function(e) {
    list(gene = gene, error = conditionMessage(e))
  })
}
