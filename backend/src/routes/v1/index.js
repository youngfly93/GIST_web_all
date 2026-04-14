import express from 'express';
import { sendSuccess } from '../../lib/apiResponse.js';
import { createModuleRouter } from './createModuleRouter.js';
import { listModules } from './moduleRegistry.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  return sendSuccess(res, {
    module: 'platform',
    endpoint: 'health',
    data: {
      status: 'ok',
      api: 'dbGIST unified api',
      version: 'v1'
    }
  });
});

router.get('/modules', (_req, res) => {
  return sendSuccess(res, {
    module: 'platform',
    endpoint: 'modules',
    data: {
      modules: listModules()
    }
  });
});

router.use('/transcriptomics', createModuleRouter('transcriptomics'));
router.use('/noncoding', createModuleRouter('noncoding'));
router.use('/proteomics', createModuleRouter('proteomics'));
router.use('/phosphoproteomics', createModuleRouter('phosphoproteomics'));
router.use('/singlecell', createModuleRouter('singlecell'));

export default router;
