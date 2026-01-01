import express from 'express';
import axios from 'axios';

const router = express.Router();

// Python GLM Agent 服务地址
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:5001';

// 创建不使用代理的 axios 实例 (避免本地请求被代理拦截)
const agentAxios = axios.create({
  proxy: false
});

router.post('/', async (req, res) => {
  try {
    const { message, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    console.log(`[Chat] 收到请求: ${message.substring(0, 100)}...`);
    console.log(`[Chat] Agent URL: ${AGENT_URL}`);

    // 转发到 Python GLM Agent
    const agentResponse = await agentAxios.post(
      `${AGENT_URL}/chat`,
      { message },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 600000 // 10分钟超时 (富集/GSEA 等分析可能较慢)
      }
    );

    const { reply, image } = agentResponse.data;

    console.log(`[Chat] Agent 回复: ${reply?.substring(0, 100)}...`);
    if (image) {
      console.log(`[Chat] 包含图片: ${image}`);
    }

    if (stream) {
      // 流式响应模式 - 逐字符发送
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }

      // 模拟流式输出
      const fullReply = reply || '';
      const chunkSize = 10; // 每次发送10个字符

      for (let i = 0; i < fullReply.length; i += chunkSize) {
        const chunk = fullReply.substring(i, i + chunkSize);
        res.write(chunk);
        if (typeof res.flush === 'function') {
          res.flush();
        }
        // 短暂延迟模拟打字效果
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // 如果有图片，在末尾添加图片标记
      if (image) {
        res.write(`\n\n[IMAGE:${image}]`);
      }

      res.end();

    } else {
      // 非流式响应
      res.json({
        reply: reply || '',
        image: image || null
      });
    }

  } catch (error) {
    console.error('[Chat] 错误详情:');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'AI Agent 服务未启动，请先启动 Python Agent 服务',
        details: `无法连接到 ${AGENT_URL}`
      });
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      res.status(504).json({
        error: '分析超时，请稍后重试',
        details: 'R 脚本执行时间过长'
      });
    } else {
      res.status(500).json({
        error: '抱歉，服务暂时不可用，请稍后再试。',
        details: error.message
      });
    }
  }
});

// SSE 流式聊天 - 实时 Agent 活动追踪
router.post('/stream', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    console.log(`[Chat/Stream] 收到请求: ${message.substring(0, 100)}...`);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    // 转发到 Python Agent SSE 端点
    const agentResponse = await agentAxios({
      method: 'POST',
      url: `${AGENT_URL}/chat/stream`,
      data: { message },
      headers: { 'Content-Type': 'application/json' },
      responseType: 'stream',
      timeout: 600000 // 10分钟超时
    });

    // 管道传输 SSE 流
    agentResponse.data.on('data', (chunk) => {
      res.write(chunk);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    });

    agentResponse.data.on('end', () => {
      console.log('[Chat/Stream] 流式传输完成');
      res.end();
    });

    agentResponse.data.on('error', (error) => {
      console.error('[Chat/Stream] 流式传输错误:', error.message);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('[Chat/Stream] 错误:', error.message);

    // 如果响应头尚未发送，设置 SSE 头
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    }

    const errorMessage = error.code === 'ECONNREFUSED'
      ? 'AI Agent 服务未启动'
      : error.code === 'ETIMEDOUT'
        ? '分析超时'
        : error.message;

    res.write(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`);
    res.end();
  }
});

// 重置对话历史
router.post('/reset', async (req, res) => {
  try {
    await agentAxios.post(`${AGENT_URL}/reset`);
    res.json({ message: '对话已重置' });
  } catch (error) {
    res.status(500).json({ error: '重置失败' });
  }
});

// 健康检查
router.get('/health', async (req, res) => {
  try {
    const response = await agentAxios.get(`${AGENT_URL}/health`, { timeout: 5000 });
    res.json({
      status: 'ok',
      agent: response.data
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Agent 服务不可用',
      agentUrl: AGENT_URL
    });
  }
});

export default router;
