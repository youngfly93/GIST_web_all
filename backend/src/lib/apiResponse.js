import { randomUUID } from 'crypto';

const VERSION = 'v1';

export function buildMeta() {
  return {
    request_id: randomUUID(),
    version: VERSION,
    generated_at: new Date().toISOString()
  };
}

export function successPayload({ module = 'platform', endpoint, data = null, meta = buildMeta() }) {
  return {
    ok: true,
    module,
    endpoint,
    data,
    error: null,
    meta
  };
}

export function errorPayload({
  module = 'platform',
  endpoint,
  code = 'ANALYSIS_FAILED',
  message = 'Unknown error',
  status = 500,
  meta = buildMeta()
}) {
  return {
    status,
    body: {
      ok: false,
      module,
      endpoint,
      data: null,
      error: {
        code,
        message
      },
      meta
    }
  };
}

export function sendSuccess(res, { module = 'platform', endpoint, data = null, status = 200 }) {
  return res.status(status).json(successPayload({ module, endpoint, data }));
}

export function sendError(res, { module = 'platform', endpoint, code, message, status = 500 }) {
  const payload = errorPayload({ module, endpoint, code, message, status });
  return res.status(payload.status).json(payload.body);
}

