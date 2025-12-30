# 🚀 GIST Shiny应用管理指南

## 📋 应用端口分配

| 模块 | AI版端口 | 基础版端口 | 对应目录 |
|------|----------|-----------|----------|
| **Transcriptomics** | 4964 | 4966 | `/home/ylab/GIST_Transcriptome/` |
| **Proteomics** | 4968 | 4967 | `/home/ylab/GIST_Protemics/` |
| **Post-translational** | 4972 | 4971 | `/home/ylab/GIST_Phosphoproteomics/` |

## 🛠 管理脚本说明

### 1. 启动所有应用
```bash
# 智能启动所有Shiny应用（推荐）
sudo ./start_all_shiny.sh

# 快速启动缺失的应用
sudo ./quick_start_shiny.sh
```

### 2. 检查应用状态
```bash
# 查看所有应用运行状态
./check_shiny_status.sh
```

### 3. 停止应用
```bash
# 停止所有Shiny应用
./stop_shiny.sh

# 停止特定端口的应用
./stop_shiny.sh 4964
```

## 📊 使用步骤

### 步骤1: 给脚本添加执行权限
```bash
chmod +x *.sh
```

### 步骤2: 启动应用
```bash
# 推荐使用完整版启动脚本
sudo ./start_all_shiny.sh
```

### 步骤3: 检查状态
```bash
./check_shiny_status.sh
```

## 🔍 故障排除

### 如果某个应用无法启动：

1. **检查目录是否存在**
   ```bash
   ls -la /home/ylab/GIST_*
   ```

2. **检查R和Shiny是否安装**
   ```bash
   R --version
   Rscript -e "library(shiny)"
   ```

3. **查看日志文件**
   ```bash
   tail -f logs/shiny/*.log
   ```

4. **检查端口是否被占用**
   ```bash
   lsof -i :4964
   ```

### 重启单个应用：
```bash
# 停止特定应用
./stop_shiny.sh 4964

# 手动启动
cd /home/ylab/GIST_Transcriptome
nohup Rscript -e "options(shiny.port=4964, shiny.host='0.0.0.0'); shiny::runApp()" > ../GIST_web_all/logs/shiny/trans_ai.log 2>&1 &
```

## 📁 文件结构

```
GIST_web_all/
├── start_all_shiny.sh      # 完整启动脚本
├── quick_start_shiny.sh    # 快速启动脚本
├── check_shiny_status.sh   # 状态检查脚本
├── stop_shiny.sh           # 停止脚本
└── logs/shiny/             # 日志目录
    ├── transcriptomics_ai.log
    ├── transcriptomics_basic.log
    ├── proteomics_ai.log
    ├── proteomics_basic.log
    ├── phospho_ai.log
    └── phospho_basic.log
```

## 🌐 访问地址

启动成功后，可通过以下地址访问：

- **转录组学 AI**: http://localhost:4964
- **转录组学 基础**: http://localhost:4966
- **蛋白质组学 AI**: http://localhost:4968
- **蛋白质组学 基础**: http://localhost:4967
- **翻译后修饰 AI**: http://localhost:4972
- **翻译后修饰 基础**: http://localhost:4971

## 🎯 通过nginx代理访问

配置81端口后，也可通过域名访问：

- **转录组学**: http://chatgist.online:81/transcriptomics/
- **蛋白质组学**: http://chatgist.online:81/proteomics/
- **翻译后修饰**: http://chatgist.online:81/posttranslational/

## ⚡ 自动启动设置

如需开机自启动，可将启动脚本添加到系统服务或crontab：

```bash
# 添加到crontab
crontab -e
# 添加行: @reboot /home/ylab/GIST_web_all/start_all_shiny.sh
```

---

**🎉 现在您可以使用这些脚本轻松管理所有GIST Shiny应用了！** 