# ---------------------------------------------------------------------------
# Start dbGIST Plumber API services
#
# Usage:
#   Rscript start_api.R                    # Start all APIs
#   Rscript start_api.R proteomics         # Start proteomics only (port 4966)
#   Rscript start_api.R phospho            # Start phospho only (port 4968)
#   Rscript start_api.R transcriptomics    # Start transcriptomics only (port 4970)
#   Rscript start_api.R singlecell         # Start singlecell only (port 4972)
#   Rscript start_api.R noncoding          # Start noncoding only (port 4974)
#
# Environment variables:
#   PROTEOMICS_PORT      (default: 4966)
#   PHOSPHO_PORT         (default: 4968)
#   TRANSCRIPTOMICS_PORT (default: 4970)
#   SINGLECELL_PORT      (default: 4972)
#   NONCODING_PORT       (default: 4974)
#   PROTEMIC_DIR         (default: ../GIST_Protemics)
#   PHOSPHO_DIR          (default: ../GIST_Phosphoproteomics)
#   TRANSCRIPTOME_DIR    (default: ../GIST_Transcriptome)
#   SINGLECELL_DIR       (default: ../GIST_SingleCell)
#   NONCODING_DIR        (default: ../GIST_noncoding)
# ---------------------------------------------------------------------------

library(plumber)

args <- commandArgs(trailingOnly = TRUE)
module <- if (length(args) > 0) args[1] else "all"

api_dir <- tryCatch(
  dirname(sys.frame(1)$ofile),
  error = function(e) {
    for (arg in commandArgs(trailingOnly = FALSE)) {
      if (grepl("^--file=", arg)) return(dirname(sub("^--file=", "", arg)))
    }
    getwd()
  }
)
if (is.null(api_dir) || api_dir == ".") api_dir <- getwd()

proteomics_port      <- as.integer(Sys.getenv("PROTEOMICS_PORT", "4966"))
phospho_port         <- as.integer(Sys.getenv("PHOSPHO_PORT", "4968"))
transcriptomics_port <- as.integer(Sys.getenv("TRANSCRIPTOMICS_PORT", "4970"))
singlecell_port      <- as.integer(Sys.getenv("SINGLECELL_PORT", "4972"))
noncoding_port       <- as.integer(Sys.getenv("NONCODING_PORT", "4974"))

start_proteomics <- function() {
  cat("🚀 Starting Proteomics API on port", proteomics_port, "...\n")
  pr <- plumber::plumb(file.path(api_dir, "plumber_proteomics.R"))
  pr$run(host = "0.0.0.0", port = proteomics_port)
}

start_phospho <- function() {
  cat("🚀 Starting Phosphoproteomics API on port", phospho_port, "...\n")
  pr <- plumber::plumb(file.path(api_dir, "plumber_phospho.R"))
  pr$run(host = "0.0.0.0", port = phospho_port)
}

start_transcriptomics <- function() {
  cat("🚀 Starting Transcriptomics API on port", transcriptomics_port, "...\n")
  pr <- plumber::plumb(file.path(api_dir, "plumber_transcriptomics.R"))
  pr$run(host = "0.0.0.0", port = transcriptomics_port)
}

start_singlecell <- function() {
  cat("🚀 Starting SingleCell API on port", singlecell_port, "...\n")
  pr <- plumber::plumb(file.path(api_dir, "plumber_singlecell.R"))
  pr$run(host = "0.0.0.0", port = singlecell_port)
}

start_noncoding <- function() {
  cat("🚀 Starting Noncoding API on port", noncoding_port, "...\n")
  pr <- plumber::plumb(file.path(api_dir, "plumber_noncoding.R"))
  pr$run(host = "0.0.0.0", port = noncoding_port)
}

if (module == "proteomics") {
  start_proteomics()
} else if (module == "phospho") {
  start_phospho()
} else if (module == "transcriptomics") {
  start_transcriptomics()
} else if (module == "singlecell") {
  start_singlecell()
} else if (module == "noncoding") {
  start_noncoding()
} else {
  # Start all in parallel using future
  if (!requireNamespace("future", quietly = TRUE)) {
    cat("⚠️  'future' package not installed. Starting proteomics API only.\n")
    cat("    To run all APIs, either:\n")
    cat("    1) Install future: install.packages('future')\n")
    cat("    2) Run each in a separate terminal:\n")
    cat("       Rscript start_api.R proteomics\n")
    cat("       Rscript start_api.R phospho\n")
    cat("       Rscript start_api.R transcriptomics\n")
    cat("       Rscript start_api.R singlecell\n")
    cat("       Rscript start_api.R noncoding\n\n")
    start_proteomics()
  } else {
    library(future)
    plan(multisession)

    cat("🚀 Starting all APIs ...\n")
    cat("   Proteomics:        http://0.0.0.0:", proteomics_port, "\n", sep = "")
    cat("   Phosphoproteomics: http://0.0.0.0:", phospho_port, "\n", sep = "")
    cat("   Transcriptomics:   http://0.0.0.0:", transcriptomics_port, "\n", sep = "")
    cat("   SingleCell:        http://0.0.0.0:", singlecell_port, "\n", sep = "")
    cat("   Noncoding:         http://0.0.0.0:", noncoding_port, "\n", sep = "")

    # Launch all except proteomics in background
    f1 <- future::future({
      pr <- plumber::plumb(file.path(api_dir, "plumber_phospho.R"))
      pr$run(host = "0.0.0.0", port = phospho_port)
    }, seed = TRUE)

    f2 <- future::future({
      pr <- plumber::plumb(file.path(api_dir, "plumber_transcriptomics.R"))
      pr$run(host = "0.0.0.0", port = transcriptomics_port)
    }, seed = TRUE)

    f3 <- future::future({
      pr <- plumber::plumb(file.path(api_dir, "plumber_singlecell.R"))
      pr$run(host = "0.0.0.0", port = singlecell_port)
    }, seed = TRUE)

    f4 <- future::future({
      pr <- plumber::plumb(file.path(api_dir, "plumber_noncoding.R"))
      pr$run(host = "0.0.0.0", port = noncoding_port)
    }, seed = TRUE)

    # Run proteomics in foreground (blocking)
    start_proteomics()
  }
}
