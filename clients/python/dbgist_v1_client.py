#!/usr/bin/env python3
"""Minimal Python client for dbGIST unified API v1.

This client intentionally uses only the Python standard library.
It exposes thin wrappers around the currently bridged transcriptomics
and noncoding endpoints under /api/v1.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Optional
from urllib import error, parse, request


@dataclass
class DbGistApiError(RuntimeError):
    status: int
    code: str
    message: str
    payload: Optional[Dict[str, Any]] = None

    def __str__(self) -> str:
        return f"dbGIST API error [{self.status} {self.code}]: {self.message}"


class DbGistClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8000", timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path if path.startswith('/') else '/' + path}"

    def _request(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = request.Request(self._url(path), data=data, headers=headers, method=method.upper())
        opener = request.build_opener(request.ProxyHandler({}))

        try:
            with opener.open(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8")
                parsed = json.loads(body)
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(body)
                err = parsed.get("error") or {}
                raise DbGistApiError(
                    status=exc.code,
                    code=err.get("code", "HTTP_ERROR"),
                    message=err.get("message", body),
                    payload=parsed,
                ) from None
            except json.JSONDecodeError:
                raise DbGistApiError(
                    status=exc.code,
                    code="HTTP_ERROR",
                    message=body or exc.reason,
                    payload=None,
                ) from None
        except error.URLError as exc:
            raise DbGistApiError(
                status=503,
                code="NETWORK_ERROR",
                message=str(exc.reason),
                payload=None,
            ) from None

        if not isinstance(parsed, dict):
            raise DbGistApiError(status=500, code="INVALID_RESPONSE", message="Response is not a JSON object")

        if parsed.get("ok") is False:
            err = parsed.get("error") or {}
            raise DbGistApiError(
                status=400,
                code=err.get("code", "API_ERROR"),
                message=err.get("message", "Unknown API error"),
                payload=parsed,
            )

        return parsed

    def _get(self, path: str) -> Dict[str, Any]:
        return self._request("GET", path)

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", path, payload)

    def _module_get(self, module: str, endpoint: str) -> Dict[str, Any]:
        return self._get(f"/api/v1/{module}/{endpoint}")

    def _module_post(self, module: str, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._post(f"/api/v1/{module}/{endpoint}", payload)

    @staticmethod
    def _normalize_features(features: Iterable[str]) -> list[str]:
        return [str(item).strip() for item in features if str(item).strip()]

    # Platform
    def health(self) -> Dict[str, Any]:
        return self._get("/api/v1/health")

    def modules(self) -> Dict[str, Any]:
        return self._get("/api/v1/modules")

    # Generic module access
    def module_health(self, module: str) -> Dict[str, Any]:
        return self._module_get(module, "health")

    def module_ready(self, module: str) -> Dict[str, Any]:
        return self._module_get(module, "ready")

    def module_capabilities(self, module: str) -> Dict[str, Any]:
        return self._module_get(module, "capabilities")

    # Transcriptomics
    def transcriptomics_health(self) -> Dict[str, Any]:
        return self.module_health("transcriptomics")

    def transcriptomics_ready(self) -> Dict[str, Any]:
        return self.module_ready("transcriptomics")

    def transcriptomics_capabilities(self) -> Dict[str, Any]:
        return self.module_capabilities("transcriptomics")

    def transcriptomics_summary(self, feature: str) -> Dict[str, Any]:
        return self._module_post("transcriptomics", "summary", {"feature": feature})

    def transcriptomics_features_check(self, features: Iterable[str]) -> Dict[str, Any]:
        return self._module_post(
            "transcriptomics",
            "features/check",
            {"features": self._normalize_features(features)},
        )

    def transcriptomics_clinical(self, feature: str) -> Dict[str, Any]:
        return self._module_post("transcriptomics", "analysis/clinical", {"feature": feature})

    def transcriptomics_survival(
        self, feature: str, survival_type: str = "OS", cutoff: str = "Auto"
    ) -> Dict[str, Any]:
        return self._module_post(
            "transcriptomics",
            "analysis/survival",
            {"feature": feature, "type": survival_type, "cutoff": cutoff},
        )

    def transcriptomics_drug_response(self, feature: str) -> Dict[str, Any]:
        return self._module_post("transcriptomics", "analysis/drug-response", {"feature": feature})

    # Noncoding
    def noncoding_health(self) -> Dict[str, Any]:
        return self.module_health("noncoding")

    def noncoding_ready(self) -> Dict[str, Any]:
        return self.module_ready("noncoding")

    def noncoding_capabilities(self) -> Dict[str, Any]:
        return self.module_capabilities("noncoding")

    def noncoding_summary(self, feature: str) -> Dict[str, Any]:
        return self._module_post("noncoding", "summary", {"feature": feature})

    def noncoding_features_check(self, features: Iterable[str]) -> Dict[str, Any]:
        return self._module_post(
            "noncoding",
            "features/check",
            {"features": self._normalize_features(features)},
        )

    def noncoding_clinical(self, feature: str) -> Dict[str, Any]:
        return self._module_post("noncoding", "analysis/clinical", {"feature": feature})

    def noncoding_drug_response(self, feature: str) -> Dict[str, Any]:
        return self._module_post("noncoding", "analysis/drug-response", {"feature": feature})


__all__ = ["DbGistClient", "DbGistApiError"]
