# GIST_web 云服务器部署指南

## 系统要求

- Ubuntu 20.04+ 或 CentOS 7+
- 至少 2GB RAM
- Node.js 18+
- R 4.0+
- Nginx（反向代理）

## 第一步：服务器基础配置

### 1.1 更新系统
```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y
```

### 1.2 安装必要工具
```bash
# Ubuntu
sudo apt install -y git curl wget build-essential

# CentOS
sudo yum install -y git curl wget gcc-c++ make
```

## 第二步：安装 Node.js

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

## 第三步：安装 R 和 Shiny Server

### 3.1 安装 R
```bash
# Ubuntu
sudo apt install -y r-base r-base-dev

# 添加 CRAN 仓库获取最新版本
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
sudo add-apt-repository 'deb https://cloud.r-project.org/bin/linux/ubuntu focal-cran40/'
sudo apt update
sudo apt install -y r-base
```

### 3.2 安装 Shiny Server
```bash
# 安装依赖
sudo apt install -y gdebi-core

# 下载并安装 Shiny Server
wget https://download3.rstudio.org/ubuntu-18.04/x86_64/shiny-server-1.5.21.1012-amd64.deb
sudo gdebi -n shiny-server-1.5.21.1012-amd64.deb

# 启动 Shiny Server
sudo systemctl start shiny-server
sudo systemctl enable shiny-server
```

### 3.3 安装 R 包
```bash
# 进入 R 环境
sudo R

# 在 R 中安装必要的包
install.packages(c("shiny", "bs4Dash", "shinyjs", "shinyBS", 
                   "tidyverse", "data.table", "ggplot2", "ggsci", 
                   "patchwork", "pROC", "stringr"))

# 安装 Bioconductor 包
if (!requireNamespace("BiocManager", quietly = TRUE))
    install.packages("BiocManager")
BiocManager::install(c("clusterProfiler", "org.Hs.eg.db", "EnsDb.Hsapiens.v75"))

# 退出 R
q()
```

## 第四步：部署应用

### 4.1 克隆项目
```bash
cd /opt
sudo git clone https://github.com/youngfly93/GIST_web.git
# GIST_shiny 已包含在 GIST_web 项目中
```

### 4.2 配置 GIST_web
```bash
cd /opt/GIST_web

# 安装依赖
npm run install:all

# 创建生产环境配置
cat > backend/.env.production << EOF
PORT=8000
ARK_API_KEY=你的API密钥
ARK_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
ARK_MODEL_ID=deepseek-v3-250324
EOF

# 构建前端
cd frontend
npm run build
cd ..
```

### 4.3 配置 GIST_shiny
```bash
# 复制 Shiny 应用到 Shiny Server 目录
sudo cp -r /opt/GIST_web/GIST_shiny /srv/shiny-server/gist

# 设置权限
sudo chown -R shiny:shiny /srv/shiny-server/gist
```

### 4.4 配置 Shiny Server
```bash
# 编辑 Shiny Server 配置
sudo nano /etc/shiny-server/shiny-server.conf
```

添加以下内容：
```
# 在 server 块中添加
location /gist {
  app_dir /srv/shiny-server/gist;
  log_dir /var/log/shiny-server/gist;
}
```

重启 Shiny Server：
```bash
sudo systemctl restart shiny-server
```

## 第五步：使用 PM2 管理 Node.js 应用

```bash
# 安装 PM2
sudo npm install -g pm2

# 创建 PM2 配置文件
cd /opt/GIST_web
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'gist-backend',
    script: './backend/src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    env_file: './backend/.env.production'
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 第六步：配置 Nginx

### 6.1 安装 Nginx
```bash
sudo apt install -y nginx
```

### 6.2 创建站点配置
```bash
sudo nano /etc/nginx/sites-available/gist
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    location / {
        root /opt/GIST_web/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Shiny 应用
    location /shiny/ {
        rewrite ^/shiny/(.*)$ /$1 break;
        proxy_pass http://localhost:3838;
        proxy_redirect / $scheme://$http_host/shiny/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 20d;
        proxy_buffering off;
    }
}

# WebSocket 支持
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

### 6.3 启用站点
```bash
sudo ln -s /etc/nginx/sites-available/gist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 第七步：配置防火墙

```bash
# 开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## 第八步：配置 SSL（可选但推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

## 第九步：更新前端配置

修改前端代码中的 Shiny 链接：

```javascript
// frontend/src/pages/Home.tsx
// 将
onClick={() => window.open('http://127.0.0.1:4964/', '_blank')}
// 改为
onClick={() => window.open('/shiny/gist/', '_blank')}
```

重新构建前端：
```bash
cd /opt/GIST_web/frontend
npm run build
```

## 监控和维护

### 查看应用状态
```bash
# PM2 状态
pm2 status
pm2 logs gist-backend

# Shiny Server 日志
sudo tail -f /var/log/shiny-server/gist/*.log

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新应用
```bash
cd /opt/GIST_web
git pull
npm run install:all
cd frontend && npm run build
pm2 restart gist-backend
```

## 安全建议

1. **配置环境变量**：敏感信息使用环境变量
2. **限制端口访问**：只开放必要的端口
3. **定期更新**：保持系统和依赖包最新
4. **备份数据**：定期备份重要数据
5. **监控资源**：使用工具监控服务器资源使用

## 故障排查

### Shiny 应用无法访问
```bash
# 检查 Shiny Server 状态
sudo systemctl status shiny-server

# 查看配置
cat /etc/shiny-server/shiny-server.conf

# 检查应用日志
ls -la /var/log/shiny-server/
```

### API 无法连接
```bash
# 检查 PM2 进程
pm2 list
pm2 logs

# 检查端口占用
sudo netstat -tlnp | grep :8000
```

### Nginx 问题
```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```