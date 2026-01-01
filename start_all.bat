@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: GIST Web Platform - Windows 一键启动脚本

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           GIST Web Platform - 一键启动                       ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Python Agent   -^>  http://localhost:5001                    ║
echo ║  Node Backend   -^>  http://localhost:8000                    ║
echo ║  React Frontend -^>  http://localhost:5173                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "LOG_DIR=%SCRIPT_DIR%logs"

:: 创建日志目录
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: [1/3] 启动 Python GLM Agent
echo [1/3] 启动 Python GLM Agent...

:: 检查并停止占用端口 5001 的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001.*LISTENING"') do (
    echo   停止占用端口 5001 的进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

cd /d "%PROJECT_ROOT%\glm_agent_test"

:: 启动 Agent (新窗口)
start "GLM Agent" /min cmd /c "python glm_r_agent_v2.py > "%LOG_DIR%\agent.log" 2>&1"
timeout /t 2 /nobreak >nul
echo   √ Python Agent 已启动

:: [2/3] 启动 Node.js Backend
echo [2/3] 启动 Node.js Backend...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
    echo   停止占用端口 8000 的进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

cd /d "%SCRIPT_DIR%backend"

:: 检查依赖
if not exist "node_modules" (
    echo   安装后端依赖...
    call npm install --silent
)

start "Node Backend" /min cmd /c "npm run dev > "%LOG_DIR%\backend.log" 2>&1"
timeout /t 3 /nobreak >nul
echo   √ Node.js Backend 已启动

:: [3/3] 启动 React Frontend
echo [3/3] 启动 React Frontend...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    echo   停止占用端口 5173 的进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

cd /d "%SCRIPT_DIR%frontend"

if not exist "node_modules" (
    echo   安装前端依赖...
    call npm install --silent
)

start "React Frontend" /min cmd /c "npm run dev > "%LOG_DIR%\frontend.log" 2>&1"
timeout /t 3 /nobreak >nul
echo   √ React Frontend 已启动

:: 显示状态
echo.
echo ════════════════════════════════════════════════════════════════
echo   所有服务已启动！
echo ════════════════════════════════════════════════════════════════
echo.
echo   前端界面:    http://localhost:5173
echo   后端 API:    http://localhost:8000
echo   Agent API:   http://localhost:5001
echo.
echo   日志目录:    %LOG_DIR%
echo   停止服务:    运行 stop_all.bat
echo.
echo ════════════════════════════════════════════════════════════════

:: 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:5173

pause
