# ---------------------------------------------------------------------------
# Plumber REST API — dbGIST Noncoding RNA
#
# Wraps analysis functions from GIST_noncoding/noncoding.R as REST endpoints
# consumed by GIST_agent_pi's NoncodingClient.
#
# Endpoints:
#   GET  /health               → { "status": "ok" }
#   POST /proteins/check       → miRNA/circRNA/lncRNA availability
#   POST /analyze/batch        → batch clinical association plots (base64)
#   POST /analyze/drug-resistance → imatinib ROC analysis
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

NONCODING_DIR <- normalizePath(
  file.path(.this_dir, "..", "GIST_noncoding"),
  mustWork = FALSE
)

if (nzchar(Sys.getenv("NONCODING_DIR"))) {
  NONCODING_DIR <- Sys.getenv("NONCODING_DIR")
}

cat("📂 Noncoding dir:", NONCODING_DIR, "\n")

suppressPackageStartupMessages({
  library(data.table)
  library(stringr)
  library(ggpubr)
  library(tidyverse)
  library(ggplot2)
  library(ggsci)
  library(patchwork)
  library(pROC)
})

# Load the data matrix (same file as transcriptome, but uses indices 15-28)
rds_path <- file.path(NONCODING_DIR, "dbGIST_matrix_20250828.rds")
# Fallback: try transcriptome directory
if (!file.exists(rds_path)) {
  rds_path <- normalizePath(
    file.path(.this_dir, "..", "GIST_Transcriptome", "dbGIST_matrix_20250828.rds"),
    mustWork = FALSE
  )
}
if (!file.exists(rds_path)) {
  stop("❌ Cannot find dbGIST_matrix_20250828.rds")
}
cat("📦 Loading dbGIST_matrix_20250828.rds ...\n")
dbGIST_matrix <- readRDS(rds_path)
assign("dbGIST_matrix", dbGIST_matrix, envir = .GlobalEnv)
cat("✅ Loaded", length(dbGIST_matrix), "datasets\n")

# Source the noncoding analysis functions
fn_path <- file.path(NONCODING_DIR, "noncoding.R")
if (!file.exists(fn_path)) {
  stop("❌ Cannot find noncoding.R at: ", fn_path)
}

ID <- "hsa-miR-21-5p"  # dummy so inline test lines don't error
assign("ID", ID, envir = .GlobalEnv)
cat("📦 Loading analysis functions from noncoding.R ...\n")
old_wd <- getwd()
setwd(NONCODING_DIR)
tryCatch(
  source(fn_path, local = FALSE),
  error = function(e) cat("⚠️ Non-fatal source error:", conditionMessage(e), "\n")
)
setwd(old_wd)
cat("✅ Analysis functions loaded\n")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

`%||%` <- function(x, y) {
  if (is.null(x)) y else x
}

dataset_class <- function(ds) {
  tolower(trimws(as.character(ds$Class %||% "")))
}

