import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './routes/chat.js';
import geneRouter from './routes/gene.js';
import proxyRouter from './routes/proxy.js';
import ncRNARouter from './routes/ncrna.js';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务 - 分析生成的图片
// Agent 保存图片到 backend/public/plots
const plotsDir = path.join(__dirname, '../public/plots');
app.use('/plots', express.static(plotsDir));
console.log(`[Static] 图片目录: ${plotsDir}`);

app.use('/api/chat', chatRouter);
app.use('/api/gene', geneRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/ncrna', ncRNARouter);

const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Backend running on ${HOST}:${PORT}`);
  console.log(`Plots available at: http://localhost:${PORT}/plots/`);
});