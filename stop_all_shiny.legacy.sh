#!/bin/bash

# GIST Shiny应用停止脚本
# 用于优雅地停止所有GIST Shiny应用

echo "🛑 正在停止所有GIST Shiny应用..."
echo ""

# 停止特定的启动脚本
echo "📋 停止启动脚本..."
pkill -f "start_all_shiny.sh" 2>/dev/null || true

# 停止各个模块的R进程
echo "📋 停止转录组学模块..."
pkill -f "start_ai.R" 2>/dev/null || true
pkill -f "start_no_ai.R" 2>/dev/null || true

echo "📋 停止蛋白质组学模块..."
pkill -f "start_app.R" 2>/dev/null || true

echo "📋 停止翻译后修饰模块..."
pkill -f "start_big_data_safe.R" 2>/dev/null || true

# 等待进程优雅退出
echo "⏳ 等待进程优雅退出..."
sleep 3

# 检查剩余的端口占用
echo "🔍 检查剩余的端口占用..."
REMAINING_PORTS=$(netstat -tlnp 2>/dev/null | grep -E ":496[0-9]|:497[0-9]|:499[1-2]" | awk '{print $4 " " $7}')

if [ -n "$REMAINING_PORTS" ]; then
    echo "⚠️  发现仍有端口被占用:"
    echo "$REMAINING_PORTS"
    echo ""
    echo "🔧 强制停止剩余进程..."
    
    # 获取进程ID并强制停止
    PIDS=$(netstat -tlnp 2>/dev/null | grep -E ":496[0-9]|:497[0-9]|:499[1-2]" | awk -F'/' '{print $1}' | awk '{print $7}' | sort -u)
    for pid in $PIDS; do
        if [ "$pid" != "-" ] && [ -n "$pid" ]; then
            echo "  停止进程 $pid"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    sleep 2
fi

# 最终检查
echo "🔍 最终状态检查..."
FINAL_CHECK=$(netstat -tlnp 2>/dev/null | grep -E ":496[0-9]|:497[0-9]|:499[1-2]")

if [ -z "$FINAL_CHECK" ]; then
    echo "✅ 所有GIST Shiny应用已成功停止"
else
    echo "⚠️  仍有端口被占用:"
    echo "$FINAL_CHECK"
    echo ""
    echo "💡 如果需要，请手动检查并停止相关进程"
fi

echo ""
echo "🎯 停止脚本执行完成!"
