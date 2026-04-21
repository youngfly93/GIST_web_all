## 指南概览
目标：把任意 Shiny 应用的 UI 风格快速对齐为 GIST_Protemics 的样式与页面结构（含 Home 页、标题/说明/按钮版式、统一配色等）。本文是可复用的操作手册，适用于你在不同项目中“迁移 UI 风格”的需要。前提是你会在目标项目根目录下软链接 GIST_Protemics 目录。

适用场景：
- 现有项目仍用 bs4Dash 或 shinydashboard，想沿用 GIST_Protemics 的颜色、排版、按钮风格。
- 希望统一的“Home页 + 模块页 标题/说明/按钮”结构与 CSS 变量系统。

约定：
- 目标项目根目录为 <project_root>
- 你会在 <project_root> 下创建软链 GIST_Protemics -> 指向你的 GIST_Protemics 工程
- 目标项目内有 shiny_rebuild/ 或 app.R/ui.R 作为入口（下文两种结构均给出操作思路）

——

## 1. 准备与软链
- 在目标项目根目录内创建软链：
  - Linux/Mac: ln -s /path/to/GIST_Protemics GIST_Protemics
  - Windows（Git Bash）: ln -s //d/path/GIST_Protemics GIST_Protemics
- 校验：
  - <project_root>/GIST_Protemics/www/custom.css 存在
  - 可选：<project_root>/www 也存在（作为回退资源）

——

## 2. 在 app.R/ui.R 中优先加载 Protemics 样式资源
- 思路：通过 addResourcePath 注册别名 protwww 指向 GIST_Protemics/www；如果存在本地 www 也注册 extwww 作为回退；最后在 <head> 里用 link 标签引入 CSS。
- 示例代码（放在 ui 定义之前执行一次）：
````r mode=EXCERPT
# Register static paths
prot_www_dir <- file.path("..","GIST_Protemics","www")
has_protwww <- dir.exists(prot_www_dir)
if (has_protwww) shiny::addResourcePath("protwww", normalizePath(prot_www_dir, FALSE))
has_extwww <- dir.exists(file.path("..","www"))

css_href    <- if (has_protwww) "protwww/custom.css" else if (has_extwww) "extwww/custom.css" else "custom.css"
ai_css_href <- if (has_protwww) "protwww/ai_chat_buttons.css" else if (has_extwww) "extwww/ai_chat_buttons.css" else "ai_chat_buttons.css"

# In body/head:
tags$head(
  tags$link(rel = "stylesheet", type = "text/css", href = css_href),
  if (isTRUE(enable_ai)) tags$link(rel = "stylesheet", type = "text/css", href = ai_css_href)
)
````
- 说明：
  - protwww/custom.css 是主风格来源；不存在时回退 extwww/custom.css 或项目自带 custom.css。
  - 如果你没有 AI 模块，可移除 ai_css_href 相关行。

——

## 3. 统一顶栏右上角“版本指示器”（可选）
- bs4Dash Navbar 要求 rightUi 的根节点为 li.dropdown。
````r mode=EXCERPT
header = bs4DashNavbar(
  title = HTML("<strong>Project Title</strong>"),
  rightUi = tags$li(
    class = "dropdown",
    tags$div(
      style = "position: fixed; top:10px; right:10px; z-index:9999;
               background: rgba(255,255,255,0.9); padding:5px 10px; border-radius:15px;
               font-size:12px; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.1);",
      if (isTRUE(enable_ai)) tags$span(style="color:#28a745;","AI Version (4964)")
      else tags$span(style="color:#6c757d;","Basic Version (4966)")
    )
  )
)
````

——

## 4. 新增与 GIST_Protemics 一致的 Home 页
- 在 sidebar 添加 Home 菜单项；在 body 的 tabItems/bs4TabItems 中添加对应 tab。
- Home 页布局要点：h1.homeTitle（绿色、居中）、div.intro-text（白底说明）、3 个 valueBox 概览。
````r mode=EXCERPT
# Sidebar
bs4SidebarMenu(
  bs4SidebarMenuItem(text="Home", tabName="home", icon=icon("home")),
  ...
)

# Body
bs4TabItems(
  bs4TabItem(
    tabName="home",
    fluidRow(
      column(12,
        h1("Welcome to XYZ Analysis Platform", class="homeTitle"),
        div(class="intro-text", p("Short intro text here."))
      )
    ),
    br(),
    fluidRow(
      bs4ValueBox(value="11 Types", subtitle="Clinical Feature Analysis", icon=icon("chart-bar"), color="primary", width=4),
      bs4ValueBox(value="Correlation", subtitle="Association Analysis", icon=icon("project-diagram"), color="success", width=4),
      bs4ValueBox(value="CIC", subtitle="Seven-step Heatmap", icon=icon("layer-group"), color="warning", width=4)
    )
  ),
  ...
)
````
- 样式 .homeTitle/.intro-text 均来自 protwww/custom.css。

——

## 5. 模块页的统一版式（标题 + 灰绿说明条 + 居中按钮）
- 为每个模块 UI 函数（如 moduleXUI）在顶部增加以下结构：
  - 标题：h1(class="pageTitle", "Your Title")
  - 说明：div(class="module-description", span("Description: ", "..."))
  - 居中按钮：单独一行、置中、“Visualize” 文案
