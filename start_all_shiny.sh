#!/bin/bash

echo "🚀 启动所有GIST Shiny应用..."

# 创建日志目录
mkdir -p logs/shiny

# 清理可能占用的端口进程，避免端口冲突
echo "🔄 清理旧进程和端口占用..."
PORTS=(4964 4966 4967 4968 4971 4972)

for port in "${PORTS[@]}"; do
    echo "  检查端口 $port..."
    
    # 方法1: 使用lsof杀死占用端口的进程
    if lsof -ti :$port >/dev/null 2>&1; then
        echo "    发现端口 $port 被占用，正在清理..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
    fi
    
    # 方法2: 使用fuser清理端口
    fuser -k ${port}/tcp 2>/dev/null || true
done

# 额外清理相关R进程
echo "  清理相关R进程..."
pkill -f "shiny.*496[4-8]" 2>/dev/null || true
pkill -f "shiny.*497[1-2]" 2>/dev/null || true
pkill -f "GIST_shiny" 2>/dev/null || true
pkill -f "GIST_Protemics" 2>/dev/null || true
pkill -f "GIST_Phosphoproteomics" 2>/dev/null || true

echo "  等待进程完全退出..."
sleep 3

echo "✅ 端口清理完成，开始启动应用..."

# 检查目录是否存在
TRANSCRIPTOMICS_DIR="/home/ylab/GIST_shiny"
PROTEOMICS_DIR="/home/ylab/GIST_Protemics"
PHOSPHO_DIR="/home/ylab/GIST_Phosphoproteomics"

# 启动转录组学应用
if [ -d "$TRANSCRIPTOMICS_DIR" ]; then
    echo "📊 启动转录组学应用..."
    
    # AI版本 - 端口4964
    if [ -f "$TRANSCRIPTOMICS_DIR/start_ai.R" ]; then
        echo "  启动转录组学 AI版 (端口4964)..."
        cd "$TRANSCRIPTOMICS_DIR"
        nohup Rscript start_ai.R > /home/ylab/GIST_web_all/logs/shiny/transcriptomics_ai.log 2>&1 &
        echo "  转录组学 AI版已启动，日志: logs/shiny/transcriptomics_ai.log"
    elif [ -f "$TRANSCRIPTOMICS_DIR/ui.R" ] && [ -f "$TRANSCRIPTOMICS_DIR/server.R" ]; then
        echo "  使用标准Shiny文件启动转录组学 AI版 (端口4964)..."
        cd "$TRANSCRIPTOMICS_DIR"
        nohup Rscript -e "
        options(shiny.port = 4964, shiny.host = '0.0.0.0')
        shiny::runApp()
        " > /home/ylab/GIST_web_all/logs/shiny/transcriptomics_ai.log 2>&1 &
        echo "  转录组学 AI版已启动，日志: logs/shiny/transcriptomics_ai.log"
    else
        echo "  ❌ 未找到转录组学 AI版启动文件"
    fi
    
    # 基础版本 - 端口4966
    if [ -f "$TRANSCRIPTOMICS_DIR/start_no_ai.R" ]; then
        echo "  启动转录组学 基础版 (端口4966)..."
        cd "$TRANSCRIPTOMICS_DIR"
        # 修改start_no_ai.R中的端口设置
        nohup Rscript -e "
        options(shiny.port = 4966, shiny.host = '0.0.0.0')
        source('start_no_ai.R')
        " > /home/ylab/GIST_web_all/logs/shiny/transcriptomics_basic.log 2>&1 &
        echo "  转录组学 基础版已启动，日志: logs/shiny/transcriptomics_basic.log"
    elif [ -f "$TRANSCRIPTOMICS_DIR/ui.R" ] && [ -f "$TRANSCRIPTOMICS_DIR/server.R" ]; then
        echo "  使用标准Shiny文件启动转录组学 基础版 (端口4966)..."
        cd "$TRANSCRIPTOMICS_DIR"
        nohup Rscript -e "
        options(shiny.port = 4966, shiny.host = '0.0.0.0')
        shiny::runApp()
        " > /home/ylab/GIST_web_all/logs/shiny/transcriptomics_basic.log 2>&1 &
        echo "  转录组学 基础版已启动，日志: logs/shiny/transcriptomics_basic.log"
    else
        echo "  ❌ 未找到转录组学 基础版启动文件"
    fi
