#!/usr/bin/env Rscript

# Run the GIST Shiny application on port 4966 (Basic version)
# This script can be called from the GIST_web project

# Set working directory to the app directory
setwd(dirname(sys.frame(1)$ofile))

# Run the Shiny app on port 4966
shiny::runApp(
  appDir = ".",
  port = 4966,
  host = "0.0.0.0",
  launch.browser = FALSE
)