- 样例（以某模块 UI 为例）：
````r mode=EXCERPT
tagList(
  div(class="module-header-container",
      h1(class="pageTitle", "Module Title Analysis")
  ),
  div(class="module-description",
      span("Description: ", "What this module does ...")
  ),
  fluidRow(
    column(12,
      bs4Card(width=12, title="Input",
        div(class="inline-inputs",
          textInput(ns("gene"), "Gene symbol", value="KIT", width="320px")
        )
      )
    )
  ),
  div(style="text-align:center; margin-top:10px; margin-bottom:20px;",
      actionButton(ns("run"), label="Visualize", icon=icon("play"), class="btn btn-primary", style="min-width:180px;")
  ),
  # Results area...
)
````
- 注意：把 actionButton 从 Input 卡片中移出到独立的置中区域，保持与 Protemics 一致的视觉节奏。

——

## 6. 常见配色复用（相关性热图）
- 默认发散色（蓝-白-红）：低值 #2166AC / 中 #F7F7F7 / 高 #B2182B；或 theme 中的 #2b8cbe / #f7f7f7 / #d7301f。
- 如使用 ComplexHeatmap：可用 colorRampPalette(c("#2b8cbe","#f7f7f7","#d7301f"))(100)。
- 建议在项目的 theme_xxx.R 里封装统一函数，模块直接引用。

——

## 7. 图表宽度与响应式（避免过宽）
- 若卡片内图过宽，可限制容器为卡片宽度的 50% 并居中：
````r mode=EXCERPT
div(class="plot-container", style="width:50%; min-width:520px; max-width:900px; margin:0 auto;",
    plotOutput(ns("plot"), height="700px", width="100%")
)
````
- 或者在 protwww/custom.css 里增加通用类（如 .narrow-plot）并在各模块复用。

——

## 8. AI 按钮样式与运行时锁定（可选）
- 如果启用 AI 模块，可复用 ai_chat_buttons.css；并在 <head> 写一个小段样式/JS，运行 AI 期间禁用按钮。
````r mode=EXCERPT
# CSS
tags$style(HTML("
  .btn-disabled { opacity: .5 !important; cursor: not-allowed !important; pointer-events:none !important; }
  .btn-disabled::after { content: ' (AI分析中...)'; font-size:.8em; color:#666; }
"))

# JS
tags$script(HTML("
Shiny.addCustomMessageHandler('aiAnalysisStatus', function(data){
  try {
    var running = !!(data && data.running);
    var $btns = $('button[id]').filter(function(){ return (this.id || '').endsWith('-run'); });
    if (running) $btns.addClass('btn-disabled').attr('disabled', true);
    else $btns.removeClass('btn-disabled').attr('disabled', false);
  } catch (e) { console.error('aiAnalysisStatus error', e); }
});
"))
````

——

## 9. 侧边栏与命名规范
- 与 Protemics 类似地分组：Clinical、Immune、Drug、CIC 等，并用 bs4SidebarMenuItem/bs4SidebarMenuSubItem 组织层次。
- 图标使用 fontawesome：icon("pills")、icon("project-diagram") 等。
- 模块 UI/Server 的函数命名建议采用 <module>ModuleUI/<module>ModuleServer，易于复用。

——

## 10. 项目结构与复用建议
- 在每个项目的 shiny_rebuild/R 下放各模块 UI 文件（clinical_module.R、immune_module.R、drug_heatmap_module.R 等），形成可拔插式结构。
- 将通用主题函数（如颜色、plot包装）放在 src/ 或 modules/theme_*.R 中。
- 保持 www/ 仅放项目特有资源；通用样式均从 protwww 读取。

——

## 11. 常见问题与排错
- 报错 “Expected tag to be of type li”: bs4DashNavbar 的 rightUi 须为 tags$li(class="dropdown", ...) 包裹。
- 样式没有变化：检查 GIST_Protemics 软链是否正确；查看是否正确设置了 addResourcePath 并在 head 中使用 protwww/custom.css。
- valueBox 样式不一致：确保 custom.css 中 .homeTitle、.intro-text、变量 --clr-primary-* 未被其他 CSS 覆盖；必要时把 link 标签顺序放最后。
- 图过宽：参照第 7 节限制容器宽度；或在 plotOutput 中设定 width="100%" 使其跟随容器。

——

## 12. 最小迁移步骤清单（可复用）
1) 在项目根创建软链 GIST_Protemics → 指向参考项目
2) 在 app.R/ui.R 里：
   - 注册 addResourcePath("protwww", "<project_root>/GIST_Protemics/www")
   - head 中 link 引入 protwww/custom.css（和 ai_chat_buttons.css 若需要）
3) 顶栏可选增加右上角版本徽标（rightUi 用 li.dropdown）
4) Sidebar 顶部加入 Home，Body 加入对应 Home 页签（homeTitle + intro-text + valueBox 三列）
5) 各模块 UI 统一使用：pageTitle + module-description + 居中 “Visualize” 按钮；把按钮从 Input 卡片移出
6) 检查各图表容器宽度，必要时按 50% 居中
7) 运行 start_ai.R 或 start_no_ai.R 手动验收外观

——

## 13. 参考与模板
- 你可以把上述片段复制成一个“样板模块 UI”文件，作为新项目的模板开头，快速粘贴并替换标题/描述文案即可。
- 如需，我可以为你生成一个“迁移脚本”，自动对指定项目注入必要的 CSS 引入、Home 页和模块页版式（支持 dry-run）。

需要我把本指南整理为 README.MD 并放入项目根目录，或输出一个最小模板文件供你直接复制使用吗？

