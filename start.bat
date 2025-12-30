@echo off
echo 🚀 启动 GIST AI 项目...

REM 检查是否已安装依赖
if not exist "node_modules" (
    goto install
)
if not exist "backend\node_modules" (
    goto install
)
if not exist "frontend\node_modules" (
    goto install
)
goto start

:install
echo 📦 安装依赖...
call npm run install:all

:start
echo ✨ 启动前后端服务...
call npm run dev