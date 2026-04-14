export const moduleRegistry = {
  transcriptomics: {
    module: 'transcriptomics',
    feature_types: ['gene'],
    analysis_types: ['summary', 'clinical', 'survival', 'drug-response'],
    supports_jobs: false,
    supports_images: true,
    supports_survival: true,
    supports_drug_response: true,
    bridge: {
      kind: 'plumber',
      env_var: 'PLUMBER_TRANSCRIPTOMICS_BASE_URL',
      default_base_url: 'http://127.0.0.1:4970'
    }
  },
  noncoding: {
    module: 'noncoding',
    feature_types: ['miRNA', 'circRNA', 'lncRNA'],
    analysis_types: ['summary', 'clinical', 'drug-response'],
    supports_jobs: false,
    supports_images: true,
    supports_survival: false,
    supports_drug_response: true,
    bridge: {
      kind: 'plumber',
      env_var: 'PLUMBER_NONCODING_BASE_URL',
      default_base_url: 'http://127.0.0.1:4974'
    }
  },
  proteomics: {
    module: 'proteomics',
    feature_types: ['protein'],
    analysis_types: ['summary', 'clinical', 'survival', 'drug-response'],
    supports_jobs: false,
    supports_images: true,
    supports_survival: true,
    supports_drug_response: true,
    bridge: {
      kind: 'plumber',
      env_var: 'PLUMBER_PROTEOMICS_BASE_URL',
      default_base_url: 'http://127.0.0.1:4966'
    }
  },
  phosphoproteomics: {
    module: 'phosphoproteomics',
    feature_types: ['phosphosite', 'protein'],
    analysis_types: ['summary', 'clinical', 'survival'],
    supports_jobs: false,
    supports_images: true,
    supports_survival: true,
    supports_drug_response: false,
    bridge: {
      kind: 'plumber',
      env_var: 'PLUMBER_PHOSPHO_BASE_URL',
      default_base_url: 'http://127.0.0.1:4968'
    }
  },
  singlecell: {
    module: 'singlecell',
    feature_types: ['gene', 'celltype'],
    analysis_types: ['summary', 'clinical', 'jobs'],
    supports_jobs: true,
    supports_images: true,
    supports_survival: false,
    supports_drug_response: false
  }
};

export function getModuleConfig(moduleName) {
  return moduleRegistry[moduleName] || null;
}

export function listModules() {
  return Object.values(moduleRegistry);
}
