// pm2 ecosystem for GIST Shiny apps (AI versions only).
// Ports/cwd/launch args are sourced from config/ports.json (single source of truth).
// 启动: pm2 start /home/ylab/GIST_web_all/ecosystem.shiny.config.cjs && pm2 save
// 重写日期: 2026-04-21 (Step 4)

const path = require('path');
const ports = require('./config/ports.json');

const logDir = path.join(__dirname, 'logs', 'shiny');

const baseDefaults = {
  interpreter: 'none',
  autorestart: true,
  min_uptime: '60s',
  max_restarts: 10,
  restart_delay: 4000,
  kill_timeout: 8000,
  merge_logs: true,
  time: true,
  max_memory_restart: '6G',
};

function shinyApp(key, spec) {
  return {
    ...baseDefaults,
    name: `shiny-${key}`,
    script: 'Rscript',
    args: spec.launch,
    cwd: spec.cwd,
    out_file: `${logDir}/${key}_ai.out.log`,
    error_file: `${logDir}/${key}_ai.err.log`,
    ...(spec.max_memory_restart ? { max_memory_restart: spec.max_memory_restart } : {}),
  };
}

module.exports = {
  apps: Object.entries(ports.shiny).map(([key, spec]) => shinyApp(key, spec)),
};
