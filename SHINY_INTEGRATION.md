# GIST Shiny Integration Guide

## Overview
This document describes how the GIST Shiny application is integrated with the GIST_web project.

## Architecture

### Directory Structure
```
/mnt/f/work/claude_code/
├── GIST_web/          # Main web application (React frontend + Node.js backend)
└── GIST_shiny/        # R Shiny data analysis application
```

### Port Configuration
- **GIST_web Frontend**: Port 5173 (Vite dev server)
- **GIST_web Backend**: Port 3000 (Express server)
- **GIST_shiny**: Port 4964 (R Shiny server)

## Integration Points

### 1. Frontend Button
The "进入数据库" button in the GIST_web homepage (`frontend/src/pages/Home.tsx`) opens the Shiny app:
```javascript
onClick={() => window.open('http://127.0.0.1:4964/', '_blank')}
```

### 2. Starting the Applications

#### Option 1: Start Separately
```bash
# Terminal 1: Start GIST_web
cd GIST_web
./start.sh  # or npm run dev

# Terminal 2: Start GIST_shiny
cd GIST_shiny
./start_shiny.sh  # or Rscript -e "shiny::runApp(port = 4964)"
```

#### Option 2: Start Together
```bash
cd GIST_web
./start_with_shiny.sh  # Starts both applications
```

## Scripts Created

### GIST_shiny Scripts
- `run_app.R`: R script to run the Shiny app on port 4964
- `start_shiny.sh`: Shell script to start the Shiny app (Linux/Mac)
- `start_shiny.bat`: Batch script to start the Shiny app (Windows)

### GIST_web Scripts
- `start_with_shiny.sh`: Starts both GIST_web and GIST_shiny (Linux/Mac)
- `start_with_shiny.bat`: Starts both GIST_web and GIST_shiny (Windows)

## Usage

### For Development
1. Use `start_with_shiny.sh` or `start_with_shiny.bat` to start both applications
2. Access GIST_web at http://localhost:5173
3. Click "进入数据库" to open the Shiny app at http://127.0.0.1:4964

### For Production
Consider using:
- Process managers (PM2, systemd) for the Node.js app
- Shiny Server or ShinyProxy for the R Shiny app
- Nginx as a reverse proxy to serve both applications under one domain

## Troubleshooting

### Port Already in Use
If port 4964 is already in use, you can change it:
1. Update the port in GIST_shiny start scripts
2. Update the URL in `frontend/src/pages/Home.tsx`

### R Package Dependencies
Ensure all R packages are installed:
```r
# Run in R console
source("/mnt/f/work/claude_code/GIST_shiny/global.R")
```

### Process Management
The Shiny app runs in the background when using `start_with_shiny.sh`. To stop it manually:
```bash
# Find the process
ps aux | grep "shiny::runApp"
# Kill the process
kill <PID>
```