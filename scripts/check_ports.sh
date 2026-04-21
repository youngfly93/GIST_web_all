#!/usr/bin/env bash
# 三方核对端口配置：config/ports.json ↔ nginx 实际 location ↔ pm2 实际进程 ↔ 系统 LISTEN
# 用法: bash scripts/check_ports.sh
# 创建日期: 2026-04-21 (Step 4)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PORTS_JSON="$REPO/config/ports.json"
NGINX_CONF="/etc/nginx/sites-available/dbgist"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
gray()  { printf '\033[2m%s\033[0m\n' "$*"; }

# 1. expected ports from ports.json
declare -A EXPECTED_PORTS
declare -A EXPECTED_NAMES
mapfile -t pairs < <(node -e "const d=require('$PORTS_JSON'); for(const[k,v]of Object.entries(d.shiny))console.log(k,v.ai_port);")
for line in "${pairs[@]}"; do
  k=${line%% *}; p=${line##* }
  EXPECTED_PORTS[$k]=$p
  EXPECTED_NAMES[$p]="shiny-$k"
done
BACKEND_PORT=$(node -e "console.log(require('$PORTS_JSON').backend.node)")

echo '================================================================'
echo " GIST_web_all port reconciliation report ($(date -u +%FT%TZ))"
echo '================================================================'
echo
echo "[1] ports.json declares"
node -e "const d=require('$PORTS_JSON'); console.log('   backend node ='+d.backend.node); for(const[k,v]of Object.entries(d.shiny))console.log('   shiny.'+k.padEnd(16)+'= '+v.ai_port);"
echo

echo "[2] LISTEN check (system)"
miss=0
for k in "${!EXPECTED_PORTS[@]}"; do
  p=${EXPECTED_PORTS[$k]}
  if ss -tln | grep -q ":$p "; then green "   ✅ shiny-$k :$p bound"; else red "   ❌ shiny-$k :$p NOT bound"; miss=$((miss+1)); fi
done
if ss -tln | grep -q ":$BACKEND_PORT "; then green "   ✅ backend :$BACKEND_PORT bound"; else red "   ❌ backend :$BACKEND_PORT NOT bound"; miss=$((miss+1)); fi
echo

echo "[3] pm2 process names"
pm2 jlist 2>/dev/null | awk '/^\[/,0' | node -e '
const d = JSON.parse(require("fs").readFileSync(0,"utf8"));
for(const p of d) console.log("   " + (p.pm2_env.status=="online"?"🟢":"🔴") + " " + p.name + " (uptime " + Math.floor((Date.now()-p.pm2_env.pm_uptime)/1000) + "s, restarts " + p.pm2_env.restart_time + ")");
' || echo '   (pm2 unavailable)'
echo

echo "[4] nginx upstream port check"
for k in "${!EXPECTED_PORTS[@]}"; do
  p=${EXPECTED_PORTS[$k]}
  # match the AI location only (no '-basic' suffix)
  loc=$(awk -v k="$k" '
    BEGIN{path=""}
    /location \^~ \// {match($0,/\/[a-z]+\//); path=substr($0,RSTART,RLENGTH); in_block=1; next}
    in_block && /proxy_pass/ {gsub(/[;]/,""); print path,$2}
    /^\}/ {in_block=0; path=""}
  ' "$NGINX_CONF" | grep -E ":${p}/" | head -1 || true)
  if [ -n "$loc" ]; then green "   ✅ $k → $loc"; else gray "   - $k :$p (no nginx loc found via simple parse)"; fi
done

echo
if [ $miss -eq 0 ]; then green "OK — all expected ports bound"; else red "ATTENTION — $miss missing port bindings"; fi
