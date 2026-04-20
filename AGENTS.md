# dbGIST Agent Guidelines

## Key Architecture
- **React Frontend** (`frontend/`): TypeScript/React SPA on port 5173
- **Node.js Backend** (`backend/`): Express 5 API on port 8000
- **R Shiny Apps**: One per omics type (Transcriptomics, Proteomics, etc.) on ports 4964-4975
- **Plumber API** (`plumber_api/`): REST endpoints for omics data
- **Frontend iframes** Shiny apps via `frontend/src/config.ts` (keep in sync with Shiny ports)

## Essential Commands
- `npm run install:all` - Install all dependencies (root, backend, frontend)
- `npm run dev` - Frontend + Backend only (no Shiny)
- `npm run dev:backend` - Backend only (port 8000)
- `npm run dev:frontend` - Frontend only (port 5173)
- `bash start_all_shiny.sh` - Start all Shiny apps (production)
- `bash start_all.sh` - Full stack (Agent + Backend + Frontend)
- `cd frontend && npm run build` - Production build
- `cd frontend && npm run lint` - ESLint

## Critical Configuration
- **Frontend proxy**: `/api` and `/plots` proxied to backend:8000 (vite.config.ts)
- **Shiny URLs**: Must keep `frontend/src/config.ts`, `start_all_shiny.sh`, and Nginx mapping in sync
- **Plot flow**: External Python Agent (port 5001) → `backend/public/plots/` → frontend via `/plots/`
- **Environment**: Backend needs `ARK_API_KEY`, `ARK_API_URL`, `ARK_MODEL_ID` in `.env`

## Important Notes
- All `GIST_*` Shiny directories are gitignored (separate repos)
- Shell scripts are mostly gitignored (check `start_all_shiny.sh` for canonical startup)
- Backend uses Express 5 with ES modules (`type: "module"` in package.json)
- Frontend embeds Shiny apps via iframes (config.ts determines URL mapping)
- AI chat routes to ARK/DeepSeek API via backend `/api/chat`
- Plot delivery: Backend serves static files from `backend/public/plots/` at `/plots`
- When adding new Shiny app: update config.ts shinyUrls AND Nginx port-81 mapping
- Plumber API defaults overlap with Shiny ports - don't run both with defaults on same host
- `start_all.sh` hardcodes paths - edit `PROJECT_ROOT` and `AGENT_DIR` for different checkouts