import express from 'express';
import axios from 'axios';

const router = express.Router();

// 代理R Shiny请求 - 使用中间件处理所有/shiny开头的请求
router.use('/shiny', async (req, res) => {
  try {
    const path = req.originalUrl.replace('/api/proxy/shiny/', '');
    
    // Use local Shiny app in development, remote in production
    const shinyBaseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:4964'
      : 'http://117.72.75.45/dbGIST_shiny';
    const shinyUrl = `${shinyBaseUrl}/${path}`;
    
    const response = await axios.get(shinyUrl, {
      responseType: 'arraybuffer',
      headers: {
        ...req.headers,
        host: process.env.NODE_ENV === 'development' ? '127.0.0.1' : '117.72.75.45'
      }
    });

    // 设置响应头
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  }
});

// 拦截图片下载请求并分析
router.post('/analyze-download', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    // 下载图片
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    // 转换为base64
    const base64Image = `data:${imageResponse.headers['content-type']};base64,${Buffer.from(imageResponse.data).toString('base64')}`;
    
    // 直接调用AI分析
    const analysisPrompt = "请分析这个GIST相关的图表。包括：1. 图表类型和数据特征 2. 主要发现和趋势 3. 对GIST研究的意义 4. 可能的临床应用";
    
    const arkResponse = await axios.post(
      process.env.ARK_API_URL,
      {
        model: process.env.ARK_MODEL_ID || "deepseek-v3-250324",
        messages: [
          {
            role: "system",
            content: "你是一个专注于胃肠道间质瘤（GIST）的辅助智能助手..."
          },
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({
      analysis: arkResponse.data.choices[0].message.content,
      image: base64Image
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: '分析失败' });
  }
});

export default router;