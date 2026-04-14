import axios from 'axios';
import { ApiError } from './apiErrors.js';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function getPlumberBaseUrl(moduleConfig) {
  const envVar = moduleConfig?.bridge?.env_var;
  const defaultBaseUrl = moduleConfig?.bridge?.default_base_url;
  const configured = envVar ? process.env[envVar] : null;
  const baseUrl = configured || defaultBaseUrl;

  if (!baseUrl) {
    throw new ApiError({
      code: 'MODULE_NOT_READY',
      message: `No plumber base URL configured for module ${moduleConfig?.module || 'unknown'}`,
      status: 503
    });
  }

  return trimTrailingSlash(baseUrl);
}

export async function callPlumber({
  moduleConfig,
  method = 'get',
  path,
  params = {},
  timeout = 120000
}) {
  const baseUrl = getPlumberBaseUrl(moduleConfig);
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const response = await axios({
      method,
      url,
      timeout,
      proxy: false,
      ...(method.toLowerCase() === 'get'
        ? { params }
        : {
            data: new URLSearchParams(
              Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
            ).toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new ApiError({
        code: 'ANALYSIS_FAILED',
        message: `Upstream ${moduleConfig.module} plumber returned ${error.response.status}`,
        status: 502
      });
    }

    throw new ApiError({
      code: 'MODULE_NOT_READY',
      message: `Cannot reach upstream ${moduleConfig.module} plumber`,
      status: 503
    });
  }
}
