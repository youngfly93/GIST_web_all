项目结构总览
text
复制
编辑
gist-ai-site/
├─ frontend/              # React + Vite
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ Home.tsx        # 首页，含两个模块
│  │  │  └─ GeneInfo.tsx    # 基因信息模块
│  │  ├─ components/
│  │  │  ├─ ChatBox.tsx     # AI 问答 UI
│  │  │  └─ Navbar.tsx
│  │  └─ routes.tsx        # React Router 定义
│  └─ .env                 # 前端配置（不含任何密钥）
├─ backend/               # Node.js (Express)
│  ├─ src/
│  │  ├─ routes/
│  │  │  ├─ chat.js        # 代理火山方舟
│  │  │  └─ gene.js        # 基因信息
│  │  ├─ services/
│  │  │  └─ geneFetcher.js # 调 PubChem API
│  │  └─ index.js          # 入口
├─ docker-compose.yml
└─ README.md
后端实现（Node.js + Express）
1. 安装依赖
bash
复制
编辑
cd backend
npm init -y
npm i express axios dotenv cors
2. 入口文件 src/index.js
js
复制
编辑
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import geneRouter from './routes/gene.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/gene', geneRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
3. 基因信息查询路由 src/routes/gene.js
js
复制
编辑
import express from 'express';
import { fetchGeneInfo } from '../services/geneFetcher.js';
const router = express.Router();

router.get('/:symbol', async (req, res) => {
  try {
    const data = await fetchGeneInfo(req.params.symbol);
    if (!data) return res.status(404).json({ error: 'Gene not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Gene fetch failed' });
  }
});

export default router;
4. 调用 PubChem API 的服务 src/services/geneFetcher.js
js
复制
编辑
import axios from 'axios';

export async function fetchGeneInfo(symbol) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/gene/${symbol}/json`;
  try {
    const { data } = await axios.get(url);
    if (data.InformationList && data.InformationList.Information.length > 0) {
      const gene = data.InformationList.Information[0];
      return {
        name: gene.Name,
        description: gene.Description,
        url: `https://pubchem.ncbi.nlm.nih.gov/gene/${gene.GeneID}`,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching gene info:', error);
    return null;
  }
}
前端实现（React + Vite）
1. 基因信息查询组件 GeneInfo.tsx
tsx
复制
编辑
import React, { useState } from 'react';
import axios from 'axios';

const GeneInfo = () => {
  const [symbol, setSymbol] = useState('');
  const [geneInfo, setGeneInfo] = useState(null);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`/api/gene/${symbol}`);
      setGeneInfo(response.data);
    } catch (error) {
      console.error('Error fetching gene info:', error);
      setGeneInfo(null);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Enter gene symbol"
      />
      <button onClick={handleSearch}>Search</button>
      {geneInfo && (
        <div>
          <h3>{geneInfo.name}</h3>
          <p>{geneInfo.description}</p>
          <a href={geneInfo.url} target="_blank" rel="noopener noreferrer">
            View on PubChem
          </a>
        </div>
      )}
    </div>
  );
};

export default GeneInfo;
2. 路由配置 routes.tsx
tsx
复制
编辑
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import GeneInfo from './pages/GeneInfo';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/gene-info" element={<GeneInfo />} />
  </Routes>
);

export default AppRoutes;
部署与上线
Docker 化部署：使用 Dockerfile 构建前后端镜像，使用 docker-compose.yml 管理服务。

CI/CD 流程：配置 GitHub Actions 实现自动化构建和部署。

域名与 CDN：为前端应用配置域名和 CDN 加速，提高访问速度。

后续扩展建议
用户认证与授权：实现用户登录功能，提供个性化服务。

数据可视化：为基因信息添加图表和可视化组件，提升用户体验。

多语言支持：支持多种语言，扩大用户群体。

如需进一步的技术支持或定制开发，请随时联系我。