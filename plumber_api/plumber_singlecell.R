# ---------------------------------------------------------------------------
# Plumber REST API — dbGIST Single Cell
#
# Wraps analysis functions from GIST_SingleCell/global.R as REST endpoints
# consumed by GIST_agent_pi's SinglecellClient.
#
# Endpoints:
#   GET  /health               → { "status": "ok" }
#   POST /proteins/check       → gene availability across Seurat datasets
#   POST /analyze/batch        → violin plots per dataset (base64)
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

SINGLECELL_DIR <- normalizePath(
  file.path(.this_dir, "..", "GIST_SingleCell"),
  mustWork = FALSE
)

if (nzchar(Sys.getenv("SINGLECELL_DIR"))) {
  SINGLECELL_DIR <- Sys.getenv("SINGLECELL_DIR")
}

cat("📂 SingleCell dir:", SINGLECELL_DIR, "\n")

suppressPackageStartupMessages({
  library(ggplot2)
  library(ggsci)
  library(ggpubr)
  library(patchwork)
  library(Seurat)
})

# Source the analysis functions (creates get_dataset, create_violin_plot, etc.)
fn_path <- file.path(SINGLECELL_DIR, "global.R")
if (!file.exists(fn_path)) {
  stop("❌ Cannot find global.R at: ", fn_path)
}

cat("📦 Loading analysis functions from global.R ...\n")
old_wd <- getwd()
setwd(SINGLECELL_DIR)
Sys.setenv(ENABLE_AI_ANALYSIS = "false")
tryCatch(
  source(fn_path, local = FALSE),
  error = function(e) cat("⚠️ Non-fatal source error:", conditionMessage(e), "\n")
)
setwd(old_wd)
cat("✅ Analysis functions loaded\n")

# ---------------------------------------------------------------------------
# Constants — dataset names
# ---------------------------------------------------------------------------

DATASET_NAMES <- c("In_house_ssc", "GSE162115_ssc", "GSE254762_ssc")
JOB_STORE <- new.env(parent = emptyenv())
JOB_TTL_SECONDS <- 30 * 60

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

#' Safely load a Seurat dataset using the get_dataset function from global.R
safe_get_dataset <- function(name) {
  tryCatch({
    # Prefer the robust lazy loader defined later in global.R when available.
    if (exists("load_dataset_by_key", envir = .GlobalEnv)) {
      ds <- get("load_dataset_by_key", envir = .GlobalEnv)(name)
      if (!is.null(ds)) return(ds)
    }

    if (exists("get_dataset", envir = .GlobalEnv)) {
      ds <- get("get_dataset", envir = .GlobalEnv)(name)
      if (!is.null(ds)) return(ds)
    }

    # Final fallback: load the expected RDS directly from disk.
    candidate_files <- c(
      paste0(name, "_reduce.RDS"),
      if (identical(name, "GSE254762_ssc")) "GSE254762_ssc_reduce20250922.RDS"
    )
    candidate_files <- candidate_files[nzchar(candidate_files)]

    for (filename in candidate_files) {
      full_path <- file.path(SINGLECELL_DIR, filename)
      if (file.exists(full_path)) {
        cat("📊 Fallback loading dataset:", full_path, "\n")
        ds <- readRDS(full_path)
        assign(name, ds, envir = .GlobalEnv)
        return(ds)
      }
    }

    cat("⚠️ Dataset file not found for", name, "\n")
    NULL
  }, error = function(e) {
      cat("⚠️ Failed to load dataset", name, ":", conditionMessage(e), "\n")
      NULL
    }
  )
}

required_function_status <- function(function_names) {
  setNames(
    lapply(function_names, function(name) exists(name, envir = .GlobalEnv, inherits = FALSE)),
    function_names
  )
}

