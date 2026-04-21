import express from 'express';
import axios from 'axios';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import rateLimit from 'express-rate-limit';

const router = express.Router();
// Per-IP rate limit for the /api/chat POST endpoints (Step 9, 2026-04-21).
// /health is excluded. SSE streams: each new connection counts as 1 request.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 30,                // 30 requests per IP per minute
  standardHeaders: true,  // RateLimit-* headers
  legacyHeaders: false,   // disable X-RateLimit-* headers
  message: { error: 'rate_limited', message: '请求过于频繁，请稍后再试 (limit: 30 req/min/IP).' },
});


// Accepts either a base64 data URI (existing R/frontend usage) or a local file
// path (new: Shiny R clients pass the PNG path directly — Node reads it and
// base64-encodes, which is ~5× faster than the R-side readBin + base64encode).
// Paths must resolve under one of the allow-listed roots.
const PLOT_ROOT_CANDIDATES = [
  process.env.PLOT_ROOT,
  path.resolve(process.cwd(), 'backend/public/plots'),
  path.resolve(process.cwd(), 'public/plots'),
  '/home/ylab/GIST_web_all/backend/public/plots',
  '/home/ylab',
  '/mnt/f/work/yang_ylab/GIST_web_all'
].filter(Boolean);

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const resolveImage = async (image) => {
  if (!image || typeof image !== 'string') return image;
  if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  const abs = path.resolve(image);
  const underRoot = PLOT_ROOT_CANDIDATES.some((root) => {
    try {
      const r = path.resolve(root);
      return abs === r || abs.startsWith(`${r}${path.sep}`);
    } catch (_) {
      return false;
    }
  });
  if (!underRoot) {
    console.warn(`[Chat] image path rejected (outside allow-list): ${abs}`);
    return null;
  }
  try {
    const buf = await fs.readFile(abs);
    const mime = MIME_BY_EXT[path.extname(abs).toLowerCase()] || 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (error) {
    console.warn(`[Chat] failed to read image ${abs}: ${error.message}`);
    return null;
  }
};

const SYSTEM_PROMPT = `You are an assistant specialized in Gastrointestinal Stromal Tumor (GIST). Your primary role is to help users learn GIST-related knowledge, including:

1. Basic concepts and molecular mechanisms of GIST
2. Common gene mutations (e.g., KIT, PDGFRA)
3. Diagnostic methods and pathological features
4. Treatment options and drug information
5. Research progress and literature resources

When an image is provided, carefully analyze the figure, including data characteristics, key trends, relevance to GIST research, and potential clinical implications.

Communication style: use clear, plain, and educational language; avoid medical advice. For clinical decisions, remind the user to consult a physician.

Language policy: Reply in English by default. If the user's message is written in Chinese (Simplified) or primarily contains Chinese characters, answer in Chinese (简体中文). Otherwise reply in English.`;

const getProviderConfig = () => {
  const providerFromEnv = (process.env.PROVIDER || '').toLowerCase();
  const useDeepseek = providerFromEnv === 'deepseek' || (!!process.env.DS_API_KEY && !!process.env.DS_API_URL);

  return {
    provider: useDeepseek ? 'deepseek' : 'ark',
    apiUrl: useDeepseek
      ? (process.env.DS_API_URL || 'https://api.deepseek.com/v1/chat/completions')
      : process.env.ARK_API_URL,
    apiKey: useDeepseek ? process.env.DS_API_KEY : process.env.ARK_API_KEY,
    modelId: useDeepseek
      ? (process.env.DS_MODEL_ID || 'deepseek-chat')
      : (process.env.ARK_MODEL_ID || 'deepseek-v3-250324')
  };
};

const buildUserContent = (message, image) => {
  if (!image) {
    return message;
  }

  return [
    {
      type: 'text',
      text: message
    },
    {
      type: 'image_url',
      image_url: {
        url: image
      }
    }
  ];
};

const buildRequestData = ({ message, image, stream }) => ({
  model: getProviderConfig().modelId,
  messages: [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: buildUserContent(message, image)
    }
  ],
  temperature: 0.7,
  max_tokens: 1500,
  stream
});

const writeSseEvent = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }
};

