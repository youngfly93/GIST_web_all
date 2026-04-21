const host = window.location.hostname;
const port = window.location.port;
const protocol = window.location.protocol;
const isLocal = host === 'localhost' || host === '127.0.0.1';

const buildOrigin = (forcedPort?: string) => {
  const normalizedPort = forcedPort ?? port;
  return normalizedPort ? `${protocol}//${host}:${normalizedPort}` : `${protocol}//${host}`;
};

const buildShinyUrl = (productionPath: string, developmentUrl: string) => {
  if (isLocal) {
    return developmentUrl;
  }

  if (port === '81') {
    return `${buildOrigin('81')}${productionPath}`;
  }

  return `${buildOrigin()}${productionPath}`;
};

const config = {
  apiBaseUrl: (() => {
    if (isLocal) {
      return 'http://localhost:8000/api';
    }

    if (port === '81') {
      return `${buildOrigin('81')}/api`;
    }

    return `${buildOrigin()}/api`;
  })(),

  // Step 13 (2026-04-21): basic mode now uses single Shiny instance with ?mode=basic.
  // Old per-omics basic ports (4966/4967/4971/4975/4991/4993) decommissioned.
  // Legacy /<omics>-basic/ paths still work via nginx rewrite (Step 12).
  shinyUrls: {
    transcriptomics: {
      ai: buildShinyUrl('/transcriptomics/', 'http://127.0.0.1:4964/'),
      noAi: buildShinyUrl('/transcriptomics/?mode=basic', 'http://127.0.0.1:4964/?mode=basic'),
    },
    proteomics: {
      ai: buildShinyUrl('/proteomics/', 'http://127.0.0.1:4968/'),
      noAi: buildShinyUrl('/proteomics/?mode=basic', 'http://127.0.0.1:4968/?mode=basic'),
    },
    posttranslational: {
      ai: buildShinyUrl('/posttranslational/', 'http://127.0.0.1:4972/'),
      noAi: buildShinyUrl('/posttranslational/?mode=basic', 'http://127.0.0.1:4972/?mode=basic'),
    },
    singlecell: {
      ai: buildShinyUrl('/singlecell/', 'http://127.0.0.1:4974/'),
      noAi: buildShinyUrl('/singlecell/?mode=basic', 'http://127.0.0.1:4974/?mode=basic'),
    },
    noncoding: {
      ai: buildShinyUrl('/noncoding/', 'http://127.0.0.1:4992/'),
      noAi: buildShinyUrl('/noncoding/?mode=basic', 'http://127.0.0.1:4992/?mode=basic'),
    },
    genomics: {
      ai: buildShinyUrl('/genomics/', 'http://127.0.0.1:4994/'),
      noAi: buildShinyUrl('/genomics/?mode=basic', 'http://127.0.0.1:4994/?mode=basic'),
    },
  },
};

export default config;
