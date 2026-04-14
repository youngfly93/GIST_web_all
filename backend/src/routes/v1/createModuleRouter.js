import express from 'express';
import { sendError, sendSuccess } from '../../lib/apiResponse.js';
import { ApiError, invalidInput, moduleNotReady, notImplemented, unsupportedAnalysis } from '../../lib/apiErrors.js';
import { getBridgeSpec, proxyModuleOperation, proxyModuleReadiness } from '../../lib/moduleBridge.js';
import { getModuleConfig } from './moduleRegistry.js';

function parseFeatures(body) {
  if (Array.isArray(body?.features)) {
    return body.features.filter(Boolean);
  }
  if (typeof body?.features === 'string') {
    return body.features.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export function createModuleRouter(moduleName) {
  const router = express.Router();
  const config = getModuleConfig(moduleName);
  const bridgeSpec = getBridgeSpec(moduleName);

  if (!config) {
    throw new Error(`Unknown module: ${moduleName}`);
  }

  function hasBridge() {
    return Boolean(config.bridge && bridgeSpec);
  }

  function requireFeature(body) {
    const feature = (body?.feature || '').trim();
    if (!feature) {
      throw invalidInput('feature is required');
    }
    return feature;
  }

  async function withApiHandling(res, endpoint, fn) {
    try {
      const data = await fn();
      return sendSuccess(res, {
        module: moduleName,
        endpoint,
        data
      });
    } catch (error) {
      const apiError = error instanceof ApiError
        ? error
        : new ApiError({
            code: 'ANALYSIS_FAILED',
            message: error?.message || 'Unknown error',
            status: 500
          });

      return sendError(res, {
        module: moduleName,
        endpoint,
        code: apiError.code,
        message: apiError.message,
        status: apiError.status
      });
    }
  }

  router.get('/health', (_req, res) => {
    return withApiHandling(res, 'health', async () => {
      if (!hasBridge()) {
        return {
          status: 'ok',
          module: moduleName
        };
      }

      return proxyModuleReadiness(config, 'health');
    });
  });

  router.get('/ready', (_req, res) => {
    return withApiHandling(res, 'ready', async () => {
      if (!hasBridge()) {
        throw moduleNotReady('plumber bridge is not connected');
      }

      return proxyModuleReadiness(config, 'ready');
    });
  });

  router.get('/capabilities', (_req, res) => {
    return withApiHandling(res, 'capabilities', async () => {
      if (!hasBridge()) {
        return config;
      }

      const upstream = await proxyModuleReadiness(config, 'capabilities');
      return {
        ...config,
        upstream
      };
    });
  });

  router.post('/summary', (req, res) => {
    return withApiHandling(res, 'summary', async () => {
      const feature = requireFeature(req.body);
      if (!hasBridge()) {
        throw notImplemented('Unified summary bridge is not implemented yet');
      }

      const { upstream } = await proxyModuleOperation(config, moduleName, 'summary', { feature });
      return upstream;
    });
  });

  router.post('/features/check', (req, res) => {
    return withApiHandling(res, 'features/check', async () => {
      const features = parseFeatures(req.body);
      if (features.length === 0) {
        throw invalidInput('features is required');
      }
      if (!hasBridge()) {
        throw notImplemented('Unified feature check bridge is not implemented yet');
      }

      const { upstream } = await proxyModuleOperation(config, moduleName, 'featureCheck', { features });
      return upstream;
    });
  });

  router.post('/analysis/clinical', (req, res) => {
    return withApiHandling(res, 'analysis/clinical', async () => {
      const feature = requireFeature(req.body);
      if (!hasBridge()) {
        throw notImplemented('Unified clinical analysis bridge is not implemented yet');
      }

      const { upstream, upstreamError } = await proxyModuleOperation(config, moduleName, 'clinical', { feature });
      if (upstreamError) {
        throw new ApiError({
          code: 'ANALYSIS_FAILED',
          message: upstreamError,
          status: 422
        });
      }

      return upstream;
    });
  });

  router.post('/analysis/survival', (req, res) => {
    return withApiHandling(res, 'analysis/survival', async () => {
      if (!config.supports_survival) {
        throw unsupportedAnalysis('Survival analysis is not supported for this module');
      }

      const feature = requireFeature(req.body);
      if (!hasBridge()) {
        throw notImplemented('Unified survival bridge is not implemented yet');
      }

      const { upstream, upstreamError } = await proxyModuleOperation(config, moduleName, 'survival', {
        feature,
        type: req.body?.type || 'OS',
        cutoff: req.body?.cutoff || 'Auto'
      });
      if (upstreamError) {
        throw new ApiError({
          code: 'ANALYSIS_FAILED',
          message: upstreamError,
          status: 422
        });
      }

      return upstream;
    });
  });

  router.post('/analysis/drug-response', (req, res) => {
    return withApiHandling(res, 'analysis/drug-response', async () => {
      if (!config.supports_drug_response) {
        throw unsupportedAnalysis('Drug-response analysis is not supported for this module');
      }

      const feature = requireFeature(req.body);
      if (!hasBridge()) {
        throw notImplemented('Unified drug-response bridge is not implemented yet');
      }

      const { upstream, upstreamError } = await proxyModuleOperation(config, moduleName, 'drugResponse', {
        feature
      });
      if (upstreamError) {
        throw new ApiError({
          code: 'ANALYSIS_FAILED',
          message: upstreamError,
          status: 422
        });
      }

      return upstream;
    });
  });

  if (config.supports_jobs) {
    router.post('/jobs', (_req, res) => {
      return sendError(res, {
        module: moduleName,
        endpoint: 'jobs',
        code: 'NOT_IMPLEMENTED',
        message: 'Unified single-cell job submission is not implemented yet',
        status: 501
      });
    });

    router.get('/jobs/:jobId', (req, res) => {
      return sendError(res, {
        module: moduleName,
        endpoint: `jobs/${req.params.jobId}`,
        code: 'NOT_IMPLEMENTED',
        message: 'Unified single-cell job status is not implemented yet',
        status: 501
      });
    });

    router.get('/jobs/:jobId/result', (req, res) => {
      return sendError(res, {
        module: moduleName,
        endpoint: `jobs/${req.params.jobId}/result`,
        code: 'NOT_IMPLEMENTED',
        message: 'Unified single-cell job result is not implemented yet',
        status: 501
      });
    });
  }

  return router;
}