build_readiness <- function() {
  started_at <- Sys.time()
  datasets_loaded <- sum(vapply(DATASET_NAMES, function(name) {
    !is.null(safe_get_dataset(name))
  }, logical(1)))
  required_functions <- required_function_status(c(
    "get_dataset",
    "load_dataset_by_key",
    "create_violin_plot",
    "create_umap_gene_plot"
  ))
  blockers <- character(0)

  if (datasets_loaded == 0) blockers <- c(blockers, "no_datasets_loaded")
  if (!all(unlist(required_functions, use.names = FALSE))) blockers <- c(blockers, "missing_required_functions")

  list(
    module = "singlecell",
    ready = datasets_loaded > 0 && all(unlist(required_functions, use.names = FALSE)),
    datasets_loaded = datasets_loaded,
    required_functions = required_functions,
    blockers = blockers,
    warmup_ms = as.integer(round(as.numeric(difftime(Sys.time(), started_at, units = "secs")) * 1000)),
    notes = c(
      "legacy_wrapper",
      "supports_health_ready_capabilities",
      "batch_returns_violin_and_optional_umap_plots"
    )
  )
}

build_capabilities <- function() {
  list(
    module = "singlecell",
    label = "单细胞",
    supports = list(
      gene_check = TRUE,
      batch = TRUE,
      survival = FALSE,
      drug_resistance = FALSE,
      plots = TRUE,
      async_jobs = TRUE,
      summary_mode = TRUE,
      render_mode = FALSE
    ),
    analyses = c(
      "availability",
      "cell_type_expression",
      "umap_gene_overlay"
    ),
    artifact_kinds = c("png"),
    latency_class = "high",
    notes = c(
      "current_api_is_legacy_full_mode",
      "singlecell_cold_start_may_be_slower_than_other_modules"
    )
  )
}

build_summary <- function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, available = FALSE, datasets = character(0)))
  }

  dataset_hits <- character(0)
  cell_type_plots <- list()

  for (ds_name in DATASET_NAMES) {
    ds <- safe_get_dataset(ds_name)
    if (!gene_in_seurat(ds, gene)) next

    dataset_hits <- c(dataset_hits, ds_name)
    cell_type_plots[[length(cell_type_plots) + 1]] <- list(dataset = ds_name)
  }

  result <- list(
    gene = gene,
    available = length(dataset_hits) > 0,
    datasets = dataset_hits
  )
  if (length(cell_type_plots) > 0) result$cell_type_plots <- cell_type_plots
  result
}

build_batch_analysis <- function(gene = "") {
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    return(list(gene = gene, analyses = list()))
  }

  violin_fn <- tryCatch(get("create_violin_plot", envir = .GlobalEnv), error = function(e) NULL)
  umap_gene_fn <- tryCatch(get("create_umap_gene_plot", envir = .GlobalEnv), error = function(e) NULL)

  analyses <- list()
  for (ds_name in DATASET_NAMES) {
    ds <- safe_get_dataset(ds_name)
    entry <- list(variable = ds_name)

    if (is.null(ds) || !gene_in_seurat(ds, gene)) {
      entry$error <- paste0(gene, " not found in ", ds_name)
    } else {
      if (!is.null(violin_fn)) {
        tryCatch({
          p <- violin_fn(ds, gene)
          if (!is.null(p)) {
            entry$plot <- plot_to_base64(p)
          }
        }, error = function(e) {
          entry$error <<- conditionMessage(e)
        })
      }

      if (!is.null(umap_gene_fn)) {
        tryCatch({
          p_umap <- umap_gene_fn(ds, gene)
          if (!is.null(p_umap)) {
            entry$umap_plot <- plot_to_base64(p_umap)
          }
        }, error = function(e) {
          cat("⚠️ UMAP plot error for", ds_name, ":", conditionMessage(e), "\n")
        })
      }
    }
    analyses[[ds_name]] <- entry
  }

  list(gene = gene, analyses = analyses)
}

#' Check if a gene exists in a Seurat object
gene_in_seurat <- function(dataset, gene) {
  if (is.null(dataset)) return(FALSE)
  gene %in% rownames(dataset)
}

now_iso <- function(ts = Sys.time()) {
  format(as.POSIXct(ts, tz = "UTC"), "%Y-%m-%dT%H:%M:%OS3Z", tz = "UTC")
}