const streamProviderResponse = (upstream, onDelta) => new Promise((resolve, reject) => {
  let buffer = '';

  upstream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }

      if (line === 'data: [DONE]') {
        continue;
      }

      try {
        const payload = JSON.parse(line.slice(6));
        const delta = payload.choices?.[0]?.delta?.content;

        if (delta) {
          onDelta(delta);
        }
      } catch (error) {
        console.error('Parse stream chunk error:', error);
      }
    }
  });

  upstream.on('end', resolve);
  upstream.on('error', reject);
});

router.post('/', chatLimiter, async (req, res) => {
  try {
    const { message, image, stream = false } = req.body;
    const appTag = req.get('x-dbgist-app') || 'unknown';

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    const providerConfig = getProviderConfig();

    if (!providerConfig.apiKey || !providerConfig.apiUrl) {
      return res.status(500).json({ error: 'AI服务未正确配置（缺少密钥或URL）' });
    }

    const resolvedImage = await resolveImage(image);

    console.log(
      `[Chat] App=${appTag} Provider=${providerConfig.provider} Model=${providerConfig.modelId} Stream=${stream} ImageIn=${typeof image}:${image ? image.slice(0, 60) : 'none'} ImageResolved=${!!resolvedImage}`
    );

    const requestData = {
      ...buildRequestData({ message, image: resolvedImage, stream }),
      model: providerConfig.modelId
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const upstream = await axios.post(providerConfig.apiUrl, requestData, {
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000
      });

      // If the client aborts (widget's AbortController, user navigates away, etc.),
      // tear down the upstream stream promptly so tokens aren't billed for nothing.
      const onClientClose = () => {
        console.log(`[Chat] App=${appTag} client disconnected — aborting upstream stream`);
        try { upstream.data.destroy(); } catch { /* noop */ }
      };
      req.on('close', onClientClose);

      try {
        await streamProviderResponse(upstream.data, (delta) => {
          if (!res.writableEnded) {
            res.write(delta);
            if (typeof res.flush === 'function') res.flush();
          }
        });
      } catch (streamErr) {
        if (!req.aborted) throw streamErr;
      } finally {
        req.off('close', onClientClose);
      }

      if (!res.writableEnded) res.end();
      return;
    }

    const upstream = await axios.post(providerConfig.apiUrl, requestData, {
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const reply = upstream.data.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (error) {
    console.error('Chat API error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);

    if (error.response?.status === 401) {
      res.status(500).json({
        error: 'API认证失败，请检查API Key是否正确。'
      });
    } else if (error.response?.status === 429) {
      res.status(500).json({
        error: 'API调用频率过高，请稍后再试。'
      });
    } else {
      res.status(500).json({
        error: '抱歉，AI服务暂时不可用，请稍后再试。',
        details: error.response?.data?.error || error.message
      });
    }
  }
});

router.post('/stream', chatLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    const providerConfig = getProviderConfig();

    if (!providerConfig.apiKey || !providerConfig.apiUrl) {
      return res.status(500).json({ error: 'AI服务未正确配置（缺少密钥或URL）' });
    }

    console.log(
      `[Chat/Stream] Provider=${providerConfig.provider} URL=${providerConfig.apiUrl} Model=${providerConfig.modelId}`
    );

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    writeSseEvent(res, 'thinking', {
      content: 'Analyzing your question...'
    });

    const upstream = await axios.post(
      providerConfig.apiUrl,
      {
        ...buildRequestData({ message, image: undefined, stream: true }),
        model: providerConfig.modelId
      },
      {
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000
      }
    );

    let fullContent = '';
    await streamProviderResponse(upstream.data, (delta) => {
      fullContent += delta;
      writeSseEvent(res, 'text', {
        content: fullContent,
        delta
      });
    });

    writeSseEvent(res, 'done', { message: 'complete' });
    res.end();
  } catch (error) {
    console.error('[Chat/Stream] error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);

    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    const errorMessage = error.response?.status === 401
      ? 'API认证失败，请检查API Key是否正确。'
      : error.response?.status === 429
        ? 'API调用频率过高，请稍后再试。'
        : (error.response?.data?.error || error.message || 'AI服务暂时不可用');

    writeSseEvent(res, 'error', { message: errorMessage });
    res.end();
  }
});

router.get('/health', async (_req, res) => {
  const providerConfig = getProviderConfig();
  res.json({
    status: providerConfig.apiKey && providerConfig.apiUrl ? 'ok' : 'error',
    provider: providerConfig.provider,
    apiUrl: providerConfig.apiUrl,
    modelId: providerConfig.modelId
  });
});

export default router;
