# dbGIST Python Client

Minimal Python client for the unified dbGIST API under `/api/v1`.

Current scope:

- transcriptomics
- noncoding

This client uses only the Python standard library.

## Quick start

```python
from dbgist_v1_client import DbGistClient

client = DbGistClient("http://127.0.0.1:8000")

print(client.health())
print(client.transcriptomics_summary("KIT"))
print(client.noncoding_summary("hsa-miR-21-5p"))
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
- `transcriptomics_survival(feature, survival_type="OS", cutoff="Auto")`
- `transcriptomics_drug_response(feature)`
- `noncoding_summary(feature)`
- `noncoding_features_check(features)`
- `noncoding_clinical(feature)`
- `noncoding_drug_response(feature)`

## Error handling

Methods raise `DbGistApiError` for:

- HTTP errors
- upstream API errors with `ok=false`
- network errors

The exception includes:

- `status`
- `code`
- `message`
- `payload`
