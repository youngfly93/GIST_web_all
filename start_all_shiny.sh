#!/usr/bin/env bash
# Start all GIST Shiny apps via pm2 (delegates to ecosystem.shiny.config.cjs).
# Replaces the old nohup-Rscript-per-port script (preserved as start_all_shiny.legacy.sh).
# Created: 2026-04-21 (Step 6)
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
ECOSYSTEM="$REPO/ecosystem.shiny.config.cjs"

if [ ! -f "$ECOSYSTEM" ]; then
  echo "ERROR: missing $ECOSYSTEM" >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 not found in PATH" >&2
  exit 1
fi

echo "[start_all_shiny] starting via pm2 ecosystem..."
pm2 start "$ECOSYSTEM"
pm2 save --force

echo
echo "[start_all_shiny] status:"
pm2 list --no-color | grep -E '(name|shiny-)' || true

echo
echo "[start_all_shiny] reconciliation:"
bash "$REPO/scripts/check_ports.sh" 2>&1 | tail -25 || true
