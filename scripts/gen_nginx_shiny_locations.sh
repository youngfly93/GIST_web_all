#!/usr/bin/env bash
# Generate nginx Shiny location blocks from config/ports.json.
# Single source of truth: config/ports.json
# Output: nginx/dbgist.shiny.locations.conf  (included by sites-available/dbgist)
# Created: 2026-04-21 (Step 8)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PORTS="$REPO/config/ports.json"
OUT="$REPO/nginx/dbgist.shiny.locations.conf"

if [ ! -f "$PORTS" ]; then echo "ERROR: $PORTS not found" >&2; exit 1; fi
mkdir -p "$REPO/nginx"

# nginx URL path -> ports.json shiny key (posttranslational==phospho)
declare -A URL_TO_KEY=(
  [transcriptomics]=transcriptomics
  [proteomics]=proteomics
  [posttranslational]=phospho
  [singlecell]=singlecell
  [noncoding]=noncoding
  [genomics]=genomics
)

cat > "$OUT" <<HEADER
# ============================================================
# AUTO-GENERATED FROM config/ports.json — DO NOT EDIT BY HAND
# Regenerate: bash scripts/gen_nginx_shiny_locations.sh
# Generated:  $(date -u +%FT%TZ)
# ============================================================

HEADER

emit() {
  local urlpath=$1; local port=$2; local label=$3
  cat >> "$OUT" <<BLOCK
    # ${label}
    location ^~ /${urlpath}/ {
        proxy_pass http://127.0.0.1:${port}/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

BLOCK
}

for urlpath in transcriptomics proteomics posttranslational singlecell noncoding genomics; do
  key=${URL_TO_KEY[$urlpath]}
  port=$(node -e "console.log(require('$PORTS').shiny.$key.ai_port)")
  emit "$urlpath" "$port" "AI ($key)"
  emit "${urlpath}-basic" "$port" "Basic→AI fallback ($key) — basic decommissioned 2026-04-21"
done

echo "Wrote $(wc -l < "$OUT") lines to $OUT"
