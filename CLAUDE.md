# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**dbGIST** is a multi-omics gene expression analysis platform for gastrointestinal stromal tumors (GIST). It combines a React frontend, Node.js backend, multiple R Shiny applications (one per omics type), and a Plumber REST API layer. The platform provides interactive visualizations, statistical analyses, AI-powered gene analysis, and non-coding RNA interaction data.

## Commands

### Install & Run
```bash
npm run install:all          # Install root + backend + frontend deps

# Development (frontend + backend only, no Shiny)
npm run dev                  # Runs both via concurrently
npm run dev:backend          # Backend only (port 8000, uses node --watch)
npm run dev:frontend         # Frontend only (port 5173)

# Full stack including all Shiny apps (on production server)
bash start_all_shiny.sh      # Starts all Shiny apps on ports 4964-4975
bash stop_all_shiny.sh       # Stops all Shiny apps

# Full stack: Agent + Backend + Frontend (WSL/Linux)
bash start_all.sh            # Ports 5001, 8000, 5173
bash stop_all.sh
```

### Build & Lint
```bash
cd frontend && npm run build   # TypeScript check + Vite production build
cd frontend && npm run lint    # ESLint
```

### Docker
```bash
docker-compose up -d           # gist-web (8000/5173) + gist-shiny (3838) + nginx (80/443)
```

### Plumber API (R REST endpoints for omics data)
```bash
cd plumber_api
Rscript start_api.R                    # All APIs via future::multisession
Rscript start_api.R proteomics         # Single module (port 4966)
Rscript start_api.R phospho            # Port 4968
Rscript start_api.R transcriptomics    # Port 4970
Rscript start_api.R singlecell         # Port 4972
Rscript start_api.R noncoding          # Port 4974
```

## Architecture

### Service Topology
```
React Frontend (5173) ──proxy /api──> Node.js Backend (8000) ──> AI APIs (ARK/DeepSeek)
                       ──proxy /plots──> Backend static files
                       ──iframe──> R Shiny Apps (4964-4975, per-omics)
                                   Plumber APIs (4966-4974, REST endpoints)
```

Production: Nginx reverse proxy on port 80/443 fronts everything. Domain: dbgist.com / chatgist.online.

### Three Main Layers

**1. React Frontend** (`frontend/`) — TypeScript/React SPA with Vite
- Router in `App.tsx`: `/` Home, `/dataset`, `/guide`, `/gene-info`, `/ai-chat`, `/mirna-results`, `/circrna-results`, `/lncrna-results`, `/icon-preview`. Both `/circrna-results` and `/lncrna-results` render the same `NcRNAResults` page (driven by route).
- `config.ts`: Dynamic API URL and Shiny iframe URL resolution based on hostname/port. Three modes: `localhost/127.0.0.1` → direct `127.0.0.1:<port>` Shiny URLs + `localhost:8000/api`; production with `:81` → reverse-proxied paths under port 81; production default → same-origin paths. **When adding a new Shiny app, both `config.ts` `shinyUrls` and the Nginx path mapping must be updated.**
- Vite proxies `/api` and `/plots` to backend at localhost:8000
- `FloatingChat` component provides persistent AI chat overlay across all pages; `SmartCapture` and `MiniChat` are related capture/chat helpers

**2. Node.js Backend** (`backend/`) — Express 5, ES Modules
- `src/index.js`: Mounts routes under `/api/*`, serves static plots from `backend/public/plots/` at `/plots`. Listens on `0.0.0.0` (all interfaces), 50MB JSON body limit.
- Routes: `chat.js` (AI chat via ARK/DeepSeek API), `gene.js` (gene info), `ncrna.js` (non-coding RNA lookups), `proxy.js` (forwarding)
- Services: `geneFetcher.js`, `ncRNAService.js`
- Environment: `PORT` (default 8000), `AI_API_KEY`, `ARK_API_URL`, `ARK_MODEL_ID`
- **Plot delivery flow**: the external Python Agent (see `start_all.sh`, port 5001) writes generated images into `backend/public/plots/`; the frontend then loads them via `/plots/<file>` proxied through this backend. Backend never generates images itself.

**3. R Shiny Applications** (one directory per omics type, each with `global.R`/`ui.R`/`server.R`). Each app has two variants — an "AI" build that includes the chat sidebar, and a "basic" (no-AI) build — running on different ports so the frontend can iframe whichever the user selects.

