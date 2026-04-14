export class ApiError extends Error {
  constructor({ code = 'ANALYSIS_FAILED', message = 'Unknown error', status = 500 } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function invalidInput(message) {
  return new ApiError({
    code: 'INVALID_INPUT',
    message,
    status: 400
  });
}

export function moduleNotReady(message = 'Requested module is not ready') {
  return new ApiError({
    code: 'MODULE_NOT_READY',
    message,
    status: 503
  });
}

export function notImplemented(message = 'This endpoint is not implemented yet') {
  return new ApiError({
    code: 'NOT_IMPLEMENTED',
    message,
    status: 501
  });
}

export function unsupportedAnalysis(message = 'This analysis is not supported for the requested module') {
  return new ApiError({
    code: 'UNSUPPORTED_ANALYSIS',
    message,
    status: 400
  });
}