else
    echo "❌ 转录组学目录不存在: $TRANSCRIPTOMICS_DIR"
fi

# 启动蛋白质组学应用
if [ -d "$PROTEOMICS_DIR" ]; then
    echo "🧬 启动蛋白质组学应用..."
    
    # AI版本 - 端口4968 (已运行，检查是否需要重启)
    echo "  检查蛋白质组学 AI版 (端口4968)..."
    if ! lsof -i :4968 > /dev/null 2>&1; then
        echo "  启动蛋白质组学 AI版 (端口4968)..."
        cd "$PROTEOMICS_DIR"
        nohup Rscript -e "
        options(shiny.port = 4968, shiny.host = '0.0.0.0')
        if(file.exists('app_ai.R')) {
            shiny::runApp('app_ai.R')
        } else {
            shiny::runApp('app.R')
        }
        " > /home/ylab/GIST_web_all/logs/shiny/proteomics_ai.log 2>&1 &
        echo "  蛋白质组学 AI版已启动，日志: logs/shiny/proteomics_ai.log"
    else
        echo "  蛋白质组学 AI版已在运行"
    fi
    
    # 基础版本 - 端口4967
    if [ -f "$PROTEOMICS_DIR/app_basic.R" ] || [ -f "$PROTEOMICS_DIR/app.R" ]; then
        echo "  启动蛋白质组学 基础版 (端口4967)..."
        cd "$PROTEOMICS_DIR"
        nohup Rscript -e "
        options(shiny.port = 4967, shiny.host = '0.0.0.0')
        if(file.exists('app_basic.R')) {
            shiny::runApp('app_basic.R')
        } else {
            shiny::runApp('app.R')
        }
        " > /home/ylab/GIST_web_all/logs/shiny/proteomics_basic.log 2>&1 &
        echo "  蛋白质组学 基础版已启动，日志: logs/shiny/proteomics_basic.log"
    fi
else
    echo "❌ 蛋白质组学目录不存在: $PROTEOMICS_DIR"
fi

# 启动磷酸化蛋白质组学应用 (翻译后修饰)
if [ -d "$PHOSPHO_DIR" ]; then
    echo "⚡ 启动翻译后修饰应用..."
    
    # AI版本 - 端口4972
    if [ -f "$PHOSPHO_DIR/start_ai.R" ]; then
        echo "  启动翻译后修饰 AI版 (端口4972)..."
        cd "$PHOSPHO_DIR"
        nohup Rscript start_ai.R > /home/ylab/GIST_web_all/logs/shiny/phospho_ai.log 2>&1 &
        echo "  翻译后修饰 AI版已启动，日志: logs/shiny/phospho_ai.log"
    elif [ -f "$PHOSPHO_DIR/app.R" ]; then
        echo "  使用通用文件启动翻译后修饰 AI版 (端口4972)..."
        cd "$PHOSPHO_DIR"
        nohup Rscript -e "
        options(shiny.port = 4972, shiny.host = '0.0.0.0')
        shiny::runApp('app.R')
        " > /home/ylab/GIST_web_all/logs/shiny/phospho_ai.log 2>&1 &
        echo "  翻译后修饰 AI版已启动，日志: logs/shiny/phospho_ai.log"
    else
        echo "  ❌ 未找到翻译后修饰 AI版启动文件"
    fi
    
    # 基础版本 - 端口4971
    if [ -f "$PHOSPHO_DIR/start_no_ai.R" ]; then
        echo "  启动翻译后修饰 基础版 (端口4971)..."
        cd "$PHOSPHO_DIR"
        nohup Rscript start_no_ai.R > /home/ylab/GIST_web_all/logs/shiny/phospho_basic.log 2>&1 &
        echo "  翻译后修饰 基础版已启动，日志: logs/shiny/phospho_basic.log"
    elif [ -f "$PHOSPHO_DIR/app.R" ]; then
        echo "  使用通用文件启动翻译后修饰 基础版 (端口4971)..."
        cd "$PHOSPHO_DIR"
        nohup Rscript -e "
        options(shiny.port = 4971, shiny.host = '0.0.0.0')
        Sys.setenv(ENABLE_AI_ANALYSIS = 'false')
        shiny::runApp('app.R')
        " > /home/ylab/GIST_web_all/logs/shiny/phospho_basic.log 2>&1 &
        echo "  翻译后修饰 基础版已启动，日志: logs/shiny/phospho_basic.log"
    else
        echo "  ❌ 未找到翻译后修饰 基础版启动文件"
    fi
