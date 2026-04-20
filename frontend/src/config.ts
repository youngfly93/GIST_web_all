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

  shinyUrls: {
    transcriptomics: {
      ai: buildShinyUrl('/transcriptomics/', 'http://127.0.0.1:4964/'),
      noAi: buildShinyUrl('/transcriptomics-basic/', 'http://127.0.0.1:4966/'),
    },
    proteomics: {
      ai: buildShinyUrl('/proteomics/', 'http://127.0.0.1:4968/'),
      noAi: buildShinyUrl('/proteomics-basic/', 'http://127.0.0.1:4967/'),
    },
    posttranslational: {
      ai: buildShinyUrl('/posttranslational/', 'http://127.0.0.1:4972/'),
      noAi: buildShinyUrl('/posttranslational-basic/', 'http://127.0.0.1:4971/'),
    },
    singlecell: {
      ai: buildShinyUrl('/singlecell/', 'http://127.0.0.1:4974/'),
      noAi: buildShinyUrl('/singlecell-basic/', 'http://127.0.0.1:4975/'),
    },
    noncoding: {
      ai: buildShinyUrl('/noncoding/', 'http://127.0.0.1:4992/'),
      noAi: buildShinyUrl('/noncoding-basic/', 'http://127.0.0.1:4991/'),
    },
    genomics: {
      ai: buildShinyUrl('/genomics/', 'http://127.0.0.1:4994/'),
      noAi: buildShinyUrl('/genomics-basic/', 'http://127.0.0.1:4993/'),
    },
  },
};

export default config;
