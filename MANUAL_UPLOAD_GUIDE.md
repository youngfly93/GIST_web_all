# GIST Web Platform - 手动上传文件指南

## 📋 概述

GIST Web Platform 已成功推送到新的 GitHub 仓库：
**https://github.com/youngfly93/GIST_web_all.git**

由于安全和文件大小限制，以下文件需要您手动上传到服务器或单独管理。

## 🚫 已排除的文件类型

### 1. 敏感数据文件
- ❌ `.env` 文件（包含 API 密钥）
- ❌ `*api_key*` 相关文件
- ❌ `*token*` 相关文件
- ❌ `*secret*` 相关文件

### 2. 大型数据文件
- ❌ `hsa_MTI.csv` (miRNA 靶基因数据)
- ❌ `dataset.csv` (基因数据集)
- ❌ `circRNA_interaction.txt` (circRNA 相互作用数据)
- ❌ `lncRNA_interaction.txt` (lncRNA 相互作用数据)
- ❌ 所有 `.gz` 压缩文件
- ❌ 所有 `.rar` 压缩文件

### 3. Shiny 项目目录
- ❌ `GIST_shiny/` (独立仓库)
- ❌ `GIST_Protemics/` (独立仓库)
- ❌ `GIST_Phosphoproteomics/` (独立仓库)

### 4. R 分析文件
- ❌ `Protemic.R` (蛋白质组学分析核心)
- ❌ `Proteomics_add.R` (蛋白质组学扩展功能)
- ❌ `ai_chat_module.R` (AI 聊天模块)
- ❌ 所有 `test_*.R` 文件

### 5. 系统和临时文件
- ❌ `node_modules/` 目录
- ❌ 所有 `.log` 文件
- ❌ 截图文件夹
- ❌ PDF 截图文件

## 📁 需要手动上传的关键文件

### 🔑 环境配置文件

#### 1. 后端环境配置
**文件路径**: `backend/.env`
```bash
# 火山方舟API配置
PORT=8000
ARK_API_KEY=你的API密钥
ARK_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
ARK_MODEL_ID=deepseek-v3-250324
```

#### 2. 生产环境配置
**文件路径**: `backend/.env.production`
```bash
PORT=8000
NODE_ENV=production
ARK_API_KEY=你的生产环境API密钥
ARK_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
ARK_MODEL_ID=deepseek-v3-250324
```

### 📊 数据文件

#### 1. miRNA 靶基因数据
**文件**: `hsa_MTI.csv`
- **大小**: 约 50MB
- **用途**: miRNA 查询功能
- **获取方式**: 从 miRTarBase 下载
- **URL**: https://mirtarbase.cuhk.edu.cn/

#### 2. 基因数据集
**文件**: `dataset.csv`
- **用途**: Dataset 页面展示
- **内容**: 基因列表和相关信息

#### 3. 非编码RNA数据
**文件**: `circRNA_interaction.txt`, `lncRNA_interaction.txt`
- **用途**: 非编码RNA分析模块
- **获取方式**: 从相应数据库下载

### 🧬 R Shiny 项目

#### 1. GIST_shiny
- **独立仓库**: 需要单独克隆
- **端口**: 4964
- **用途**: 基因数据库查询

#### 2. GIST_Protemics
- **独立仓库**: 需要单独克隆
- **端口**: 4968 (AI版本), 4967 (非AI版本)
- **用途**: 蛋白质组学分析

#### 3. GIST_Phosphoproteomics
- **独立仓库**: 需要单独克隆
- **端口**: 4969 (AI版本), 4970 (非AI版本)
- **用途**: 磷酸化蛋白质组学分析

## 🚀 部署步骤

### 1. 克隆主仓库
```bash
git clone https://github.com/youngfly93/GIST_web_all.git
cd GIST_web_all
```

### 2. 安装依赖
```bash
npm run install:all
```

### 3. 创建环境配置文件
```bash
# 创建后端环境配置
cp backend/.env.example backend/.env
# 编辑并添加你的API密钥
nano backend/.env
```

### 4. 上传数据文件
- 将 `hsa_MTI.csv` 上传到项目根目录
- 将 `dataset.csv` 上传到项目根目录
- 将非编码RNA数据文件上传到项目根目录

### 5. 部署Shiny项目
- 单独克隆和部署各个GIST Shiny项目
- 确保端口配置正确

### 6. 启动服务
```bash
# 启动主Web应用
npm run dev

# 或使用生产模式
npm run build
npm start
```

## ⚠️ 安全注意事项

1. **API密钥安全**
   - 绝不要将API密钥提交到Git仓库
   - 使用环境变量管理敏感信息
   - 定期轮换API密钥

2. **数据文件管理**
   - 大型数据文件建议使用CDN或对象存储
   - 定期备份重要数据文件

3. **访问控制**
   - 配置适当的服务器访问权限
   - 使用HTTPS加密传输

## 📞 技术支持

如果在部署过程中遇到问题，请检查：
1. Node.js 版本 (推荐 18+)
2. R 版本 (推荐 4.0+)
3. 网络连接和防火墙设置
4. API密钥的有效性

---

**仓库地址**: https://github.com/youngfly93/GIST_web_all.git
**最后更新**: 2025-06-28