dataset_id <- function(ds) {
  as.character(ds$ID %||% "")
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

NONCODING_DATASET_IDS <- list(
  miRNA = c("GSE31741", "GSE36087", "GSE45901", "GSE63159", "GSE156715", "GSE89051"),
  circRNA = c("GSE131481_circRNA", "GSE147303"),
  lncRNA = c("GSE131481_LncRNA", "GSE155800")
)

NONCODING_FUNCTION_DATASETS <- list(
  TvsN = c("GSE89051"),
  Risk = c("GSE31741", "GSE89051"),
  Age = c("GSE31741", "GSE89051"),
  Site = c("GSE31741", "GSE36087"),
  Gender = c("GSE31741", "GSE89051"),
  Mitotic = c("GSE36087"),
  Tumor_size = c("GSE36087"),
  IM_Treat = c("GSE63159"),
  Relapse = c("GSE156715"),
  Drug = c("GSE45901"),
  circRNA_TvsN = c("GSE131481_circRNA", "GSE147303")
)

miRNA_ID <- find_dataset_indices(ids = NONCODING_DATASET_IDS$miRNA, classes = "mirna")
circRNA_ID <- find_dataset_indices(ids = NONCODING_DATASET_IDS$circRNA, classes = "circrna")
lncRNA_ID <- find_dataset_indices(ids = NONCODING_DATASET_IDS$lncRNA, classes = "lncrna")
ALL_NONCODING_ID <- c(miRNA_ID, circRNA_ID, lncRNA_ID)

plot_to_base64 <- function(p, width = 800, height = 600, res = 150) {
  if (is.null(p)) return(NULL)
  tmp <- tempfile(fileext = ".png")
  on.exit(unlink(tmp), add = TRUE)
  png(tmp, width = width, height = height, res = res)
  tryCatch(print(p), error = function(e) NULL)
  dev.off()
  base64enc::base64encode(tmp)
}

#' Detect the RNA type for a given ID
detect_rna_type <- function(id) {
  # miRNA: hsa-miR-*, hsa-let-*
  if (grepl("^hsa-", id, ignore.case = TRUE)) return("miRNA")
  # circRNA: hsa_circ_*, circRNA identifiers
  if (grepl("circ", id, ignore.case = TRUE)) return("circRNA")
  # lncRNA: common lncRNA patterns
  if (grepl("^LINC|^MIR.*HG|^NEAT|^MALAT|^XIST|^HOTAIR|^MEG|^PVT|^SNHG|^DANCR|^TUG", id, ignore.case = TRUE)) return("lncRNA")
  # Default: check which datasets contain the ID
  for (idx in miRNA_ID) {
    if (idx <= length(dbGIST_matrix) && id %in% rownames(dbGIST_matrix[[idx]]$Matrix)) return("miRNA")
  }
  for (idx in circRNA_ID) {
    if (idx <= length(dbGIST_matrix) && id %in% rownames(dbGIST_matrix[[idx]]$Matrix)) return("circRNA")
  }
  for (idx in lncRNA_ID) {
    if (idx <= length(dbGIST_matrix) && id %in% rownames(dbGIST_matrix[[idx]]$Matrix)) return("lncRNA")
  }
  "unknown"
}

#' Check if an ID exists in the noncoding datasets
gene_in_datasets <- function(id) {
  rna_type <- detect_rna_type(id)

  target_ids <- switch(rna_type,
    miRNA   = miRNA_ID,
    circRNA = circRNA_ID,
    lncRNA  = lncRNA_ID,
    ALL_NONCODING_ID
  )

  hits <- vapply(target_ids, function(idx) {
    if (idx > length(dbGIST_matrix)) return(FALSE)
    id %in% rownames(dbGIST_matrix[[idx]]$Matrix)
  }, logical(1))

  ds_names <- vapply(target_ids[hits], function(idx) {
    as.character(dbGIST_matrix[[idx]]$ID)
  }, character(1))

  list(
    available = any(hits),
    datasets  = ds_names,
    rna_type  = rna_type
  )
}

# Clinical analysis function map for miRNA
MIRNA_CLINICAL_FUNCTIONS <- list(
  TvsN              = "dbGIST_miRNA_boxplot_TvsN",
  Risk              = "dbGIST_miRNA_boxplot_Risk",
  Age               = "dbGIST_miRNA_boxplot_Age",
  Site              = "dbGIST_miRNA_boxplot_Site",
  Gender            = "dbGIST_miRNA_boxplot_Gender",
  Mitotic           = "dbGIST_miRNA_boxplot_Mitotic.count",
  Tumor_size        = "dbGIST_miRNA_boxplot_Tumor_size",
  IM_Treat          = "dbGIST_miRNA_boxplot_IM.Treat",
  Relapse           = "dbGIST_miRNA_boxplot_Relapse.Unrelapse"
)

# Clinical analysis function map for circRNA
CIRCRNA_CLINICAL_FUNCTIONS <- list(
  TvsN = "dbGIST_circRNA_boxplot_TvsN"
)

LNCRNA_CLINICAL_FUNCTIONS <- list()

noncoding_function_map <- function(rna_type) {
  switch(rna_type,
    miRNA = MIRNA_CLINICAL_FUNCTIONS,
    circRNA = CIRCRNA_CLINICAL_FUNCTIONS,
    lncRNA = LNCRNA_CLINICAL_FUNCTIONS,
    list()
  )
}

invoke_noncoding_fn <- function(fn_name, id, variable, rna_type) {
  fn <- tryCatch(get(fn_name, envir = .GlobalEnv), error = function(e) NULL)
  if (is.null(fn)) {
    stop(paste0("Function ", fn_name, " not found"))
  }

  db_ids <- if (rna_type == "circRNA" && identical(variable, "TvsN")) {
    NONCODING_FUNCTION_DATASETS$circRNA_TvsN
  } else {
    NONCODING_FUNCTION_DATASETS[[variable]]
  }
  db_arg <- if (!is.null(db_ids)) subset_datasets(ids = db_ids) else NULL

  args <- list(ID = id)
  if (!is.null(db_arg)) args$DB <- db_arg
  do.call(fn, args)
}

drug_resistance_dataset_index <- function() {
  idx <- find_dataset_indices(ids = NONCODING_FUNCTION_DATASETS$Drug, classes = "mirna")
  if (length(idx) == 0) integer(0) else idx[1]
}

required_function_status <- function(function_names) {
  setNames(
    lapply(function_names, function(name) exists(name, envir = .GlobalEnv, inherits = FALSE)),
    function_names
  )
}

build_readiness <- function() {
  started_at <- Sys.time()
  datasets_loaded <- sum(vapply(ALL_NONCODING_ID, function(idx) {
    idx <= length(dbGIST_matrix) && !is.null(dbGIST_matrix[[idx]]$Matrix)
  }, logical(1)))
  required_functions <- required_function_status(unique(c(
    unname(unlist(MIRNA_CLINICAL_FUNCTIONS, use.names = FALSE)),
    unname(unlist(CIRCRNA_CLINICAL_FUNCTIONS, use.names = FALSE)),
    "dbGIST_miRNA_boxplot_roc_IM.Treat"
  )))
  blockers <- character(0)

  if (datasets_loaded == 0) blockers <- c(blockers, "no_datasets_loaded")
  if (!all(unlist(required_functions, use.names = FALSE))) blockers <- c(blockers, "missing_required_functions")

  list(
    module = "noncoding",
    ready = datasets_loaded > 0 && all(unlist(required_functions, use.names = FALSE)),
    datasets_loaded = datasets_loaded,
    required_functions = required_functions,
    blockers = blockers,
    warmup_ms = as.integer(round(as.numeric(difftime(Sys.time(), started_at, units = "secs")) * 1000)),
    notes = c(
      "legacy_wrapper",
      "supports_health_ready_capabilities",
      "accepts_mirna_circrna_lncrna_identifiers"
    )
  )
}

build_capabilities <- function() {
  list(
    module = "noncoding",
    label = "非编码RNA",
    supports = list(
      gene_check = TRUE,
      batch = TRUE,
      survival = FALSE,
      drug_resistance = TRUE,
      plots = TRUE,
      async_jobs = FALSE,
      summary_mode = TRUE,
      render_mode = FALSE
    ),
    analyses = c(
      "availability",
      "clinical",
      "drug_response"
    ),
    artifact_kinds = c("png"),
    latency_class = "medium",
    notes = c(
      "current_api_is_legacy_full_mode",
      "requires_noncoding_identifier_not_protein_symbol",
      "lncrna_currently_supports_availability_only"
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
    datasets = info$datasets,
    rna_type = info$rna_type
  )

  if (!info$available) {
    return(result)
  }

  fn_map <- noncoding_function_map(info$rna_type)

  clinical <- unname(lapply(names(fn_map), function(name) {
    fn_name <- fn_map[[name]]

    entry <- list(variable = name)
    tryCatch({
      p <- invoke_noncoding_fn(fn_name, gene, name, info$rna_type)
      if (is.null(p)) {
        entry$error <- paste0("No data for ", gene, " in ", name)
      }
    }, error = function(e) {
      entry$error <<- conditionMessage(e)
    })
    entry
  }))
  if (length(clinical) > 0) result$clinical_associations <- clinical

  drug_resistance <- tryCatch({
    ds_idx <- drug_resistance_dataset_index()
    if (length(ds_idx) == 0) {
      NULL
    } else {
      ds <- dbGIST_matrix[[ds_idx]]
      if (!(gene %in% rownames(ds$Matrix)) || !("Imatinib" %in% colnames(ds$Clinical))) {
        return(NULL)
      }
      values <- as.numeric(ds$Matrix[gene, ])
      response <- ds$Clinical$Imatinib
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
    }
  }, error = function(e) NULL)
  if (!is.null(drug_resistance)) result$drug_resistance <- drug_resistance

  result
}

# =========================================================================
# Plumber API definition
# =========================================================================

#* @apiTitle dbGIST Noncoding RNA API
#* @apiDescription REST wrapper around GIST noncoding RNA analysis functions

#* Health check
#* @get /health
function() {
  list(status = "ok", module = "noncoding", datasets = length(ALL_NONCODING_ID))
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
#* @param gene:str miRNA/circRNA/lncRNA ID
function(gene = "") {
  build_summary(gene)
}

#* Check noncoding RNA availability across datasets
#* @post /proteins/check
#* @param gene_symbols:str Comma-separated miRNA/circRNA/lncRNA IDs
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
      datasets  = info$datasets,
      rna_type  = info$rna_type
    )
  })

  list(results = results)
}

