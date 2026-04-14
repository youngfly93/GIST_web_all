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

