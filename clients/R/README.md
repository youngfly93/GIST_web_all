# dbGIST R Client

Minimal R client for the unified dbGIST API under `/api/v1`.

Current scope:

- transcriptomics
- noncoding

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

## Error handling

API and network failures raise a `dbgist_api_error` condition with:

- `status`
- `code`
- `message`
- `payload`
