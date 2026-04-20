# dbGIST API Contract v1

## Purpose

This contract defines the unified HTTP API surface for dbGIST.

Goals:

- give all omics modules a consistent public interface
- allow Web, R, and Python clients to use the same entry points
- keep legacy routes working during migration

Non-goals for v1:

- replacing all existing plumber routes immediately
- rewriting analysis logic out of R in this phase

## Base Path

All unified endpoints are mounted under:

`/api/v1`

## Modules

Supported module names:

- `transcriptomics`
- `noncoding`
- `proteomics`
- `phosphoproteomics`
- `singlecell`

## Common Response Shape

### Success

```json
{
  "ok": true,
  "module": "transcriptomics",
  "endpoint": "summary",
  "data": {},
  "error": null,
  "meta": {
    "request_id": "4b3f0a7d-7f85-4eb7-8bb4-4fd3535f7216",
    "version": "v1",
    "generated_at": "2026-04-14T04:00:00.000Z"
  }
}
```

### Error

```json
{
  "ok": false,
  "module": "transcriptomics",
  "endpoint": "analysis/clinical",
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "feature is required"
  },
  "meta": {
    "request_id": "4b3f0a7d-7f85-4eb7-8bb4-4fd3535f7216",
    "version": "v1",
    "generated_at": "2026-04-14T04:00:00.000Z"
  }
}
```

## Common Error Codes

- `INVALID_INPUT`
- `MODULE_NOT_FOUND`
- `MODULE_NOT_READY`
- `FEATURE_NOT_FOUND`
- `ANALYSIS_FAILED`
- `UNSUPPORTED_ANALYSIS`
- `NOT_IMPLEMENTED`

## Top-Level Endpoints

### `GET /api/v1/health`

Returns platform-level health.

### `GET /api/v1/modules`

Returns available modules and their capability summary.

## Module Endpoints

### `GET /api/v1/{module}/health`

Returns simple module health.

### `GET /api/v1/{module}/ready`

Returns module readiness, dataset count, blockers, and capability hints.

### `GET /api/v1/{module}/capabilities`

Returns declared module capabilities.

Suggested fields:

- `feature_types`
- `analysis_types`
- `supports_jobs`
- `supports_images`
- `supports_survival`
- `supports_drug_response`

### `POST /api/v1/{module}/summary`

Returns summary-first payload for one feature.

Request:

```json
{
  "feature": "KIT"
}
```

### `POST /api/v1/{module}/features/check`

Checks whether features exist in eligible datasets.

Request:

```json
{
  "features": ["KIT", "PDGFRA"]
}
```

### `POST /api/v1/{module}/analysis/clinical`

Runs module-specific clinical association analysis.

Request:

```json
{
  "feature": "KIT"
}
```

### `POST /api/v1/{module}/analysis/survival`

Runs survival analysis if supported.

Request:

```json
{
  "feature": "KIT",
  "type": "OS",
  "cutoff": "Auto"
}
```

### `POST /api/v1/{module}/analysis/drug-response`

Runs drug response analysis if supported.

Request:

```json
{
  "feature": "KIT"
}
```


## Dataset Matching, Selection, and Provenance (Current v1 Behavior)

This section defines how callers should interpret multi-dataset hits in the current v1 API.

### Important v1 Constraints

- v1 does **not** currently expose a universal `dataset` request field for `summary`, `analysis/clinical`, `analysis/survival`, or `analysis/drug-response`.
- `data.datasets` means **availability hits** for the queried feature. It does **not** mean every downstream analysis block used every listed dataset.
- When exact cohort provenance matters, clients must inspect the endpoint-specific provenance fields described below.

### Recommended Client Workflow

1. Call `features/check` or `summary` first to enumerate matching datasets.
2. Run the desired analysis endpoint.
3. If the response includes explicit provenance fields such as `dataset`, `phosphosite`, `resolved_feature`, or dataset-specific statistics, display them.
4. If the response does not include explicit cohort provenance, treat the result as a legacy bundled analysis rather than a single-cohort result.

### Transcriptomics

- `summary`
  - `data.datasets` lists all matched mRNA cohorts.
  - `data.clinical_associations` is variable-scoped and may pool predefined cohort bundles.
  - `data.survival` returns at most one cohort per endpoint and exposes `dataset` inside each survival entry.
  - `data.drug_resistance` in summary mode is summary-only and does not currently expose a dataset id.
- `analysis/clinical`
  - returns one artifact per clinical variable
  - uses predefined variable-specific cohort bundles
  - does not currently expose contributing dataset ids per variable
- `analysis/survival`
  - selects the **first** mRNA cohort in internal order that contains the gene and the requested survival endpoint
  - returns `data.dataset`
- `analysis/drug-response`
  - selects the **first** configured drug-response cohort that contains both the gene and imatinib response labels
  - exposes the selected cohort in `data.statistics.dataset`

### Noncoding

- `summary`
  - `data.datasets` lists all matching datasets for the resolved RNA type
  - `data.rna_type` reports the resolved molecule class
  - `data.drug_resistance` uses the dedicated miRNA drug-response cohort and returns `resolved_feature`, but not a dataset id
- `analysis/clinical`
  - returns variable-specific artifacts for the detected RNA type
  - uses predefined cohort bundles
  - does not currently expose contributing dataset ids per variable
- `analysis/drug-response`
  - supports miRNA only
  - uses the dedicated miRNA drug-response cohort
  - returns `resolved_feature`, but not a dataset id

### Proteomics

- `summary`
  - `data.datasets` lists all matching studies
  - `data.survival` and `data.drug_resistance` summary blocks are driven by the Sun cohort only when the gene exists there
- `analysis/clinical`
  - invokes legacy clinical functions over the proteomics study list
  - does not currently enumerate contributing studies per variable
- `analysis/survival`
  - fixed to the Sun cohort
  - no request-time dataset override
- `analysis/drug-response`
  - fixed to the Sun cohort
  - no request-time dataset override

### Phosphoproteomics

- `summary`
  - `data.datasets` lists all protein-level availability hits
  - protein-level queries resolve to phosphosites internally
  - summary clinical logic uses the **first** phosphosite for the queried gene
  - summary survival logic uses the **first eligible** phosphosite for the requested endpoint
- `analysis/clinical`
  - resolves the input gene to the **first** phosphosite
  - returns `data.phosphosite`
- `analysis/survival`
  - chooses the **first** phosphosite with sufficient non-missing observations for the requested endpoint
  - returns `data.phosphosite`
  - dataset is fixed to the tumor phosphoproteomics cohort

### Singlecell

- `summary`
  - `data.datasets` lists all Seurat datasets containing the feature
- `analysis/clinical`
  - current v1 bridge maps to the per-dataset batch-style analysis
  - response is dataset-keyed rather than single-dataset selected
- `jobs`
  - preserves the requested mode (`summary`, `full`, or `render`)
  - downstream results remain per-dataset where applicable


## Single-Cell Job Endpoints

### `POST /api/v1/singlecell/jobs`

Submits an asynchronous single-cell analysis job.

### `GET /api/v1/singlecell/jobs/{job_id}`

Returns job status.

### `GET /api/v1/singlecell/jobs/{job_id}/result`

Returns job result if complete.

## Image Payload Convention

When a route returns a plot, `data` should use:

```json
{
  "plot_base64": "...",
  "plot_mime": "image/png",
  "plot_width": 1000,
  "plot_height": 800
}
```

## Migration Rules

- legacy routes remain available during v1 rollout
- `/api/v1` becomes the preferred integration surface
- module responses should be wrapped into the common response shape before old routes are retired

