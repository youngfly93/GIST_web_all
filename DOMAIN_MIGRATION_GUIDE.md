# DBGist 域名迁移指南

## 📋 迁移概述

将 GIST Web 项目从 `http://chatgist.online:81/` 迁移到 `www.dbgist.com`

**当前状态：**
- 旧域名: http://chatgist.online:81/
- 新域名: www.dbgist.com (京东云)
- 服务器IP: 运行脚本时自动检测

---

## 🚀 快速迁移步骤

### 第一步：配置京东云 DNS 解析

登录京东云控制台 → 进入域名管理 → DNS 解析设置

添加以下两条 A 记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|-------|-----|
| A | www | 您的服务器IP | 600 |
| A | @ | 您的服务器IP | 600 |

**获取服务器IP:**
```bash
curl ifconfig.me
```

**验证DNS解析：**
```bash
ping www.dbgist.com
ping dbgist.com
```

等待 5-10 分钟让 DNS 解析生效。

---

### 第二步：配置 HTTP 访问（80端口）

```bash
cd /home/ylab/GIST_web_all
bash setup_dbgist_domain.sh
```

脚本会自动：
1. ✅ 复制 nginx 配置文件
2. ✅ 启用新域名配置
3. ✅ 备份81端口配置
4. ✅ 测试并重载 nginx
5. ✅ 验证服务状态

完成后访问：
- http://www.dbgist.com
- http://dbgist.com

---

### 第三步（可选）：配置 HTTPS 访问

**前提条件：**
- DNS 解析已生效（步骤一完成并等待5-10分钟）
- 80端口配置正常（步骤二完成）

```bash
cd /home/ylab/GIST_web_all
bash setup_dbgist_ssl.sh
```

脚本会自动：
1. ✅ 检查 DNS 解析状态
2. ✅ 安装 certbot（如未安装）
3. ✅ 申请 Let's Encrypt 免费 SSL 证书
4. ✅ 配置 HTTPS
5. ✅ 设置证书自动续期
6. ✅ 配置 HTTP → HTTPS 自动跳转

完成后访问：
- https://www.dbgist.com ✨
- https://dbgist.com ✨

**证书信息：**
- 提供商: Let's Encrypt
- 有效期: 90天
- 自动续期: 已配置（每月1号凌晨3点检查）

---

## 📂 配置文件说明

### 1. `dbgist.conf`
- HTTP 访问配置（80端口）
- 用于初始配置或不需要 HTTPS 的场景

### 2. `dbgist_https.conf`
- HTTPS 访问配置（443端口）
- 包含 SSL 证书配置
- HTTP 自动跳转到 HTTPS

### 3. `setup_dbgist_domain.sh`
- 域名基础配置脚本
- 配置 HTTP 访问

### 4. `setup_dbgist_ssl.sh`
- SSL 证书申请和配置脚本
- 完整的 HTTPS 配置

---

## 🔧 服务依赖检查

确保以下服务正在运行：

```bash
# 检查前端服务（Vite）
curl http://127.0.0.1:5174

# 检查后端API
curl http://127.0.0.1:8000/health

# 检查 Shiny 应用
curl http://127.0.0.1:4964  # 转录组学
curl http://127.0.0.1:4968  # 蛋白质组学
curl http://127.0.0.1:4971  # 翻译后修饰-基础
curl http://127.0.0.1:4972  # 翻译后修饰
curl http://127.0.0.1:4974  # 单细胞

# 检查 nginx
sudo systemctl status nginx
```

---

## 🌐 服务端口映射

| 服务 | 本地端口 | 外部访问路径 |
|-----|---------|-------------|
| 前端 | 5174 | / |
| 后端API | 8000 | /api/ |
| 转录组学 | 4964 | /transcriptomics/ |
| 转录组学-基础 | 4964 | /transcriptomics-basic/ |
| 蛋白质组学 | 4968 | /proteomics/ |
| 蛋白质组学-基础 | 4968 | /proteomics-basic/ |
| 翻译后修饰 | 4972 | /posttranslational/ |
| 翻译后修饰-基础 | 4971 | /posttranslational-basic/ |
| 单细胞 | 4974 | /singlecell/ |
| 单细胞-基础 | 4974 | /singlecell-basic/ |

---

## 🔄 回滚到原配置

如果需要恢复到81端口访问：

```bash
# 恢复81端口配置
sudo ln -sf /etc/nginx/sites-available/chatgist-port81.backup /etc/nginx/sites-enabled/chatgist-port81

# 禁用新域名配置
sudo rm /etc/nginx/sites-enabled/dbgist

# 重载 nginx
sudo systemctl reload nginx
```

---

## 🐛 故障排查

### 问题1：DNS 解析不生效
```bash
# 检查DNS解析
dig www.dbgist.com
dig dbgist.com

# 清除本地DNS缓存
sudo systemd-resolve --flush-caches

# 使用公共DNS测试
nslookup www.dbgist.com 8.8.8.8
```

### 问题2：nginx 配置错误
```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重启 nginx
sudo systemctl restart nginx
```

### 问题3：SSL 证书申请失败
```bash
# 查看 Let's Encrypt 日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# 检查80端口是否被占用
sudo ss -tlnp | grep :80

# 手动测试证书申请
sudo certbot certonly --standalone -d dbgist.com -d www.dbgist.com --dry-run
```

### 问题4：服务无法访问
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 检查端口监听
sudo ss -tlnp | grep -E ":(80|443|5174|8000)"

# 检查 nginx 代理
curl -I http://localhost:5174
curl -I http://localhost:8000
```

### 问题5：HTTPS 访问显示不安全
```bash
# 检查证书有效期
sudo certbot certificates

# 手动更新证书
sudo certbot renew

# 重启 nginx
sudo systemctl restart nginx
```

---

## 📝 域名配置清单

- [ ] 京东云 DNS A 记录配置完成
- [ ] DNS 解析验证通过
- [ ] 所有服务正常运行
- [ ] HTTP 访问配置完成
- [ ] HTTP 访问测试通过
- [ ] SSL 证书申请成功（可选）
- [ ] HTTPS 访问配置完成（可选）
- [ ] HTTPS 访问测试通过（可选）
- [ ] 证书自动续期已配置（可选）

---

## 📞 技术支持

如遇问题，请检查：
1. 京东云控制台的 DNS 配置
2. 服务器防火墙设置
3. Nginx 错误日志：`/var/log/nginx/error.log`
4. 系统日志：`journalctl -xe`

---

## 🎯 迁移后的优势

✅ 标准80/443端口，无需指定端口号  
✅ 更专业的域名展示  
✅ 支持 HTTPS 加密传输  
✅ SSL 证书自动续期  
✅ 更好的 SEO 和用户体验  
✅ 保留原配置，可随时回滚  

---

**最后更新：** 2025-10-10




