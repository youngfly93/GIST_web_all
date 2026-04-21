#!/usr/bin/env bash
# Stop all GIST Shiny pm2 apps (by pm2 name, NOT by port).
# Created: 2026-04-21 (Step 6)
set -euo pipefail

NAMES=(shiny-transcriptomics shiny-proteomics shiny-phospho shiny-singlecell shiny-noncoding shiny-genomics)
for n in "${NAMES[@]}"; do
  if pm2 describe "$n" >/dev/null 2>&1; then
    pm2 stop "$n"
  else
    echo "  (skip: $n not registered with pm2)"
  fi
done
echo
echo "Use ./start_all_shiny.sh to restart."