new_job_id <- function() {
  paste0(
    "job_sc_",
    format(Sys.time(), "%Y%m%d%H%M%S"),
    "_",
    paste(sample(c(letters, LETTERS, 0:9), 8, replace = TRUE), collapse = "")
  )
}

get_job_entry <- function(job_id) {
  if (!exists(job_id, envir = JOB_STORE, inherits = FALSE)) return(NULL)
  get(job_id, envir = JOB_STORE, inherits = FALSE)
}

set_job_entry <- function(job_id, entry) {
  assign(job_id, entry, envir = JOB_STORE)
  entry
}

job_payload <- function(entry) {
  payload <- list(
    job_id = entry$job_id,
    module = "singlecell",
    status = entry$status,
    mode = entry$mode,
    gene = entry$gene,
    progress = entry$progress,
    stage = entry$stage,
    created_at = entry$created_at,
    updated_at = entry$updated_at
  )
  if (!is.null(entry$error) && nzchar(entry$error)) payload$error <- entry$error
  payload
}

cleanup_job_store <- function() {
  job_ids <- ls(JOB_STORE, all.names = TRUE)
  if (length(job_ids) == 0) return(invisible(NULL))

  now_ts <- as.numeric(Sys.time())
  for (job_id in job_ids) {
    entry <- get_job_entry(job_id)
    if (is.null(entry)) next
    if ((now_ts - (entry$updated_ts %||% now_ts)) > JOB_TTL_SECONDS) {
      rm(list = job_id, envir = JOB_STORE)
    }
  }
}

`%||%` <- function(x, y) if (is.null(x)) y else x

compute_job_result <- function(mode = "full", gene = "", analysis = NULL) {
  switch(
    mode,
    summary = build_summary(gene),
    full = build_batch_analysis(gene),
    render = build_batch_analysis(gene),
    stop("Unsupported job mode: ", mode)
  )
}

refresh_job_entry <- function(job_id) {
  entry <- get_job_entry(job_id)
  if (is.null(entry) || is.null(entry$child) || entry$status %in% c("completed", "failed")) {
    return(entry)
  }

  collected <- tryCatch(
    parallel::mccollect(entry$child, wait = FALSE),
    error = function(e) list(.collector_error = conditionMessage(e))
  )

  if (is.null(collected)) {
    return(entry)
  }

  entry$child <- NULL
  entry$updated_at <- now_iso()
  entry$updated_ts <- as.numeric(Sys.time())

  if (!is.null(collected$.collector_error)) {
    entry$status <- "failed"
    entry$progress <- 1
    entry$stage <- "failed"
    entry$error <- collected$.collector_error
    return(set_job_entry(job_id, entry))
  }

  value <- unname(collected)[[1]]
  if (is.list(value) && isTRUE(value$.job_failed)) {
    entry$status <- "failed"
    entry$progress <- 1
    entry$stage <- "failed"
    entry$error <- value$error %||% "Async job failed"
    return(set_job_entry(job_id, entry))
  }

  entry$status <- "completed"
  entry$progress <- 1
  entry$stage <- "done"
  entry$result <- value
  set_job_entry(job_id, entry)
}

