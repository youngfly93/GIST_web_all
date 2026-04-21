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

def patch(path, ui_only=False, server_only=False, helpers_only=False):
    """Modes:
       - default (no flag): single-file app — insert helpers near top, wrap UI, inject server
       - --helpers-only: split-mode global.R — append helpers at end (Shiny sources first)
       - --ui-only: split-mode ui.R — wrap UI only, helpers assumed in global.R
       - --server-only: split-mode server.R — inject server top only, helpers from global.R"""
    with open(path) as f:
        src = f.read()
    # Skip if already patched (idempotent).
    if helpers_only and ".resolve_app_mode" in src:
        print(f"already patched: {path}")
        return
    if (ui_only or server_only) and ".resolve_app_mode(request$QUERY_STRING)" in src:
        print(f"already patched: {path}")
        return

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

    # Insert helper.
    if helpers_only:
        # Append at end (works for global.R; Shiny sources global.R before ui/server)
        src = src.rstrip() + "\n\n" + helper + "\n"
    elif not (ui_only or server_only):
        # Single-file mode: insert near top after first options() or library block.
        anchor_patterns = [
            r"^options\(shiny\.trust\.proxy\.headers\s*=\s*TRUE\)\s*$",
            r"^options\(shiny\.maxRequestSize[^)]*\)\s*$",
            r"^\}\)\s*$",  # closing of suppressPackageStartupMessages({ ... })
        ]
        inserted = False
        for pat in anchor_patterns:
            m = re.search(pat, src, re.MULTILINE)
            if m:
                src = src[:m.end()] + "\n" + helper + src[m.end():]
                inserted = True
                break
        if not inserted:
            print("ERROR: no anchor found to insert helper", file=sys.stderr)
            sys.exit(2)
    if helpers_only:
        with open(path, "w") as f:
            f.write(src)
        print(f"updated {path} (helpers only)")
        return

    # ---- UI wrap ----
    if not server_only:
        m = re.search(r"^(app_ui|ui)\s*<-\s*([A-Za-z_][A-Za-z0-9_.]*)\(",
                      src, re.MULTILINE)
        if m:
            ui_name = m.group(1)
            open_pat = m.group(0)
            new_open = (
                f"{ui_name} <- function(request) {{\n"
                "  .mode <- .resolve_app_mode(request$QUERY_STRING)\n"
                "  if (!is.null(.mode)) { enable_ai <- (.mode == \"ai\"); .enable_ai <- enable_ai; AI_ENABLED <- enable_ai }\n"
                "  " + open_pat
            )
            src = src.replace(open_pat, new_open, 1)

            # Insert closing '}' before server fn (in same file) or at EOF.
            m2 = re.search(r"\n(app_server|server)\s*<-\s*function", src)
            if m2:
                src = src[:m2.start()] + "\n}\n" + src[m2.start():]
            else:
                # split mode: no server in this file. Append closing brace at the
                # very end. The static `ui <- dashboardPage(...)` ends with ')',
                # we need to add '}' on a new line after it.
                # Find the LAST ')' followed by only whitespace/newlines until EOF.
                m3 = re.search(r"\)\s*$", src)
                if m3:
                    src = src[:m3.end()] + "\n}\n" + src[m3.end():]
                else:
                    src = src + "\n}\n"
        elif not ui_only:
            print("WARN: no UI anchor found (may be intentional for server-only file)",
                  file=sys.stderr)

    # ---- Server top injection ----
    if not ui_only:
        srv_anchor_re = re.compile(
            r"((?:app_server|server)\s*<-\s*function\([^)]*\)\s*\{)\n", re.MULTILINE
        )
        sm = srv_anchor_re.search(src)
        if sm:
            srv_anchor = sm.group(0)
            srv_inject = (
                srv_anchor
                + "  .mode <- .resolve_app_mode(session$clientData$url_search)\n"
                + '  if (!is.null(.mode)) { enable_ai <- (.mode == "ai"); .enable_ai <- enable_ai; AI_ENABLED <- enable_ai }\n'
                + "\n"
            )
            src = src.replace(srv_anchor, srv_inject, 1)
        elif not server_only:
            print("WARN: no server anchor found (ui-only file)", file=sys.stderr)

    with open(path, "w") as f:
        f.write(src)
    print(f"updated {path}")


if __name__ == "__main__":
    args = sys.argv[1:]
    ui_only = False
    server_only = False
    helpers_only = False
    while args and args[0].startswith("--"):
        flag = args.pop(0)
        if flag == "--ui-only":
            ui_only = True
        elif flag == "--server-only":
            server_only = True
        elif flag == "--helpers-only":
            helpers_only = True
        else:
            print(f"unknown flag {flag}", file=sys.stderr); sys.exit(1)
    if len(args) != 1:
        print("usage: patch_shiny_mode.py [--ui-only|--server-only|--helpers-only] <PATH>",
              file=sys.stderr)
        sys.exit(1)
    patch(args[0], ui_only=ui_only, server_only=server_only,
          helpers_only=helpers_only)