| Directory | Omics Type | AI Port | Basic Port |
|-----------|-----------|---------|------------|
| `GIST_Transcriptome/` | Transcriptomics | 4964 | 4966 |
| `GIST_Protemics/` | Proteomics | 4968 | 4967 |
| `GIST_Phosphoproteomics/` | Phosphoproteomics (PTM) | 4972 | 4971 |
| `GIST_SingleCell/` | Single Cell | 4974 | 4975 |
| `GIST_noncoding/` | Non-coding RNA | 4992 | 4991 |

These ports are the source of truth — they appear in `start_all_shiny.sh`, `frontend/src/config.ts` (`shinyUrls`), and the Nginx port-81 mapping (`/transcriptomics/`, `/proteomics/`, `/posttranslational/`, `/singlecell/`, `/noncoding/`, plus `-basic` variants). Keep all three in sync when changing ports.

Each Shiny app uses bs4Dash, ggplot2, and has AI modules (`modules/ai_chat_module.R`) for image-based chart analysis. The root-level `global.R`, `server.R`, `ui.R` are copies/references for the original GIST_shiny app.

**4. Plumber API** (`plumber_api/`) — R REST endpoints
- One plumber file per omics: `plumber_proteomics.R`, `plumber_phospho.R`, `plumber_transcriptomics.R`, `plumber_singlecell.R`, `plumber_noncoding.R`
- `start_api.R` launches all or individual modules. When started with no arg it runs proteomics in foreground and the others as `future::multisession` workers.
- Default ports (overridable via `PROTEOMICS_PORT` / `PHOSPHO_PORT` / `TRANSCRIPTOMICS_PORT` / `SINGLECELL_PORT` / `NONCODING_PORT`): 4966, 4968, 4970, 4972, 4974.
- ⚠️ **The Plumber defaults overlap with the Shiny app ports above** (4966 = Transcriptome basic, 4968 = Proteomics AI, 4972 = PTM AI, 4974 = SingleCell AI). Don't run both stacks with defaults on the same host — override the env vars before starting Plumber when Shiny is also running locally.

### Key R Analysis Functions (in Shiny `global.R` files)
- `Judge_GENESYMBOL()`: Validates gene symbols against expression matrix
- `dbGIST_boxplot_*()`: Generates boxplots by clinical parameter (Risk, Mutation, Age, Gender, Location, etc.)
- `dbGIST_cor_ID()`: Gene-gene correlation scatter plots
- `dbGIST_boxplot_Drug()`: Drug resistance analysis with ROC curves
- `dbGIST_boxplot_PrePost()`: Pre/post treatment comparison

### Data Files
- Expression matrices: `GIST_*/original/` directories (`.Rdata`, `.RDS` files — gitignored)
- Pathway databases: MSigDB (`GSEA_hallmark.gmt`) and WikiPathways in each Shiny app
- Non-coding RNA mappings: `backend/data/gene_ncrna_mapping.json`
- Large interaction files at project root: `hsa_MTI.csv`, `*_interaction.txt` (gitignored)

## Development Notes

- **All GIST_* Shiny directories are gitignored** — they are separate repos/deployments. The main repo tracks only `frontend/`, `backend/`, `plumber_api/`, root configs, and docs.
- **Shell scripts are gitignored** except those checked in before the rule was added. Check `start_all_shiny.sh` for the canonical multi-app startup sequence on production. That script expects the Shiny apps to live under `/home/ylab/GIST_*` and writes logs to `logs/shiny/*.log`.
- `start_all.sh` (Agent + Backend + Frontend) hardcodes `PROJECT_ROOT=/mnt/g/work/yang_lab` and an `AGENT_DIR` of `glm_agent_test`. On a checkout under a different path (e.g. `/mnt/f/work/yang_ylab/GIST_web_all`), edit those variables before running, or start the three services manually.
- Frontend embeds Shiny apps via iframes. The URL mapping in `frontend/src/config.ts` determines which port/path to use based on the current hostname.
- Backend uses Express 5 with ES module syntax (`import`/`export`, `type: "module"` in package.json).
- AI chat routes forward to ARK API (DeepSeek model) — configured via `ARK_API_KEY`, `ARK_API_URL`, `ARK_MODEL_ID` env vars in `backend/.env`.