create_job <- function(mode = "full", gene = "", analysis = NULL) {
  cleanup_job_store()

  mode <- trimws(mode)
  gene <- trimws(gene)
  if (!nzchar(gene)) {
    stop("gene is required")
  }
  if (!(mode %in% c("summary", "full", "render"))) {
    stop("Unsupported job mode: ", mode)
  }

  job_id <- new_job_id()
  created_ts <- as.numeric(Sys.time())
  entry <- list(
    job_id = job_id,
    mode = mode,
    gene = gene,
    status = "queued",
    progress = 0,
    stage = "queued",
    created_at = now_iso(),
    updated_at = now_iso(),
    created_ts = created_ts,
    updated_ts = created_ts,
    child = NULL,
    result = NULL,
    error = NULL
  )

  if (.Platform$OS.type == "windows") {
    value <- tryCatch(
      compute_job_result(mode = mode, gene = gene, analysis = analysis),
      error = function(e) list(.job_failed = TRUE, error = conditionMessage(e))
    )
    if (is.list(value) && isTRUE(value$.job_failed)) {
      entry$status <- "failed"
      entry$progress <- 1
      entry$stage <- "failed"
      entry$error <- value$error %||% "Synchronous job failed"
    } else {
      entry$status <- "completed"
      entry$progress <- 1
      entry$stage <- "done"
      entry$result <- value
    }
    entry$updated_at <- now_iso()
    entry$updated_ts <- as.numeric(Sys.time())
    set_job_entry(job_id, entry)
    return(job_payload(entry))
  }

  child <- parallel::mcparallel(
    tryCatch(
      compute_job_result(mode = mode, gene = gene, analysis = analysis),
      error = function(e) list(.job_failed = TRUE, error = conditionMessage(e))
    ),
    silent = TRUE,
    detached = FALSE
  )

  entry$child <- child
  entry$status <- "running"
  entry$progress <- if (identical(mode, "summary")) 0.4 else 0.1
  entry$stage <- if (identical(mode, "summary")) "summary" else "render_plots"
  entry$updated_at <- now_iso()
  entry$updated_ts <- as.numeric(Sys.time())
  set_job_entry(job_id, entry)
  job_payload(entry)
}

# =========================================================================
# Plumber API definition
# =========================================================================

#* @apiTitle dbGIST Single Cell API
#* @apiDescription REST wrapper around GIST single-cell analysis functions

#* Health check
#* @get /health
function() {
  list(status = "ok", module = "singlecell", datasets = length(DATASET_NAMES))
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

#* Create async analysis job
#* @post /jobs
#* @param gene:str Gene symbol
#* @param mode:str summary|full|render
#* @param analysis Analysis hints (optional)
function(gene = "", mode = "full", analysis = NULL, res) {
  tryCatch(
    create_job(mode = mode, gene = gene, analysis = analysis),
    error = function(e) {
      res$status <- 400
      list(
        module = "singlecell",
        status = "failed",
        error = conditionMessage(e)
      )
    }
  )
}

#* Inspect async analysis job
#* @get /jobs/<job_id>
function(job_id = "", res) {
  cleanup_job_store()
  entry <- refresh_job_entry(job_id)
  if (is.null(entry)) {
    res$status <- 404
    return(list(
      module = "singlecell",
      job_id = job_id,
      status = "not_found",
      error = "Job not found"
    ))
  }
  job_payload(entry)
}

#* Fetch async analysis job result
#* @get /jobs/<job_id>/result
function(job_id = "", res) {
  cleanup_job_store()
  entry <- refresh_job_entry(job_id)
  if (is.null(entry)) {
    res$status <- 404
    return(list(
      module = "singlecell",
      job_id = job_id,
      status = "not_found",
      error = "Job not found"
    ))
  }
  if (entry$status == "failed") {
    res$status <- 500
    return(list(
      module = "singlecell",
      job_id = job_id,
      status = "failed",
      error = entry$error %||% "Job failed"
    ))
  }
  if (entry$status != "completed") {
    res$status <- 202
    return(job_payload(entry))
  }
  entry$result
}

#* Check gene availability across Seurat datasets
#* @post /proteins/check
#* @param gene_symbols:str Comma-separated gene symbols
function(gene_symbols = "") {
  symbols <- trimws(unlist(strsplit(gene_symbols, ",")))
  symbols <- symbols[nzchar(symbols)]

  if (length(symbols) == 0) {
    return(list(results = list()))
  }

  results <- lapply(symbols, function(sym) {
    available_datasets <- character(0)
    for (ds_name in DATASET_NAMES) {
      ds <- safe_get_dataset(ds_name)
      if (gene_in_seurat(ds, sym)) {
        available_datasets <- c(available_datasets, ds_name)
      }
    }
    list(
      gene      = sym,
      available = length(available_datasets) > 0,
      datasets  = available_datasets
    )
  })

  list(results = results)
}

#* Batch analysis — violin plots per dataset
#* @post /analyze/batch
#* @param gene:str Gene symbol
function(gene = "") {
  build_batch_analysis(gene)
}
