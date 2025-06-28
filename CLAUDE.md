# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

This is a **dbGIST (database GIST)** hybrid application combining a Shiny web app for GIST gene expression analysis with a modern React frontend and Node.js backend. The system provides interactive visualizations, statistical analyses, and AI-powered gene analysis for GIST genomic research.

## Key Commands

### Development & Running
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Run full stack (React frontend + Node.js backend + R Shiny)
npm run dev:full              # Linux/Mac
npm run dev:full:windows      # Windows
./start_with_shiny.sh         # Linux/Mac script
start_with_shiny.bat          # Windows script

# Run individual components
npm run dev                   # Frontend + Backend only
npm run dev:backend           # Backend only
npm run dev:frontend          # Frontend only

# R Shiny only (port 4964)
cd GIST_shiny && R -e "shiny::runApp(port = 4964)"
```

### Build & Deployment
```bash
# Frontend build
cd frontend && npm run build

# Frontend linting
cd frontend && npm run lint

# Docker deployment
docker-compose up -d

# Manual deployment (see scripts/deploy.sh)
./scripts/deploy.sh
```

### Testing
```bash
# R tests (in GIST_shiny/)
R -e "testthat::test_dir('tests')"

# Run specific test
R -e "testthat::test_file('tests/test_modules.R')"
```

## Architecture & Structure

### System Components
This is a **hybrid multi-stack application** with three main layers:

1. **React Frontend** (`frontend/`): Modern TypeScript/React SPA with Vite build system
   - Main pages: Home, GeneInfo, MiRNAResults, AIChat, GistDatabase, Guide, Dataset
   - Components: FloatingChat, GeneAssistant, SmartCapture, PageNavigator
   - Build: `npm run build`, Lint: `npm run lint`

2. **Node.js Backend** (`backend/`): Express API server with AI integration
   - Routes: `/api/chat`, `/api/gene`, `/api/ncrna`, `/api/proxy`
   - Services: geneFetcher, ncRNAService
   - AI integration via external APIs (ARK/DeepSeek)

3. **R Shiny Database** (`GIST_shiny/`): Gene expression analysis engine
   - **global.R**: Dependencies, data loading, analysis functions
   - **ui.R**: bs4Dash dashboard with 5 analysis modules
   - **server.R**: Reactive logic, plot generation, statistical analysis
   - **AI modules**: `modules/ai_chat_module.R`, `modules/shiny_ai_module.R`

### Service Integration
- **Frontend** (port 5173) → **Backend** (port 8000) → **Shiny** (port 4964)
- Docker deployment with Nginx reverse proxy
- Non-coding RNA data integration (circRNA, lncRNA, miRNA)
- WebSocket support for real-time AI chat

### Key R Functions (GIST_shiny/global.R)
- `Judge_GENESYMBOL()`: Gene symbol validation
- `dbGIST_boxplot_*()`: Clinical parameter visualization (Risk, Mutation, Age, etc.)
- `dbGIST_cor_ID()`: Gene-gene correlation analysis
- `dbGIST_boxplot_Drug()`: Drug resistance analysis with ROC curves
- `dbGIST_boxplot_PrePost()`: Pre/post treatment comparison

### Data Architecture
- **Expression matrices**: `GIST_shiny/original/dbGIST_matrix(2).Rdata` with clinical annotations
- **Pathway databases**: MSigDB and WikiPathways for enrichment analysis
- **Non-coding RNA**: `backend/data/gene_ncrna_mapping.json` for interaction data
- **Clinical categories**: Age, Gender, Risk, Location, Mutation, Metastasis, Treatment response

### AI System Integration
- Multi-modal AI chat system with image analysis capabilities
- Active module tracking for context-aware analysis
- Integration between Shiny reactive system and modern frontend
- External AI APIs configured via environment variables

## Development Notes

### Environment Setup
```bash
# Backend environment variables (.env)
PORT=8000
NODE_ENV=development
AI_API_KEY=your_api_key

# Frontend uses Vite env variables
```

### Key Technologies
- **Reactive programming**: Shiny uses reactive expressions for dynamic updates
- **Modern stack**: React/TypeScript frontend with Node.js API layer
- **Statistical analysis**: t-tests, correlation analysis, ROC curves via R
- **Visualization**: ggplot2 for statistical plots, React components for UI
- **Deployment**: Docker Compose with multi-service orchestration

### Common Development Tasks
- **Adding new API endpoints**: Create route in `backend/src/routes/`, add to `backend/src/index.js`
- **Adding new Shiny modules**: Create in `GIST_shiny/modules/`, source in `global.R`
- **Frontend pages**: Add to `frontend/src/pages/`, update router in `App.tsx`
- **Gene data updates**: Modify `GIST_shiny/original/` data files, restart Shiny

### Debugging Tips
- Check service ports: Frontend (5173), Backend (8000), Shiny (4964)
- Shiny logs: Check R console output or Docker logs
- API calls: Frontend uses `/api` prefix, proxied by Vite to backend
- CORS issues: Backend configured for localhost development