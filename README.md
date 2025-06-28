# dbGIST Shiny 应用 - GIST基因表达分析平台

一个专注于胃肠道间质瘤（GIST）的基因表达分析平台，基于R Shiny构建，集成AI智能分析功能。

## 🧬 应用概述

这是一个**dbGIST (database GIST)** Shiny web应用，专门用于分析胃肠道间质瘤（GIST）的基因表达数据，提供交互式可视化和统计分析功能，支持GIST基因组研究。

## ✨ 主要功能

### 📊 分析模块
1. **Module2 - 单基因表达分析**：查看特定基因在不同临床分组中的表达差异（性别、年龄、风险等级等）
2. **Module3 - 基因相关性分析**：分析两个基因之间的表达相关性，生成散点图和相关系数
3. **Module4 - 药物耐药分析**：探索与伊马替尼（Imatinib）耐药相关的基因，包含ROC曲线分析
4. **Module5 - 治疗前后比较**：比较治疗前后的基因表达变化，评估治疗效果

### 🤖 AI功能
- **智能图表分析**：AI自动分析当前模块生成的图表，提供统计学和生物学解读
- **多位置AI按钮**：顶部、左下角、聊天窗口内多个AI分析入口
- **活跃模块跟踪**：准确识别用户当前操作的模块，避免分析错误的图表

## 🛠 系统要求

- **R** (建议版本 4.0 或更高)
- **RStudio** (可选，但推荐)
- **足够的内存** (建议8GB+，用于加载大型基因表达数据集)

## 🚀 快速开始

### 1. 安装依赖包

在 R 控制台中运行以下命令安装所有依赖：

```r
# 安装基础包
install.packages(c("shiny", "bs4Dash", "shinyjs", "shinyBS", "tidyverse", 
                   "data.table", "stringr", "ggplot2", "ggsci", "patchwork", "pROC"))

# 安装Bioconductor包
if (!require("BiocManager", quietly = TRUE))
    install.packages("BiocManager")
BiocManager::install(c("clusterProfiler", "org.Hs.eg.db", "EnsDb.Hsapiens.v75"))

# 安装AI功能相关包
install.packages(c("httr", "jsonlite", "base64enc"))
```

### 2. 运行应用

#### 完整项目启动（推荐）

启动包含 R Shiny 数据分析功能的完整应用：

```bash
# Linux/Mac
./start_with_shiny.sh

# Windows
start_with_shiny.bat

# 或使用 npm
npm run dev:full
```

应用将在以下端口运行：
- 前端界面: http://localhost:5173
- 后端API: http://localhost:8000
- Shiny数据库: http://localhost:4964
```bash
# Linux/Mac
npm run dev:full
# 或
./start_with_shiny.sh

# Windows
npm run dev:full:windows
# 或
start_with_shiny.bat
```

这将同时启动：
- GIST_web 前端 (http://localhost:5173)
- GIST_web 后端 (http://localhost:3000)
- GIST_shiny 数据库 (http://127.0.0.1:4964)

#### 单独运行 Shiny 应用
```r
# 方法1：在 R 控制台中
shiny::runApp(port = 4964)

# 方法2：使用提供的脚本
cd ../GIST_shiny
./start_shiny.sh  # Linux/Mac
# 或
start_shiny.bat   # Windows
```

## 📁 数据文件

应用需要以下数据文件（放置在 `original/` 目录）：
- **dbGIST_matrix(2).Rdata**: 主要基因表达矩阵和临床数据
- **dbGIST_ImmuneCell.RData**: 免疫细胞浸润数据
- **dbGIST_msigdb.RData**: MSigDB通路数据库
- **dbGIST_wikipathways.RData**: WikiPathways通路数据库
- **GSE15966_20230217.CSV**: 特定GEO数据集的临床数据

## 🎯 使用指南

### 基本操作流程
1. **选择模块**：点击左侧菜单选择分析模块（Module2-5）
2. **输入基因**：输入标准基因符号（如 TP53, MCM7, EGFR 等）
3. **生成图表**：点击"更新"按钮生成可视化图表
4. **AI分析**：点击AI分析按钮获得智能解读

### AI功能使用
- **🚀 AI分析当前图表**：分析当前显示的图表
- **💬 AI助手**：打开聊天窗口进行文字对话
- **📁 上传图片**：在聊天窗口上传图片进行分析

## 🔧 最新修复

### ✅ 已解决的问题
- **AI模块选择错误**：修复了AI总是分析Module5图表的问题
- **活跃模块跟踪**：新增当前活跃模块跟踪功能
- **多位置AI按钮**：在多个位置添加AI分析按钮

### 🎯 修复机制
- 系统跟踪用户在每个模块中的最后更新操作
- AI分析优先使用当前活跃模块的图表
- 增强调试输出，便于问题追踪

## 📊 临床数据分类

应用支持以下临床参数的基因表达分析：
- **患者特征**：年龄、性别、风险等级
- **肿瘤特征**：位置、大小、分期、分级
- **分子特征**：突变类型、染色体位置
- **治疗相关**：伊马替尼耐药性、治疗前后状态
- **转移状态**：原发/转移、转移部位

## 🔍 故障排除

### 应用无法启动
1. 确保所有依赖包都已安装
2. 检查数据文件是否存在于 `original/` 目录
3. 查看 R 控制台的错误信息

### AI功能异常
1. 检查网络连接
2. 验证API密钥配置
3. 查看控制台日志输出

### 内存问题
- 关闭其他应用释放内存
- 考虑使用更高配置的服务器

## 🏗 技术架构

### 核心组件
- **global.R**: 加载依赖、数据和分析函数
- **ui.R**: 使用bs4Dash框架定义仪表板布局
- **server.R**: 处理响应式逻辑、用户交互和图表生成
- **ai_chat_module.R**: AI聊天和图表分析功能

### 关键功能
- **响应式编程**：动态更新和交互
- **ggplot2可视化**：一致的主题和样式
- **统计分析**：t检验、相关性分析、ROC曲线
- **数据结构**：矩阵列表和关联临床信息

## 📈 开发计划

- [x] AI模块选择修复
- [x] 多位置AI分析按钮
- [x] 活跃模块跟踪
- [ ] 批量基因分析
- [ ] 数据可视化增强
- [ ] 用户会话管理
- [ ] 更多统计方法集成

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📧 技术支持

- **Bug报告**: [GitHub Issues](https://github.com/youngfly93/GIST_web/issues)
- **功能建议**: [GitHub Discussions](https://github.com/youngfly93/GIST_web/discussions)
- **文档**: 查看 `CLAUDE.md` 了解更多技术细节

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
