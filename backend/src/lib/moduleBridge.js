import { callPlumber } from './plumberClient.js';

function normalizeErrorMessage(upstream) {
  if (!upstream || typeof upstream !== 'object') return null;
  if (typeof upstream.error === 'string' && upstream.error.trim()) return upstream.error.trim();
  return null;
}

export function getBridgeSpec(moduleName) {
  if (moduleName === 'transcriptomics') {
    return {
      summary: { method: 'post', path: '/summary', buildParams: ({ feature }) => ({ gene: feature }) },
      featureCheck: {
        method: 'post',
        path: '/proteins/check',
        buildParams: ({ features }) => ({ gene_symbols: features.join(',') })
      },
      clinical: { method: 'post', path: '/analyze/batch', buildParams: ({ feature }) => ({ gene: feature }) },
      survival: {
        method: 'post',
        path: '/analyze/survival',
        buildParams: ({ feature, type = 'OS', cutoff = 'Auto' }) => ({ gene: feature, type, cutoff })
      },
      drugResponse: {
        method: 'post',
        path: '/analyze/drug-resistance',
        buildParams: ({ feature }) => ({ gene: feature })
      }
    };
  }

  if (moduleName === 'noncoding') {
    return {
      summary: { method: 'post', path: '/summary', buildParams: ({ feature }) => ({ gene: feature }) },
      featureCheck: {
        method: 'post',
        path: '/proteins/check',
        buildParams: ({ features }) => ({ gene_symbols: features.join(',') })
      },
      clinical: { method: 'post', path: '/analyze/batch', buildParams: ({ feature }) => ({ gene: feature }) },
      drugResponse: {
        method: 'post',
        path: '/analyze/drug-resistance',
        buildParams: ({ feature }) => ({ gene: feature })
      }
    };
  }

  if (moduleName === 'proteomics') {
    return {
      summary: { method: 'post', path: '/summary', buildParams: ({ feature }) => ({ gene: feature }) },
      featureCheck: {
        method: 'post',
        path: '/proteins/check',
        buildParams: ({ features }) => ({ gene_symbols: features.join(',') })
      },
      clinical: { method: 'post', path: '/analyze/batch', buildParams: ({ feature }) => ({ gene: feature }) },
      survival: {
        method: 'post',
        path: '/analyze/survival',
        buildParams: ({ feature, type = 'OS', cutoff = 'Auto' }) => ({ gene: feature, type, cutoff })
      },
      drugResponse: {
        method: 'post',
        path: '/analyze/drug-resistance',
        buildParams: ({ feature }) => ({ gene: feature })
      }
    };
  }

  if (moduleName === 'phosphoproteomics') {
    return {
      summary: { method: 'post', path: '/summary', buildParams: ({ feature }) => ({ gene: feature }) },
      featureCheck: {
        method: 'post',
        path: '/proteins/check',
        buildParams: ({ features }) => ({ gene_symbols: features.join(',') })
      },
      clinical: { method: 'post', path: '/analyze/batch', buildParams: ({ feature }) => ({ gene: feature }) },
      survival: {
        method: 'post',
        path: '/analyze/survival',
        buildParams: ({ feature, type = 'OS', cutoff = 'Auto' }) => ({ gene: feature, type, cutoff })
      }
    };
  }

  if (moduleName === 'singlecell') {
    return {
      summary: { method: 'post', path: '/summary', buildParams: ({ feature }) => ({ gene: feature }) },
      featureCheck: {
        method: 'post',
        path: '/proteins/check',
        buildParams: ({ features }) => ({ gene_symbols: features.join(',') })
      },
      clinical: { method: 'post', path: '/analyze/batch', buildParams: ({ feature }) => ({ gene: feature }) },
      jobsCreate: {
        method: 'post',
        path: '/jobs',
        buildParams: ({ feature, mode = 'full', analysis = null }) => ({ gene: feature, mode, analysis })
      },
      jobsStatus: {
        method: 'get',
        path: ({ jobId }) => `/jobs/${jobId}`
      },
      jobsResult: {
        method: 'get',
        path: ({ jobId }) => `/jobs/${jobId}/result`
      }
    };
  }

  return null;
}

export async function proxyModuleReadiness(moduleConfig, endpoint) {
  return callPlumber({
    moduleConfig,
    method: 'get',
    path: `/${endpoint}`
  });
}

export async function proxyModuleOperation(moduleConfig, moduleName, operation, payload) {
  const spec = getBridgeSpec(moduleName)?.[operation];
  if (!spec) return null;

  const upstream = await callPlumber({
    moduleConfig,
    method: spec.method,
    path: typeof spec.path === 'function' ? spec.path(payload) : spec.path,
    params: spec.buildParams ? spec.buildParams(payload) : undefined
  });

  return {
    upstream,
    upstreamError: normalizeErrorMessage(upstream)
  };
}