#* Batch clinical association analysis
#* @post /analyze/batch
#* @param gene:str miRNA/circRNA/lncRNA ID
function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, analyses = list()))
  }

  rna_type <- detect_rna_type(gene)

  # Pick the right function map based on RNA type
  fn_map <- noncoding_function_map(rna_type)

  analyses <- list()
  for (name in names(fn_map)) {
    fn_name <- fn_map[[name]]

    entry <- list(variable = name)
    tryCatch({
      p <- invoke_noncoding_fn(fn_name, gene, name, rna_type)
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

  list(gene = gene, rna_type = rna_type, analyses = analyses)
}

#* Drug resistance analysis (Imatinib ROC)
#* @post /analyze/drug-resistance
#* @param gene:str miRNA/circRNA/lncRNA ID
function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, error = "Empty gene/miRNA symbol"))
  }

  tryCatch({
    if (detect_rna_type(gene) != "miRNA") {
      return(list(gene = gene, error = "Drug resistance analysis currently supports miRNA only"))
    }

    fn <- tryCatch(get("dbGIST_miRNA_boxplot_roc_IM.Treat", envir = .GlobalEnv), error = function(e) NULL)
    if (is.null(fn)) {
      return(list(gene = gene, error = "dbGIST_miRNA_boxplot_roc_IM.Treat function not found"))
    }

    p <- fn(ID = gene, DB = subset_datasets(ids = NONCODING_FUNCTION_DATASETS$Drug, classes = "mirna"))

    result <- list(gene = gene)

    if (!is.null(p)) {
      result$plot <- plot_to_base64(p, width = 1200, height = 600)

      # Try to extract AUC from dataset 17
      tryCatch({
        ds_idx <- drug_resistance_dataset_index()
        if (length(ds_idx) > 0) {
          ds <- dbGIST_matrix[[ds_idx]]
        if (gene %in% rownames(ds$Matrix) && "Imatinib" %in% colnames(ds$Clinical)) {
          values <- as.numeric(ds$Matrix[gene, ])
          response <- ds$Clinical$Imatinib
          df <- data.frame(val = values, grp = response, stringsAsFactors = FALSE)
          df <- na.omit(df)

          auc_val <- NULL
          if (length(unique(df$grp)) == 2) {
            tryCatch({
              roc_obj <- pROC::roc(df$grp, df$val, quiet = TRUE)
              auc_val <- as.numeric(pROC::auc(roc_obj))
            }, error = function(e) NULL)
          }

          result$statistics <- list(
            auc       = auc_val,
            n_samples = nrow(df)
          )
        }
        }
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
