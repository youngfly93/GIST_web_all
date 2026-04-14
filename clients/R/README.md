# dbGIST R Client

Minimal R client for the unified dbGIST API under `/api/v1`.

Current scope:

- transcriptomics
- noncoding
- proteomics
- phosphoproteomics
- singlecell

The client is a single sourceable script and currently depends on:

- `httr2`
- `jsonlite`

## Quick start

```r
source("clients/R/dbgist_v1_client.R")

client <- dbgist_client("http://127.0.0.1:8000")

client$health()
client$transcriptomics_summary("KIT")
client$noncoding_summary("hsa-miR-21-5p")
```

## Available methods

- `health()`
- `modules()`
- `module_health(module)`
- `module_ready(module)`
- `module_capabilities(module)`
- `transcriptomics_summary(feature)`
- `transcriptomics_features_check(features)`
- `transcriptomics_clinical(feature)`
- `transcriptomics_survival(feature, survival_type = "OS", cutoff = "Auto")`
- `transcriptomics_drug_response(feature)`
- `noncoding_summary(feature)`
- `noncoding_features_check(features)`
- `noncoding_clinical(feature)`
- `noncoding_drug_response(feature)`
- `proteomics_summary(feature)`
- `proteomics_features_check(features)`
- `proteomics_clinical(feature)`
- `proteomics_survival(feature, survival_type = "OS", cutoff = "Auto")`
- `proteomics_drug_response(feature)`
- `phosphoproteomics_summary(feature)`
- `phosphoproteomics_features_check(features)`
- `phosphoproteomics_clinical(feature)`
- `phosphoproteomics_survival(feature, survival_type = "OS", cutoff = "Auto")`
- `singlecell_summary(feature)`
- `singlecell_features_check(features)`
- `singlecell_clinical(feature)`
- `singlecell_submit_job(feature, mode = "full", analysis = NULL)`
- `singlecell_job_status(job_id)`
- `singlecell_job_result(job_id)`

## Error handling

API and network failures raise a `dbgist_api_error` condition with:

- `status`
- `code`
- `message`
- `payload`
