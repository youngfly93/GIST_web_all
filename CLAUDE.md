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
- Router in `App.tsx`: `/` Home, `/dataset`, `/guide`, `/gene-info`, `/ai-chat`, `/mirna-results`, `/circrna-results`, `/lncrna-results`
- `config.ts`: Dynamic API URL and Shiny iframe URL resolution based on hostname/port (localhost vs port-81 vs production)
- Vite proxies `/api` and `/plots` to backend at localhost:8000
- `FloatingChat` component provides persistent AI chat overlay across all pages

**2. Node.js Backend** (`backend/`) — Express 5, ES Modules
- `src/index.js`: Mounts routes, serves static plots from `public/plots/`
- Routes: `chat.js` (AI chat via ARK/DeepSeek API), `gene.js` (gene info), `ncrna.js` (non-coding RNA lookups), `proxy.js` (forwarding)
- Services: `geneFetcher.js`, `ncRNAService.js`
- Environment: `PORT` (default 8000), `AI_API_KEY`, `ARK_API_URL`, `ARK_MODEL_ID`

**3. R Shiny Applications** (one directory per omics type, each with `global.R`/`ui.R`/`server.R`)

| Directory | Omics Type | AI Port | Non-AI Port |
|-----------|-----------|---------|-------------|
| `GIST_Transcriptome/` | Transcriptomics | 4964 | 4966 |
| `GIST_Protemics/` | Proteomics | 4968 | 4967 |
| `GIST_Phosphoproteomics/` | Phosphoproteomics | 4972 | 4971 |
| `GIST_SingleCell/` | Single Cell | — | — |
| `GIST_noncoding/` | Non-coding RNA | — | — |

Each Shiny app uses bs4Dash, ggplot2, and has AI modules (`modules/ai_chat_module.R`) for image-based chart analysis. The root-level `global.R`, `server.R`, `ui.R` are copies/references for the original GIST_shiny app.

**4. Plumber API** (`plumber_api/`) — R REST endpoints
- One plumber file per omics: `plumber_proteomics.R`, `plumber_phospho.R`, `plumber_transcriptomics.R`, `plumber_singlecell.R`, `plumber_noncoding.R`
- `start_api.R` launches all or individual modules with configurable ports via env vars

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
- **Shell scripts are gitignored** except those checked in before the rule was added. Check `start_all_shiny.sh` for the canonical multi-app startup sequence on production.
- Frontend embeds Shiny apps via iframes. The URL mapping in `frontend/src/config.ts` determines which port/path to use based on the current hostname.
- Backend uses Express 5 with ES module syntax (`import`/`export`, `type: "module"` in package.json).
- AI chat routes forward to ARK API (DeepSeek model) — configured via `ARK_API_KEY`, `ARK_API_URL`, `ARK_MODEL_ID` env vars in `backend/.env`.
