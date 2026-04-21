#!/usr/bin/env python3
"""Patch a Shiny app.R / ui.R+server.R to support per-request ?mode=ai|basic.

Usage:
  python3 patch_shiny_mode.py <APP_R_PATH>

Idempotent? No — run only once. Backs up to APP.bak.<ts> first (caller does it).

Strategy:
  1) Insert %||% helper + .resolve_app_mode() near top (after first options() call).
  2) Wrap `app_ui <- bs4DashPage(...)` (or similar) into `app_ui <- function(request) { ... }`
     with a local enable_ai resolution from ?mode=. Body unchanged.
  3) In app_server, add the same resolution at the top.

Only intended for the GIST_Transcriptome / GIST_*  apps that follow the
'app_ui <- bs4DashPage(... )' single-file pattern with `enable_ai` global.
"""
import re
import sys

def patch(path):
    with open(path) as f:
        src = f.read()

    helper = (
        "\n# ---- Step 10 (2026-04-21): per-request AI/basic mode via URL ?mode= ----\n"
        "`%||%` <- function(a, b) if (is.null(a) || length(a) == 0) b else a\n"
        ".resolve_app_mode <- function(query_string) {\n"
        "  qs <- shiny::parseQueryString(query_string %||% \"\")\n"
        "  m <- qs$mode\n"
        "  if (length(m) && m %in% c(\"basic\", \"noai\", \"0\")) return(\"basic\")\n"
        "  if (length(m) && m %in% c(\"ai\", \"1\"))             return(\"ai\")\n"
        "  NULL  # no override -> caller falls back to global enable_ai\n"
        "}\n"
    )

    # Insert helper after the first options() call we can find. Several anchors tried.
    anchors = [
        "options(shiny.trust.proxy.headers = TRUE)",
        "options(shiny.maxRequestSize",
    ]
    inserted = False
    for a in anchors:
        if a in src:
            src = src.replace(a, a + "\n" + helper, 1)
            inserted = True
            break
    if not inserted:
        # Fall back: insert after the first library() call block we find.
        m = re.search(r"\}\)\s*\n", src)  # end of suppressPackageStartupMessages({...})
        if m:
            src = src[:m.end()] + "\n" + helper + "\n" + src[m.end():]
            inserted = True
    if not inserted:
        print("ERROR: no anchor found to insert helper", file=sys.stderr)
        sys.exit(2)

    # Wrap app_ui from a static value into function(request) { ... }
    # We assume `app_ui <- bs4DashPage(` opens a multi-line call ending with ')'
    # right before `app_server <- function(`.
    open_pat = "app_ui <- bs4DashPage("
    if open_pat not in src:
        # Try generic dashboardPage / fluidPage / etc.
        m = re.search(r"^(app_ui|ui)\s*<-\s*([A-Za-z0-9_.]+)\(", src, re.MULTILINE)
        if not m:
            print("ERROR: app_ui open anchor not found", file=sys.stderr)
            sys.exit(3)
        open_pat = m.group(0)
    new_open = (
        "app_ui <- function(request) {\n"
        "  .mode <- .resolve_app_mode(request$QUERY_STRING)\n"
        "  if (!is.null(.mode)) enable_ai <- (.mode == \"ai\")\n"
        "  " + open_pat
    )
    src = src.replace(open_pat, new_open, 1)

    # Insert closing '}' before app_server <- function definition
    m = re.search(r"\n(app_server <- function|server\s*<-\s*function)", src)
    if not m:
        print("ERROR: app_server anchor not found", file=sys.stderr)
        sys.exit(4)
    src = src[:m.start()] + "\n}\n" + src[m.start():]

    # Add per-request mode resolution at top of app_server.
    # Use plain str.replace to avoid re.sub escape pitfalls.
    srv_anchor = "app_server <- function(input, output, session) {\n"
    if srv_anchor not in src:
        # Try generic server signature
        m = re.search(r"(app_server|server)\s*<-\s*function\([^)]*\)\s*\{\n", src)
        if not m:
            print("ERROR: app_server signature anchor not found", file=sys.stderr)
            sys.exit(5)
        srv_anchor = m.group(0)
    srv_inject = (
        srv_anchor
        + "  .mode <- .resolve_app_mode(session$clientData$url_search)\n"
        + '  if (!is.null(.mode)) enable_ai <- (.mode == "ai")\n'
        + "\n"
    )
    src = src.replace(srv_anchor, srv_inject, 1)

    with open(path, "w") as f:
        f.write(src)
    print(f"updated {path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: patch_shiny_mode.py <APP_R_PATH>", file=sys.stderr)
        sys.exit(1)
    patch(sys.argv[1])
