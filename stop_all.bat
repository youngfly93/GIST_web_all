@echo off
chcp 65001 >nul

:: GIST Web Platform - 停止所有服务

echo.
echo 停止 GIST Web Platform 所有服务...
echo.

:: 停止端口 5001 (Python Agent)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001.*LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo   √ Python Agent (端口 5001) 已停止
)

:: 停止端口 8000 (Node Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo   √ Node.js Backend (端口 8000) 已停止
)

:: 停止端口 5173 (React Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo   √ React Frontend (端口 5173) 已停止
)

:: 关闭所有相关窗口
taskkill /FI "WINDOWTITLE eq GLM Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Node Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq React Frontend*" /F >nul 2>&1

echo.
echo 所有服务已停止
echo.
pause
