# R Shiny AI集成指南

## 快速集成方案

### 1. 在现有Shiny应用中添加AI分析按钮

```r
# 在UI中添加
actionButton("ai_analyze", "🤖 AI分析当前图表", 
             class = "btn-success",
             style = "position: absolute; top: 10px; right: 10px;")

# 在图表输出下方添加分析结果区域
verbatimTextOutput("ai_result")
```

### 2. 服务器端处理

```r
# 在server函数中添加
observeEvent(input$ai_analyze, {
  # 获取当前图表数据
  current_gene <- input$gene_input
  
  # 调用Python脚本进行AI分析
  ai_result <- system2(
    "python3",
    args = c("ai_analyze.py", current_gene),
    stdout = TRUE
  )
  
  output$ai_result <- renderText({
    paste(ai_result, collapse = "\n")
  })
})
```

### 3. Python桥接脚本 (ai_analyze.py)

```python
import sys
import requests
import json

def analyze_gist_data(gene_name):
    """调用AI API分析GIST基因数据"""
    
    api_url = "http://localhost:8000/api/chat"
    
    prompt = f"""
    请分析GIST相关基因{gene_name}的表达数据：
    1. 该基因在GIST中的作用
    2. 表达水平的临床意义
    3. 潜在的治疗靶点价值
    """
    
    response = requests.post(api_url, json={
        "message": prompt,
        "stream": False
    })
    
    if response.status_code == 200:
        return response.json()['reply']
    else:
        return "分析失败"

if __name__ == "__main__":
    gene = sys.argv[1] if len(sys.argv) > 1 else "KIT"
    result = analyze_gist_data(gene)
    print(result)
```

## 高级集成：实时分析

### 使用WebSocket实现实时通信

```r
library(shiny)
library(websocket)

# 创建WebSocket连接到AI服务
ws <- WebSocket$new("ws://localhost:8000/ws")

ws$onMessage(function(event) {
  # 接收AI分析结果
  result <- jsonlite::fromJSON(event$data)
  updateTextAreaInput(session, "ai_feedback", value = result$analysis)
})

# 当生成新图表时自动发送分析请求
observe({
  plot_data <- reactive_plot_data()
  if (!is.null(plot_data)) {
    ws$send(jsonlite::toJSON(list(
      action = "analyze",
      gene = input$gene,
      data = plot_data
    )))
  }
})
```

## 最佳实践

### 1. 缓存机制
```r
# 使用memoise包缓存AI分析结果
library(memoise)

cached_ai_analyze <- memoise(function(gene, data_hash) {
  # AI分析逻辑
})
```

### 2. 异步处理
```r
library(future)
library(promises)

future_promise({
  # 耗时的AI分析
  analyze_gist_data(gene)
}) %...>% 
  function(result) {
    # 更新UI
    output$ai_result <- renderText(result)
  }
```

### 3. 批量分析
```r
# 分析多个基因
batch_analyze <- function(gene_list) {
  results <- lapply(gene_list, function(gene) {
    list(
      gene = gene,
      analysis = analyze_gist_data(gene)
    )
  })
  return(results)
}
```

## 部署建议

1. **环境变量配置**
```bash
# .Renviron
ARK_API_KEY=your_api_key_here
AI_SERVICE_URL=http://localhost:8000
```

2. **Docker部署**
```dockerfile
FROM rocker/shiny:latest
RUN R -e "install.packages(c('httr', 'jsonlite', 'future', 'promises'))"
COPY . /srv/shiny-server/
CMD ["/usr/bin/shiny-server"]
```

3. **性能优化**
- 使用Redis缓存频繁请求的分析结果
- 实现请求队列避免API限流
- 添加加载动画改善用户体验

## 示例效果

用户点击"Visualize"后：
1. 生成图表
2. 自动触发AI分析
3. 在图表旁边显示分析结果
4. 支持导出分析报告

这种集成方式让GIST数据库真正变成了一个智能分析平台！