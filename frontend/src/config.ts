// API配置文件
const config = {
  // 根据访问端口自动判断API基础URL
  apiBaseUrl: (() => {
    const host = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // 如果是81端口访问，使用81端口的API路由
    if (port === '81') {
      return `${protocol}//${host}:81/api`;
    }
    
    // 开发环境
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    
    // 生产环境默认
    return `${protocol}//${host}/api`;
  })(),
  
  // R Shiny应用端点
  shinyUrls: {
    transcriptomics: {
      ai: (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        if (port === '81') {
          return `${protocol}//${host}:81/transcriptomics/`;
        }
        return 'http://117.72.75.45:4964/';
      })(),
      noAi: (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        if (port === '81') {
          return `${protocol}//${host}:81/transcriptomics-basic/`;
        }
        return 'http://117.72.75.45:4966/';
      })()
    },
    proteomics: {
      ai: (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        if (port === '81') {
          return `${protocol}//${host}:81/proteomics/`;
        }
        return 'http://117.72.75.45:4968/';
      })(),
      noAi: (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        if (port === '81') {
          return `${protocol}//${host}:81/proteomics-basic/`;
        }
        return 'http://117.72.75.45:4967/';
      })()
    },
    posttranslational: {
      ai: (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        if (port === '81') {
          return `${protocol}//${host}:81/posttranslational/`;
        }
        return 'http://117.72.75.45:4972/';
      })(),
      noAi: (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        if (port === '81') {
          return `${protocol}//${host}:81/posttranslational-basic/`;
        }
        return 'http://117.72.75.45:4971/';
      })()
    }
  }
};

export default config; 