else
    echo "❌ 翻译后修饰目录不存在: $PHOSPHO_DIR"
fi

echo ""
echo "⏳ 等待5秒钟让应用启动..."
sleep 5

echo ""
echo "📊 检查所有Shiny应用状态:"
echo "=== 端口监听状态 ==="
listening_ports=$(ss -tlnp | grep -E ":(4964|4966|4967|4968|4971|4972)")
if [ -n "$listening_ports" ]; then
    echo "$listening_ports"
else
    echo "❌ 没有找到监听的端口"
fi

echo ""
echo "=== 进程状态 ==="
running_processes=$(ps aux | grep -E "R.*496[4-8]|R.*497[1-2]" | grep -v grep)
if [ -n "$running_processes" ]; then
    echo "$running_processes"
else
    echo "❌ 没有找到R进程"
fi

echo ""
echo "=== 应用状态检查 ==="
EXPECTED_PORTS=(4964 4966 4967 4968 4971 4972)
EXPECTED_NAMES=("转录组学AI" "转录组学基础" "蛋白质组学基础" "蛋白质组学AI" "翻译后修饰基础" "翻译后修饰AI")

for i in "${!EXPECTED_PORTS[@]}"; do
    port=${EXPECTED_PORTS[$i]}
    name=${EXPECTED_NAMES[$i]}
    
    if ss -tln | grep -q ":$port "; then
        echo "✅ $name (端口$port): 运行正常"
    else
        echo "❌ $name (端口$port): 启动失败"
        echo "   请检查日志: tail -20 logs/shiny/*$port*.log"
    fi
done

echo ""
echo "🎉 Shiny应用启动脚本执行完成!"
echo ""
echo "📍 访问地址:"
echo "   转录组学 AI: http://117.72.75.45:4964 或 http://chatgist.online:81/transcriptomics/"
echo "   转录组学 基础: http://117.72.75.45:4966 或 http://chatgist.online:81/transcriptomics-basic/"
echo "   蛋白质组学 AI: http://117.72.75.45:4968 或 http://chatgist.online:81/proteomics/"
echo "   蛋白质组学 基础: http://117.72.75.45:4967 或 http://chatgist.online:81/proteomics-basic/"
echo "   翻译后修饰 AI: http://117.72.75.45:4972 或 http://chatgist.online:81/posttranslational/"
echo "   翻译后修饰 基础: http://117.72.75.45:4971 或 http://chatgist.online:81/posttranslational-basic/"
echo ""
echo "📋 日志文件位置: logs/shiny/"
echo "🔧 故障排除: 如果某个应用未启动，请检查对应日志文件"
echo "💡 提示: 可以使用 './check_shiny_status.sh' 随时检查应用状态"

# 脚本正常退出，避免无限循环
echo "✅ 启动脚本已完成，所有应用已在后台运行"
exit 0