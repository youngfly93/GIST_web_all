# Transcriptomics Production Changelog 2026-04-17

## Summary

- Scope: `www.dbgist.com` transcriptomics backend and transcriptomics Shiny apps
- Server: `117.72.75.45`
- Result: fixed transcriptomics `clinical` / `survival` / `drug-response` compatibility issues after the standardized object sync
- Status: deployed and verified in production

## Symptoms Before Fix

- `analysis/clinical`
  - `Age` failed due to wrong source column usage
  - `Mutation_ID` could fail with `object 'p1' not found`
  - several cohort-specific clinical plots failed because matrix columns and clinical rows were not aligned reliably
- `analysis/survival`
  - could fail with row-count mismatch between expression and clinical data
  - `ggsurvplot` could fail on formula handling
- `ready`
  - returned `true` even when critical transcriptomics analyses were broken

## Root Causes

1. `plumber_transcriptomics.R` loaded the object but did not refresh from the alias-augmented `global.R` state after sourcing.
2. survival and drug-response logic directly used raw matrix vectors without a unified matrix-clinical matching helper.
3. `Age` in `global.R` used incorrect clinical fields.
4. `Mutation_ID` plotting assumed the first cohort already created `p1`.
5. transcriptomics readiness only checked function existence, not runtime behavior.

## Files Updated

Local source of truth:

- [plumber_transcriptomics.R](/mnt/f/work/yang_ylab/gist_web_all/plumber_api/plumber_transcriptomics.R)
- [global.R](/mnt/f/work/yang_ylab/gist_web_all/GIST_Transcriptome/global.R)

Production targets updated:

- `/home/ylab/GIST_web_all/plumber_api/plumber_transcriptomics.R`
- `/home/ylab/GIST_web_all/GIST_Transcriptome/global.R`
- `/home/ylab/GIST_Transcriptome/global.R`

Backup created on server:

- `/home/ylab/GIST_web_all/backup_transcriptomics_fix_20260417_142104`

## Deployment Actions

1. Backed up current production files.
2. Uploaded fixed `plumber_transcriptomics.R` and `global.R`.
3. Replaced the 3 production files above.
4. Restarted PM2 service:
   - `pm2 restart dbgist-plumber-transcriptomics`
5. Restarted transcriptomics Shiny services:
   - AI: port `4964`
   - Basic: port `4966`

## Production Verification

Services confirmed listening:

- `5980` transcriptomics plumber
- `4964` transcriptomics Shiny AI
- `4966` transcriptomics Shiny basic

Public routes verified:

- `https://www.dbgist.com/transcriptomics/` -> `HTTP 200`
- `https://www.dbgist.com/transcriptomics-basic/` -> `HTTP 200`

API checks verified:

- `/api/v1/transcriptomics/ready`
  - `ready=true`
  - smoke tests all `true`
  - `risk_mcm7=true`
  - `mutation_kit=true`
  - `age_abl1=true`
  - `survival_mcm7=true`
- `/api/v1/transcriptomics/summary`
  - `feature=MCM7` returns `clinical_associations`, `survival`, and `drug_response`
- `/api/v1/transcriptomics/analysis/clinical`
  - `feature=ABL1, variable=Age` returns plot
  - `feature=KIT, variable=Mutation_ID` returns plot
- `/api/v1/transcriptomics/analysis/survival`
  - `feature=MCM7, type=OS, cutoff=Auto` returns plot and statistics
- `/api/v1/transcriptomics/analysis/drug-response`
  - `feature=MCM7` returns plot and statistics
- `/api/v1/transcriptomics/features/check`
  - `MCM7=true`
  - `13CDNA73=false`

Internal plumber route also verified:

- `POST http://127.0.0.1:5980/analyze/batch` with `gene=KIT`
  - `Mutation_ID` present and contains plot

## Important Note

- Public unified API does not expose `POST /api/v1/transcriptomics/analysis/batch`.
- External callers should use:
  - `analysis/clinical`
  - `analysis/survival`
  - `analysis/drug-response`
- Internal legacy plumber route `/analyze/batch` remains available on `5980`.

## Rollback

If rollback is needed:

1. Restore backup files from:
   - `/home/ylab/GIST_web_all/backup_transcriptomics_fix_20260417_142104`
2. Restart:
   - `pm2 restart dbgist-plumber-transcriptomics`
   - restart transcriptomics Shiny on `4964` and `4966`

Suggested rollback commands:

```bash
cp -p /home/ylab/GIST_web_all/backup_transcriptomics_fix_20260417_142104/plumber_transcriptomics.R /home/ylab/GIST_web_all/plumber_api/plumber_transcriptomics.R
cp -p /home/ylab/GIST_web_all/backup_transcriptomics_fix_20260417_142104/global.R.weball /home/ylab/GIST_web_all/GIST_Transcriptome/global.R
cp -p /home/ylab/GIST_web_all/backup_transcriptomics_fix_20260417_142104/global.R.shiny /home/ylab/GIST_Transcriptome/global.R
pm2 restart dbgist-plumber-transcriptomics
fuser -k 4964/tcp 4966/tcp || true
cd /home/ylab/GIST_Transcriptome
nohup Rscript -e 'options(shiny.port=4964, shiny.host="0.0.0.0"); source("start_ai.R")' > /home/ylab/GIST_web_all/logs/shiny/transcriptomics_ai.log 2>&1 &
nohup Rscript -e 'options(shiny.port=4966, shiny.host="0.0.0.0"); source("start_no_ai.R")' > /home/ylab/GIST_web_all/logs/shiny/transcriptomics_basic.log 2>&1 &
```
