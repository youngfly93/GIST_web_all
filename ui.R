

dashboardPage(
  # preloader = list(html = tagList(spin_1(), "Loading ..."), color = "#343a40"),
  # dark = FALSE,  # 新版本 bs4Dash 不支持这些参数
  # help = FALSE,
  # fullscreen = TRUE,
  scrollToTop = TRUE,

  title= "GIST",
  
  dashboardHeader(title = "GIST"),
  
  ## ==== Sidebar ====
  dashboardSidebar(
    sidebarMenu(
      menuItem("Introduction", tabName = "Introduction", icon = icon("home")),
      menuItem("Module2", tabName = "module2", icon = icon("atom")),
      menuItem("Module3", tabName = "module3", icon = icon("chart-line")),
      menuItem("Module4", tabName = "module4", icon = icon("chart-pie")),
      menuItem("Module5", tabName = "module5", icon = icon("bezier-curve"))
      )
    ),
  ## ==== Body ====
  dashboardBody(

    shinyFeedback::useShinyFeedback(),
    useShinyjs(),
    includeCSS("./www/custom.css"),
    
    tabItems(
      # ==== Introduction ====
      tabItem(
        tabName = "Introduction",
        column(width=12,style = "padding-right:25px;padding-left:25px",
               h1(class = "homeTitle","Welcome to GIST!"),
               p(home_whole_intro_text)),
        column(width=12,style = "padding-right:25px;padding-left:25px",
               slickROutput("home_slick_output",width='100%',height='200px')%>% withSpinner(color="#6c6689")),
        column(width=12,style = "padding-right:25px;padding-left:25px;padding-top: 25px",
               bsCollapse(id = "document_for_changlog", open = "News and Updates",
                          bsCollapsePanel("News and Updates", 
                                          "Updates: 2023-06-12",br(),"GIST release 1.2", hr(),
                                          "Updates: 2023-04-22",br(),"GIST release 1.1", hr(),
                                          "Updates: 2023-02-12",br(),"GIST release 1.0", 
                                          style = "primary")
               )
        ),
        column(width = 12,class = "footer-container",
               HTML('<div style="text-align: center;"><p>Copyright © 2024. All rights reserved.</p></div> <div style="text-align: center;"> <div style
="display:inline-block;width:400px;"><script type="text/javascript" src="//rf.revolvermaps.com/0/0/7.js?i=5cj7bnyzooe&amp;m=0&amp;c=ff0000&amp;cr1=007eff&amp;sx=0" async="async"></script></div> </div>')
        )
      ),
      
      # ==== module2 ====
      tabItem(
        tabName = "module2",
              fluidRow( 
                column(width=12,style = "padding-right:40px;padding-left:40px",
                       
                       column(width=12,align="center",style="padding-top:10px",
                              actionBttn(
                                inputId = "DE_overall_title",
                                label = h1(class = "pageTitle","Single gene expression investigation",
                                           icon(name = "search",lib="glyphicon")), 
                                style = "minimal",
                                color = "primary",
                                size = "lg")),
                       bsModal(id="modal_DE_overall_title", title="Introduction", trigger="DE_overall_title", 
                               size = "large",module2_text),
                       
                       radioGroupButtons(
                         inputId = "DE_overall_plottype",
                         label = NULL,
                         choices = c("Module2"),
                         selected = "Module2",
                         justified = TRUE,
                         status = "primary"
                       ),
                       
                       conditionalPanel(
                         condition = "input.DE_overall_plottype=='Module2'",
                         shinydashboard::box(width=NULL,
                                             fluidRow(width = 12,
                                                    column(width = 5,style = "padding-right:15px;padding-left:0px",
                                                           textInput(
                                                             inputId = "DE_overall_vol_dataset",
                                                             label = p("Search, input a gene:", style="margin: 0 0 5px;",
                                                                       icon(name = "question-sign",lib="glyphicon",id="DE_all_vol_dataset_q")),
                                                             value = "MCM7"
                                                           ),
                                                           bsModal(id="modal_DE_all_vol_dataset_q", title="Dataset Selection", trigger="DE_all_vol_dataset_q", 
                                                                   size = "large",
                                                                   p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx"),
                                                                   p(class = "submitboxContext","For example: "),
                                                                   p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx")
                                                                   )
                                                    ),
                                                    column(width = 2,style="padding-top:40px",
                                                           actionButton("DE_all_vol_update", 
                                                                        "Visualize",icon = icon('palette')))
                                             )
                  
                         ),
                         
                         div(id="DE_overall_vol_result_sum",
                             tabBox(id="DE_overall_vol_result_panel", title="Result",width = NULL,
                                    tabPanel("Plot",
                                             div(
                                               fluidRow(
                                                 column(width = 8,
                                                        dropdownButton(
                                                          inputId = "DE_overall_volcano_introduction",
                                                          label = "Plot Introduction",
                                                          icon = icon("question"),
                                                          status = "primary",
                                                          circle = FALSE,
                                                          width="500px",
                                                          plot_introduction_text)),
                                                 column(width = 4,
                                                        dropdownButton(
                                                          inputId = "DE_overall_volcano_download",
                                                          label = "Download",
                                                          status = "primary",
                                                          icon=icon("download"),
                                                          circle = FALSE,
                                                          width="50px",
                                                          downloadButton(outputId = "DE_overall_volcano_download_svg",
                                                                         label = "SVG"),
                                                          downloadButton(outputId = "DE_overall_volcano_download_pdf",
                                                                         label = "PDF"),
                                                          downloadButton(outputId = "DE_overall_volcano_download_png",
                                                                         label = "PNG")))
                                                 
                                               ),
                                               column(width = 12,
                                                      align = "center",
                                                      (div(style='width:1100px;overflow-x:scroll;height:800px;overflow-y:scroll;',
                                                           plotOutput("DE_overall_volcano_result_plot_show",
                                                                      width = "1000px", height = "900px") %>% withSpinner(color="#6c6689")))
                                                      )
                                             )
                                    ),
                                    tabPanel("Data",
                                             fluidRow(
                                               column(width = 7,
                                                      dropdownButton(
                                                        inputId = "DE_overall_vol_fulldata_download",
                                                        label = "Download Full Data",
                                                        status = "primary",
                                                        icon=icon("download"),
                                                        circle = FALSE,
                                                        width="50px",
                                                        downloadButton(outputId = "DE_overall_vol_fulldata_download_csv",
                                                                       label = "CSV"),
                                                        downloadButton(outputId = "DE_overall_vol_fulldata_download_txt",
                                                                       label = "TXT"))),
                                               column(width = 5,
                                                      helpText("Please wait as the table take a few seconds to load."))
                                               
                                             ),
                                             uiOutput("DE_overall_vol_result_data_panel"))))
                         
                       )
                )
                
              ),
              column(12,class = "footer-container",
                     HTML('<div style="text-align: center;"><p>Copyright © 2024. All rights reserved.</p></div> <div style="text-align: center;">
                     <div style="display:inline-block;width:400px;"></div> </div>'))
              
      ),
      
      # ==== module3 ====
      tabItem(
        tabName = "module3",
        fluidRow( 
          column(width=12,style = "padding-right:40px;padding-left:40px",
                 
                 column(width=12,align="center",style="padding-top:10px",
                        actionBttn(
                          inputId = "DE_overall_title_3",
                          label = h1(class = "pageTitle","Expression corralation between genes",
                                     icon(name = "search",lib="glyphicon")), 
                          style = "minimal",
                          color = "primary",
                          size = "lg")),
                 bsModal(id="modal_DE_overall_title_3", title="Introduction", trigger="DE_overall_title_3", 
                         size = "large", module3_text),
                 
                 radioGroupButtons(
                   inputId = "DE_overall_plottype_3",
                   label = NULL,
                   choices = c("Module3"),
                   selected = "Module3",
                   justified = TRUE,
                   status = "primary"
                 ),
                 
                 conditionalPanel(
                   condition = "input.DE_overall_plottype_3=='Module3'",
                   shinydashboard::box(width=NULL,
                                       fluidRow(width = 12,
                                                column(width = 5,style = "padding-right:15px;padding-left:0px",
                                                       textInput(
                                                         inputId = "DE_overall_vol_dataset_3",
                                                         label = p("Input a gene:", style="margin: 0 0 5px;",
                                                                   icon(name = "question-sign",lib="glyphicon",id="DE_all_vol_dataset_q_3")),
                                                         value = "MCM7"
                                                       ),
                                                       bsModal(id="modal_DE_all_vol_dataset_q_3", title="Dataset Selection", trigger="DE_all_vol_dataset_q_3", 
                                                               size = "large",
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx"),
                                                               p(class = "submitboxContext","For example: "),
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx")
                                                       )
                                                ),
                                                column(width = 5,style = "padding-right:15px;padding-left:0px",
                                                       textInput(
                                                         inputId = "DE_overall_vol_dataset_3_1",
                                                         label = p("Input a gene:", style="margin: 0 0 5px;",
                                                                   icon(name = "question-sign",lib="glyphicon",id="DE_all_vol_dataset_q_3_1")),
                                                         value = "MKI67"
                                                       ),
                                                       bsModal(id="modal_DE_all_vol_dataset_q_3_1", title="Dataset Selection", trigger="DE_all_vol_dataset_q_3_1", 
                                                               size = "large",
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx"),
                                                               p(class = "submitboxContext","For example: "),
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx")
                                                       )
                                                ),
                                                column(width = 2,style="padding-top:40px",
                                                       actionButton("DE_all_vol_update_3", 
                                                                    "Visualize",icon = icon('palette')))
                                       )
                                       
                   ),
                   
                   div(id="DE_overall_vol_result_sum_3",
                       tabBox(id="DE_overall_vol_result_panel_3", title="Result",width = NULL,
                              tabPanel("Plot",
                                       div(
                                         fluidRow(
                                           column(width = 8,
                                                  dropdownButton(
                                                    inputId = "DE_overall_volcano_introduction_3",
                                                    label = "Plot Introduction",
                                                    icon = icon("question"),
                                                    status = "primary",
                                                    circle = FALSE,
                                                    width="500px",
                                                    plot_introduction_text)),
                                           column(width = 4,
                                                  dropdownButton(
                                                    inputId = "DE_overall_volcano_download_3",
                                                    label = "Download",
                                                    status = "primary",
                                                    icon=icon("download"),
                                                    circle = FALSE,
                                                    width="50px",
                                                    downloadButton(outputId = "DE_overall_volcano_download_svg_3",
                                                                   label = "SVG"),
                                                    downloadButton(outputId = "DE_overall_volcano_download_pdf_3",
                                                                   label = "PDF"),
                                                    downloadButton(outputId = "DE_overall_volcano_download_png_3",
                                                                   label = "PNG")))
                                           
                                         ),
                                         column(width = 12,
                                                align = "center",
                                                (div(style='width:1100px;overflow-x:scroll;height:800px;overflow-y:scroll;',
                                                     plotOutput("DE_overall_volcano_result_plot_show_3",
                                                                width = "1400px", height = "1000px") %>% withSpinner(color="#6c6689")))
                                         )
                                       )
                              ),
                              tabPanel("Data",
                                       fluidRow(
                                         column(width = 7,
                                                dropdownButton(
                                                  inputId = "DE_overall_vol_fulldata_download_3",
                                                  label = "Download Full Data",
                                                  status = "primary",
                                                  icon=icon("download"),
                                                  circle = FALSE,
                                                  width="50px",
                                                  downloadButton(outputId = "DE_overall_vol_fulldata_download_csv_3",
                                                                 label = "CSV"),
                                                  downloadButton(outputId = "DE_overall_vol_fulldata_download_txt_3",
                                                                 label = "TXT"))),
                                         column(width = 5,
                                                helpText("Please wait as the table take a few seconds to load."))
                                         
                                       ),
                                       uiOutput("DE_overall_vol_result_data_panel_3"))))
                   
                 )
          )
          
        ),
        column(12,class = "footer-container",
               HTML('<div style="text-align: center;"><p>Copyright © 2024. All rights reserved.</p></div> <div style="text-align: center;">
                     <div style="display:inline-block;width:400px;"></div> </div>'))
        
      ),
      
      # ==== Module4 ====
      tabItem(
        tabName = "module4",
        fluidRow( 
          column(width=12,style = "padding-right:40px;padding-left:40px",
                 
                 column(width=12,align="center",style="padding-top:10px",
                        actionBttn(
                          inputId = "DE_overall_title_4",
                          label = h1(class = "pageTitle","Exploration of the drug-resistent gene",
                                     icon(name = "search",lib="glyphicon")), 
                          style = "minimal",
                          color = "primary",
                          size = "lg")),
                 bsModal(id="modal_DE_overall_title_4", title="Introduction", trigger="DE_overall_title", 
                         size = "large",module2_text),
                 
                 radioGroupButtons(
                   inputId = "DE_overall_plottype_4",
                   label = NULL,
                   choices = c("Module4"),
                   selected = "Module4",
                   justified = TRUE,
                   status = "primary"
                 ),
                 
                 conditionalPanel(
                   condition = "input.DE_overall_plottype_4=='Module4'",
                   shinydashboard::box(width=NULL,
                                       fluidRow(width = 12,
                                                column(width = 5,style = "padding-right:15px;padding-left:0px",
                                                       textInput(
                                                         inputId = "DE_overall_vol_dataset_4",
                                                         label = p("Search, input a gene:", style="margin: 0 0 5px;",
                                                                   icon(name = "question-sign",lib="glyphicon",id="DE_all_vol_dataset_q_4")),
                                                         value = "MCM7"
                                                       ),
                                                       bsModal(id="modal_DE_all_vol_dataset_q_4", title="Dataset Selection", trigger="DE_all_vol_dataset_q_4", 
                                                               size = "large",
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx"),
                                                               p(class = "submitboxContext","For example: "),
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx")
                                                       )
                                                ),
                                                column(width = 2,style="padding-top:40px",
                                                       actionButton("DE_all_vol_update_4", 
                                                                    "Visualize",icon = icon('palette')))
                                       )
                                       
                   ),
                   
                   div(id="DE_overall_vol_result_sum_4",
                       tabBox(id="DE_overall_vol_result_panel_4", title="Result",width = NULL,
                              tabPanel("Plot",
                                       div(
                                         fluidRow(
                                           column(width = 8,
                                                  dropdownButton(
                                                    inputId = "DE_overall_volcano_introduction_4",
                                                    label = "Plot Introduction",
                                                    icon = icon("question"),
                                                    status = "primary",
                                                    circle = FALSE,
                                                    width="500px",
                                                    plot_introduction_text)),
                                           column(width = 4,
                                                  dropdownButton(
                                                    inputId = "DE_overall_volcano_download_4",
                                                    label = "Download",
                                                    status = "primary",
                                                    icon=icon("download"),
                                                    circle = FALSE,
                                                    width="50px",
                                                    downloadButton(outputId = "DE_overall_volcano_download_svg_4",
                                                                   label = "SVG"),
                                                    downloadButton(outputId = "DE_overall_volcano_download_pdf_4",
                                                                   label = "PDF"),
                                                    downloadButton(outputId = "DE_overall_volcano_download_png_4",
                                                                   label = "PNG")))
                                           
                                         ),
                                         column(width = 12,
                                                align = "center",
                                                (div(style='width:1100px;overflow-x:scroll;height:800px;overflow-y:scroll;',
                                                     plotOutput("DE_overall_volcano_result_plot_show_4",
                                                                width = "1400px", height = "1000px") %>% withSpinner(color="#6c6689")))
                                         )
                                       )
                              ),
                              tabPanel("Data",
                                       fluidRow(
                                         column(width = 7,
                                                dropdownButton(
                                                  inputId = "DE_overall_vol_fulldata_download_4",
                                                  label = "Download Full Data",
                                                  status = "primary",
                                                  icon=icon("download"),
                                                  circle = FALSE,
                                                  width="50px",
                                                  downloadButton(outputId = "DE_overall_vol_fulldata_download_csv_4",
                                                                 label = "CSV"),
                                                  downloadButton(outputId = "DE_overall_vol_fulldata_download_txt_4",
                                                                 label = "TXT"))),
                                         column(width = 5,
                                                helpText("Please wait as the table take a few seconds to load."))
                                         
                                       ),
                                       uiOutput("DE_overall_vol_result_data_panel_4"))))
                   
                 )
          )
          
        ),
        column(12,class = "footer-container",
               HTML('<div style="text-align: center;"><p>Copyright © 2024. All rights reserved.</p></div> <div style="text-align: center;">
                     <div style="display:inline-block;width:400px;"></div> </div>'))
        
      ),
      
      # ==== Module5 ====
      tabItem(
        tabName = "module5",
        fluidRow( 
          column(width=12,style = "padding-right:40px;padding-left:40px",
                 
                 column(width=12,align="center",style="padding-top:10px",
                        actionBttn(
                          inputId = "DE_overall_title_5",
                          label = h1(class = "pageTitle","Exploration of the pre|post treatment gene",
                                     icon(name = "search",lib="glyphicon")), 
                          style = "minimal",
                          color = "primary",
                          size = "lg")),
                 bsModal(id="modal_DE_overall_title_5", title="Introduction", trigger="DE_overall_title", 
                         size = "large",module2_text),
                 
                 radioGroupButtons(
                   inputId = "DE_overall_plottype_5",
                   label = NULL,
                   choices = c("Module5"),
                   selected = "Module5",
                   justified = TRUE,
                   status = "primary"
                 ),
                 
                 conditionalPanel(
                   condition = "input.DE_overall_plottype_5=='Module5'",
                   shinydashboard::box(width=NULL,
                                       fluidRow(width = 12,
                                                column(width = 5,style = "padding-right:15px;padding-left:0px",
                                                       textInput(
                                                         inputId = "DE_overall_vol_dataset_5",
                                                         label = p("Search, input a gene:", style="margin: 0 0 5px;",
                                                                   icon(name = "question-sign",lib="glyphicon",id="DE_all_vol_dataset_q_5")),
                                                         value = "MCM7"
                                                       ),
                                                       bsModal(id="modal_DE_all_vol_dataset_q_5", title="Dataset Selection", trigger="DE_all_vol_dataset_q_5", 
                                                               size = "large",
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx"),
                                                               p(class = "submitboxContext","For example: "),
                                                               p(class = "submitboxContext","xxxxxxxxxxxxxxxxxxxxxx")
                                                       )
                                                ),
                                                column(width = 2,style="padding-top:40px",
                                                       actionButton("DE_all_vol_update_5", 
                                                                    "Visualize",icon = icon('palette')))
                                       )
                                       
                   ),
                   
                   div(id="DE_overall_vol_result_sum_5",
                       tabBox(id="DE_overall_vol_result_panel_5", title="Result",width = NULL,
                              tabPanel("Plot",
                                       div(
                                         fluidRow(
                                           column(width = 8,
                                                  dropdownButton(
                                                    inputId = "DE_overall_volcano_introduction_5",
                                                    label = "Plot Introduction",
                                                    icon = icon("question"),
                                                    status = "primary",
                                                    circle = FALSE,
                                                    width="500px",
                                                    plot_introduction_text)),
                                           column(width = 4,
                                                  dropdownButton(
                                                    inputId = "DE_overall_volcano_download_5",
                                                    label = "Download",
                                                    status = "primary",
                                                    icon=icon("download"),
                                                    circle = FALSE,
                                                    width="50px",
                                                    downloadButton(outputId = "DE_overall_volcano_download_svg_5",
                                                                   label = "SVG"),
                                                    downloadButton(outputId = "DE_overall_volcano_download_pdf_5",
                                                                   label = "PDF"),
                                                    downloadButton(outputId = "DE_overall_volcano_download_png_5",
                                                                   label = "PNG")))
                                           
                                         ),
                                         column(width = 12,
                                                align = "center",
                                                (div(style='width:1100px;overflow-x:scroll;height:800px;overflow-y:scroll;',
                                                     plotOutput("DE_overall_volcano_result_plot_show_5",
                                                                width = "1200px", height = "800px") %>% withSpinner(color="#6c6689")))
                                         )
                                       )
                              ),
                              tabPanel("Data",
                                       fluidRow(
                                         column(width = 7,
                                                dropdownButton(
                                                  inputId = "DE_overall_vol_fulldata_download_5",
                                                  label = "Download Full Data",
                                                  status = "primary",
                                                  icon=icon("download"),
                                                  circle = FALSE,
                                                  width="50px",
                                                  downloadButton(outputId = "DE_overall_vol_fulldata_download_csv_5",
                                                                 label = "CSV"),
                                                  downloadButton(outputId = "DE_overall_vol_fulldata_download_txt_5",
                                                                 label = "TXT"))),
                                         column(width = 5,
                                                helpText("Please wait as the table take a few seconds to load."))
                                         
                                       ),
                                       uiOutput("DE_overall_vol_result_data_panel_5"))))
                   
                 )
          )
          
        ),
        column(12,class = "footer-container",
               HTML('<div style="text-align: center;"><p>Copyright © 2024. All rights reserved.</p></div> <div style="text-align: center;">
                     <div style="display:inline-block;width:400px;"></div> </div>'))
        
      )
      
      
    ),
    
    # AI 聊天机器人
    ai_chat_ui(),
    
    # JavaScript 代码
    tags$script(HTML(ai_chat_js))
  )
)
