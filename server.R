

server <- function(input, output, session) {
  
  # ==== AI模块跟踪当前活跃模块 ====
  current_active_module <- reactiveVal("module2")  # 默认值
  
  # ==== Introduction ====
  output$home_slick_output <- renderSlickR({
    x <- slickR(slick_intro_plot,slideType = "img",
                slideId = 'slick_intro_plot_id',
                height = 600,
                width = '50%')  + 
      settings(dots = FALSE)
  })
  
  # ==== Module2 ====
  shinyjs::hide(id ="DE_overall_vol_result_sum")
  observeEvent(input$DE_all_vol_update, {
    shinyjs::show(id ="DE_overall_vol_result_sum")
    current_active_module("module2")
    cat("用户在Module2中点击了更新，设置为当前活跃模块\n")
  })
  
  DE_overall_vol_dataset_tmp <- eventReactive(input$DE_all_vol_update, {
    input$DE_overall_vol_dataset
  })
  
  DE_overall_volcano_result_plot_show_tmp <- reactive({
    # feedback: 检测输入的基因是否正确
    shinyFeedback::feedbackWarning(inputId = "DE_overall_vol_dataset",
                                   show = !(DE_overall_vol_dataset_tmp() %in% gene2sym$SYMBOL),
                                   text = "Please input the correct gene symbol !")

    req(DE_overall_vol_dataset_tmp() %in% gene2sym$SYMBOL)

    dbGIST_boxplot_Gender(ID = DE_overall_vol_dataset_tmp(), DB = dbGIST_matrix[Gender_ID])
  })
  
  # 展示前20行数据
  DE_overall_vol_result_data_panel_tmp <- reactive({
    head(dbGIST_matrix[[1]]$Matrix, n = 20)
  })
  
  # plot
  output$DE_overall_volcano_result_plot_show <- renderPlot({
    DE_overall_volcano_result_plot_show_tmp()
  }, res = 96)
  
  # data 
  output$DE_overall_vol_result_data_panel <- renderUI({
    
    # 只有gene正确的时候才显示数据
    req(DE_overall_vol_dataset_tmp() %in% gene2sym$SYMBOL)
    
    DT::datatable(DE_overall_vol_result_data_panel_tmp(),
                  caption =paste("Table: dataset",
                                 input$DE_overall_vol_dataset,sep = " "),
                  #rownames = FALSE,
                  extensions=c('Responsive'),
                  options = list(
                    dom = 'ftipr',
                    pageLength = 10,
                    responsive = TRUE,
                    columnDefs = 
                      list(list(className = 'dt-center', 
                                targets = "_all")),
                    initComplete = DT::JS(
                      "function(settings, json) {",
                      "$(this.api().table().header()).css({'background-color': '#000', 'color': '#fff'});",
                      "}")
                  ))
  })
  
  ## Download
  output$DE_overall_volcano_download_svg<- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset,".svg",sep="")
    },
    content = function(file){
      svg(file)
      print(DE_overall_volcano_result_plot_show_tmp())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_pdf<- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset,".pdf",sep="")
    },
    content = function(file){
      pdf(file, width = 12, height = 10)
      print(DE_overall_volcano_result_plot_show_tmp())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_png<- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset,".png",sep="")
    },
    content = function(file){
      png(file)
      print(DE_overall_volcano_result_plot_show_tmp())
      dev.off()
    }
  )
  
  output$DE_overall_vol_fulldata_download_csv<-downloadHandler(
    filename = function(){
      paste("dataset_",input$DE_overall_vol_dataset,".csv",sep = "")
    },
    content = function(file){
      sep<-","
      write.table(DE_overall_vol_result_data_panel_tmp(),file,sep=sep,row.names =TRUE)
    }
  )
  
  output$DE_overall_vol_fulldata_download_txt<-downloadHandler(
    filename = function(){
      paste("dataset_",input$DE_overall_vol_dataset,".txt",sep = "")
    },
    content = function(file){
      sep<-" "
      write.table(DE_overall_vol_result_data_panel_tmp(),file,sep=sep,row.names = TRUE)
    }
  )
  
  # ==== Module3 ==== 
  shinyjs::hide(id ="DE_overall_vol_result_sum_3")
  observeEvent(input$DE_all_vol_update_3, {
    shinyjs::show(id ="DE_overall_vol_result_sum_3")
    current_active_module("module3")
    cat("用户在Module3中点击了更新，设置为当前活跃模块\n")
  })
  
  DE_overall_vol_dataset_tmp_3 <- eventReactive(input$DE_all_vol_update_3, {
    input$DE_overall_vol_dataset_3
  })
  DE_overall_vol_dataset_tmp_3_1 <- eventReactive(input$DE_all_vol_update_3, {
    input$DE_overall_vol_dataset_3_1
  })
  
  DE_overall_volcano_result_plot_show_tmp_3 <- reactive({
    # feedback: 检测输入的基因是否正确
    shinyFeedback::feedbackWarning(inputId = "DE_overall_vol_dataset_3",
                                   show = !(DE_overall_vol_dataset_tmp_3() %in% gene2sym$SYMBOL),
                                   text = "Please input the correct gene symbol !")
    
    req(DE_overall_vol_dataset_tmp_3() %in% gene2sym$SYMBOL)
    
    shinyFeedback::feedbackWarning(inputId = "DE_overall_vol_dataset_3_1",
                                   show = !(DE_overall_vol_dataset_tmp_3_1() %in% gene2sym$SYMBOL),
                                   text = "Please input the correct gene symbol !")
    
    req(DE_overall_vol_dataset_tmp_3_1() %in% gene2sym$SYMBOL)
    
    dbGIST_cor_ID(ID = DE_overall_vol_dataset_tmp_3(),ID2 = DE_overall_vol_dataset_tmp_3_1(), DB = dbGIST_matrix[mRNA_ID])
  })
  
  # 展示前20行数据
  DE_overall_vol_result_data_panel_tmp_3 <- reactive({
    head(DB[[1]]$Matrix, n = 20)
  })
  
  # plot
  output$DE_overall_volcano_result_plot_show_3 <- renderPlot({
    DE_overall_volcano_result_plot_show_tmp_3()
  }, res = 120)
  
  # data 
  output$DE_overall_vol_result_data_panel_3 <- renderUI({
    
    # 只有gene正确的时候才显示数据
    req((DE_overall_vol_dataset_tmp_3() %in% gene2sym$SYMBOL) & (DE_overall_vol_dataset_tmp_3_1() %in% gene2sym$SYMBOL))
    
    DT::datatable(DE_overall_vol_result_data_panel_tmp_3(),
                  caption =paste("Table: dataset",
                                 input$DE_overall_vol_dataset,sep = " "),
                  #rownames = FALSE,
                  extensions=c('Responsive'),
                  options = list(
                    dom = 'ftipr',
                    pageLength = 10,
                    responsive = TRUE,
                    columnDefs = 
                      list(list(className = 'dt-center', 
                                targets = "_all")),
                    initComplete = DT::JS(
                      "function(settings, json) {",
                      "$(this.api().table().header()).css({'background-color': '#000', 'color': '#fff'});",
                      "}")
                  ))
  })
  
  ## Download
  output$DE_overall_volcano_download_svg_3 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_3, "_", input$DE_overall_vol_dataset_3_1, ".svg",sep="")
    },
    content = function(file){
      svg(file)
      print(DE_overall_volcano_result_plot_show_tmp_3())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_pdf_3<- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_3, "_", input$DE_overall_vol_dataset_3_1, ".pdf",sep="")
    },
    content = function(file){
      pdf(file, width = 14, height = 10)
      print(DE_overall_volcano_result_plot_show_tmp_3())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_png_3<- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_3, "_", input$DE_overall_vol_dataset_3_1, ".png",sep="")
    },
    content = function(file){
      png(file)
      print(DE_overall_volcano_result_plot_show_tmp_3())
      dev.off()
    }
  )
  
  output$DE_overall_vol_fulldata_download_csv_3<-downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_3, "_", input$DE_overall_vol_dataset_3_1, ".csv",sep="")
    },
    content = function(file){
      sep<-","
      write.table(DE_overall_vol_result_data_panel_tmp_3(),file,sep=sep,row.names =TRUE)
    }
  )
  
  output$DE_overall_vol_fulldata_download_txt_3<-downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_3, "_", input$DE_overall_vol_dataset_3_1, ".txt",sep="")
    },
    content = function(file){
      sep<-" "
      write.table(DE_overall_vol_result_data_panel_tmp_3(),file,sep=sep,row.names = TRUE)
    }
  )
  
  # === Module4 ====
  shinyjs::hide(id ="DE_overall_vol_result_sum_4")
  observeEvent(input$DE_all_vol_update_4, {
    shinyjs::show(id ="DE_overall_vol_result_sum_4")
    current_active_module("module4")
    cat("用户在Module4中点击了更新，设置为当前活跃模块\n")
  })
  
  DE_overall_vol_dataset_tmp_4 <- eventReactive(input$DE_all_vol_update_4, {
    input$DE_overall_vol_dataset_4
  })
  
  DE_overall_volcano_result_plot_show_tmp_4 <- reactive({
    # feedback: 检测输入的基因是否正确
    shinyFeedback::feedbackWarning(inputId = "DE_overall_vol_dataset_4",
                                   show = !(DE_overall_vol_dataset_tmp_4() %in% gene2sym$SYMBOL),
                                   text = "Please input the correct gene symbol !")
    
    req(DE_overall_vol_dataset_tmp_4() %in% gene2sym$SYMBOL)
    
    dbGIST_boxplot_Drug(ID = DE_overall_vol_dataset_tmp_4(),DB = dbGIST_matrix[IM_ID])
  })
  
  # 展示前20行数据
  DE_overall_vol_result_data_panel_tmp_4 <- reactive({
    head(dbGIST_matrix[[1]]$Matrix, n = 20)
  })
  
  # plot
  output$DE_overall_volcano_result_plot_show_4 <- renderPlot({
    DE_overall_volcano_result_plot_show_tmp_4()
  }, res = 120)
  
  # data 
  output$DE_overall_vol_result_data_panel_4 <- renderUI({
    
    # 只有gene正确的时候才显示数据
    req(DE_overall_vol_dataset_tmp_4() %in% gene2sym$SYMBOL)
    
    DT::datatable(DE_overall_vol_result_data_panel_tmp_4(),
                  caption =paste("Table: dataset",
                                 input$DE_overall_vol_dataset_4,sep = " "),
                  extensions=c('Responsive'),
                  options = list(
                    dom = 'ftipr',
                    pageLength = 10,
                    responsive = TRUE,
                    columnDefs = 
                      list(list(className = 'dt-center', 
                                targets = "_all")),
                    initComplete = DT::JS(
                      "function(settings, json) {",
                      "$(this.api().table().header()).css({'background-color': '#000', 'color': '#fff'});",
                      "}")
                  ))
  })
  
  ## Download
  output$DE_overall_volcano_download_svg_4 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_4,".svg",sep="")
    },
    content = function(file){
      svg(file)
      print(DE_overall_volcano_result_plot_show_tmp_4())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_pdf_4 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_4,".pdf",sep="")
    },
    content = function(file){
      pdf(file, width = 14, height = 10)
      print(DE_overall_volcano_result_plot_show_tmp_4())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_png_4 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_4,".png",sep="")
    },
    content = function(file){
      png(file)
      print(DE_overall_volcano_result_plot_show_tmp_4())
      dev.off()
    }
  )
  
  output$DE_overall_vol_fulldata_download_csv_4 <- downloadHandler(
    filename = function(){
      paste("dataset_",input$DE_overall_vol_dataset_4,".csv",sep = "")
    },
    content = function(file){
      sep<-","
      write.table(DE_overall_vol_result_data_panel_tmp_4(),file,sep=sep,row.names =TRUE)
    }
  )
  
  output$DE_overall_vol_fulldata_download_txt_4 <- downloadHandler(
    filename = function(){
      paste("dataset_",input$DE_overall_vol_dataset_4,".txt",sep = "")
    },
    content = function(file){
      sep<-" "
      write.table(DE_overall_vol_result_data_panel_tmp_4(),file,sep=sep,row.names = TRUE)
    }
  )
  
  # === Module5 ====
  shinyjs::hide(id ="DE_overall_vol_result_sum_5")
  observeEvent(input$DE_all_vol_update_5, {
    shinyjs::show(id ="DE_overall_vol_result_sum_5")
    current_active_module("module5")
    cat("用户在Module5中点击了更新，设置为当前活跃模块\n")
  })
  
  DE_overall_vol_dataset_tmp_5 <- eventReactive(input$DE_all_vol_update_5, {
    input$DE_overall_vol_dataset_5
  })
  
  DE_overall_volcano_result_plot_show_tmp_5 <- reactive({
    # feedback: 检测输入的基因是否正确
    shinyFeedback::feedbackWarning(inputId = "DE_overall_vol_dataset_5",
                                   show = !(DE_overall_vol_dataset_tmp_5() %in% gene2sym$SYMBOL),
                                   text = "Please input the correct gene symbol !")
    
    req(DE_overall_vol_dataset_tmp_5() %in% gene2sym$SYMBOL)
    
    dbGIST_boxplot_PrePost(ID = DE_overall_vol_dataset_tmp_5(),Mutation = "All",DB = dbGIST_matrix[Post_pre_treament_ID])
  })
  
  # 展示前20行数据
  DE_overall_vol_result_data_panel_tmp_5 <- reactive({
    head(dbGIST_matrix[[1]]$Matrix, n = 20)
  })
  
  # plot
  output$DE_overall_volcano_result_plot_show_5 <- renderPlot({
    DE_overall_volcano_result_plot_show_tmp_5()
  }, res = 120)
  
  # data 
  output$DE_overall_vol_result_data_panel_5 <- renderUI({
    
    # 只有gene正确的时候才显示数据
    req(DE_overall_vol_dataset_tmp_5() %in% gene2sym$SYMBOL)
    
    DT::datatable(DE_overall_vol_result_data_panel_tmp_5(),
                  caption =paste("Table: dataset",
                                 input$DE_overall_vol_dataset_5,sep = " "),
                  extensions=c('Responsive'),
                  options = list(
                    dom = 'ftipr',
                    pageLength = 10,
                    responsive = TRUE,
                    columnDefs = 
                      list(list(className = 'dt-center', 
                                targets = "_all")),
                    initComplete = DT::JS(
                      "function(settings, json) {",
                      "$(this.api().table().header()).css({'background-color': '#000', 'color': '#fff'});",
                      "}")
                  ))
  })
  
  ## Download
  output$DE_overall_volcano_download_svg_5 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_5,".svg",sep="")
    },
    content = function(file){
      svg(file)
      print(DE_overall_volcano_result_plot_show_tmp_5())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_pdf_5 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_5,".pdf",sep="")
    },
    content = function(file){
      pdf(file, width = 12, height = 8)
      print(DE_overall_volcano_result_plot_show_tmp_5())
      dev.off()
    }
  )
  
  output$DE_overall_volcano_download_png_5 <- downloadHandler(
    filename = function(){
      paste("Gene_",input$DE_overall_vol_dataset_5,".png",sep="")
    },
    content = function(file){
      png(file)
      print(DE_overall_volcano_result_plot_show_tmp_5())
      dev.off()
    }
  )
  
  output$DE_overall_vol_fulldata_download_csv_5 <- downloadHandler(
    filename = function(){
      paste("dataset_",input$DE_overall_vol_dataset_5,".csv",sep = "")
    },
    content = function(file){
      sep<-","
      write.table(DE_overall_vol_result_data_panel_tmp_5(),file,sep=sep,row.names =TRUE)
    }
  )
  
  output$DE_overall_vol_fulldata_download_txt_5 <- downloadHandler(
    filename = function(){
      paste("dataset_",input$DE_overall_vol_dataset_5,".txt",sep = "")
    },
    content = function(file){
      sep<-" "
      write.table(DE_overall_vol_result_data_panel_tmp_5(),file,sep=sep,row.names = TRUE)
    }
  )
  
  # ==== AI 聊天机器人服务器逻辑 ====
  
  # 存储聊天历史
  chat_history <- reactiveVal(list())
  
  # 跟踪最近活跃的模块
  active_module <- reactiveVal("module2")  # 默认Module2
  
  # 监听各模块的Visualize按钮，更新活跃模块
  observeEvent(input$DE_all_vol_update, {
    active_module("module2")
    cat("🎯 用户切换到 Module2\n")
  })
  
  observeEvent(input$DE_all_vol_update_3, {
    active_module("module3") 
    cat("🎯 用户切换到 Module3\n")
  })
  
  observeEvent(input$DE_all_vol_update_4, {
    active_module("module4")
    cat("🎯 用户切换到 Module4\n")
  })
  
  observeEvent(input$DE_all_vol_update_5, {
    active_module("module5")
    cat("🎯 用户切换到 Module5\n")
  })
  
  # 处理发送消息
  observeEvent(input$ai_send_message, {
    if (input$ai_chat_message != "") {
      # 添加用户消息
      runjs(sprintf("addChatMessage('%s', true);", input$ai_chat_message))
      
      # 调用 AI API
      tryCatch({
        messages <- list(
          list(
            role = "user", 
            content = list(list(type = "text", text = input$ai_chat_message))
          )
        )
        
        result <- call_doubao_api(messages)
        
        if (result$success) {
          ai_response <- gsub("\n", "<br/>", result$content)
          runjs(sprintf("addChatMessage('%s', false);", ai_response))
        } else {
          runjs(sprintf("addChatMessage('抱歉，出现了错误：%s', false);", result$error))
        }
      }, error = function(e) {
        runjs(sprintf("addChatMessage('抱歉，出现了错误：%s', false);", e$message))
      })
      
      # 清空输入框
      updateTextInput(session, "ai_chat_message", value = "")
    }
  })
  
  # 处理图片上传分析 - 使用直接PNG分析
  observeEvent(input$ai_image_upload, {
    if (!is.null(input$ai_image_upload)) {
      file_path <- input$ai_image_upload$datapath
      file_name <- input$ai_image_upload$name
      
      runjs(sprintf("addChatMessage('正在分析上传的图片: %s...', true);", file_name))
      
      tryCatch({
        result <- analyze_png_file(file_path, 
                                  "请分析这个图片，如果是基因表达相关图表，请重点分析统计学意义和生物学含义")
        
        if (result$success) {
          ai_response <- gsub("\n", "<br/>", result$content)
          ai_response <- gsub("'", "\\\\'", ai_response)  # 转义单引号
          runjs(sprintf("addChatMessage('%s', false);", ai_response))
        } else {
          runjs(sprintf("addChatMessage('图片分析失败：%s', false);", result$error))
        }
      }, error = function(e) {
        runjs(sprintf("addChatMessage('图片处理错误：%s', false);", e$message))
      })
    }
  })
  
  # 顶部分析按钮 - 最显眼的位置
  observeEvent(input$ai_analyze_current_plot_top, {
    runjs("addChatMessage('正在智能检测并分析当前模块图表...', true);")
    
    tryCatch({
      # 获取当前活跃的模块
      active_module <- current_active_module()
      cat(sprintf("🎯 当前活跃模块: %s\n", active_module))
      
      # 根据活跃模块选择对应的图表
      plot_info <- NULL
      
      if (active_module == "module2" && 
          !is.null(input$DE_overall_vol_dataset) && 
          input$DE_overall_vol_dataset != "" &&
          input$DE_overall_vol_dataset %in% gene2sym$SYMBOL) {
        plot_info <- list(
          plot = dbGIST_boxplot_Gender(ID = input$DE_overall_vol_dataset, 
                                      DB = dbGIST_matrix[Gender_ID]),
          gene_name = input$DE_overall_vol_dataset,
          module_info = "Module2-性别差异基因表达分析",
          success = TRUE
        )
      } else if (active_module == "module3" && 
                 !is.null(input$DE_overall_vol_dataset_3) && 
                 !is.null(input$DE_overall_vol_dataset_3_1) &&
                 input$DE_overall_vol_dataset_3 != "" &&
                 input$DE_overall_vol_dataset_3_1 != "" &&
                 input$DE_overall_vol_dataset_3 %in% gene2sym$SYMBOL &&
                 input$DE_overall_vol_dataset_3_1 %in% gene2sym$SYMBOL) {
        plot_info <- list(
          plot = dbGIST_cor_ID(ID = input$DE_overall_vol_dataset_3,
                              ID2 = input$DE_overall_vol_dataset_3_1, 
                              DB = dbGIST_matrix[mRNA_ID]),
          gene_name = paste0(input$DE_overall_vol_dataset_3, "_vs_", input$DE_overall_vol_dataset_3_1),
          module_info = "Module3-基因相关性分析",
          success = TRUE
        )
      } else if (active_module == "module4" && 
                 !is.null(input$DE_overall_vol_dataset_4) && 
                 input$DE_overall_vol_dataset_4 != "" &&
                 input$DE_overall_vol_dataset_4 %in% gene2sym$SYMBOL) {
        plot_info <- list(
          plot = dbGIST_boxplot_Drug(ID = input$DE_overall_vol_dataset_4,
                                    DB = dbGIST_matrix[IM_ID]),
          gene_name = input$DE_overall_vol_dataset_4,
          module_info = "Module4-药物抗性基因分析",
          success = TRUE
        )
      } else if (active_module == "module5" && 
                 !is.null(input$DE_overall_vol_dataset_5) && 
                 input$DE_overall_vol_dataset_5 != "" &&
                 input$DE_overall_vol_dataset_5 %in% gene2sym$SYMBOL) {
        plot_info <- list(
          plot = dbGIST_boxplot_PrePost(ID = input$DE_overall_vol_dataset_5,
                                       Mutation = "All",
                                       DB = dbGIST_matrix[Post_pre_treament_ID]),
          gene_name = input$DE_overall_vol_dataset_5,
          module_info = "Module5-治疗前后基因表达分析",
          success = TRUE
        )
      }
      
      # 如果当前活跃模块没有数据，尝试使用默认逻辑
      if (is.null(plot_info)) {
        cat("当前活跃模块无有效数据，使用原有逻辑\n")
        plot_info <- get_current_plot_info(input)
      }
      
      if (plot_info$success && !is.null(plot_info$plot)) {
        runjs(sprintf("addChatMessage('📊 检测到：%s - %s', false);", plot_info$module_info, plot_info$gene_name))
        
        # 使用新的保存并分析函数
        save_path <- paste0("current_plot_", gsub("[^A-Za-z0-9_]", "_", plot_info$gene_name), "_", 
                           format(Sys.time(), "%Y%m%d_%H%M%S"), ".png")
        
        result <- save_and_analyze_current_plot(
          plot_info$plot, 
          save_path,
          paste0("请分析这个", plot_info$module_info, "的图表（基因：", plot_info$gene_name, "）。重点关注：1. 统计显著性分析 2. 生物学意义解读 3. 临床应用价值 4. 该模块特有的分析要点")
        )
        
        if (result$success) {
          ai_response <- gsub("\\n", "<br/>", result$content)
          ai_response <- gsub("'", "\\\\'", ai_response)  # 转义单引号
          runjs(sprintf("addChatMessage('%s', false);", ai_response))
          
          # 提示用户PNG文件位置
          runjs(sprintf("addChatMessage('💾 图表已保存为: %s', false);", save_path))
        } else {
          runjs(sprintf("addChatMessage('图表分析失败：%s', false);", result$error))
        }
      } else {
        runjs(sprintf("addChatMessage('❌ %s<br/>请先在任意模块中生成图表，然后再进行分析。', false);", plot_info$module_info))
      }
    }, error = function(e) {
      runjs(sprintf("addChatMessage('分析当前图表时出错：%s', false);", e$message))
    })
  })

  # 备用分析按钮 - 为了确保功能可用
  observeEvent(input$ai_analyze_current_plot_backup, {
    runjs("addChatMessage('正在智能分析当前模块图表（备用按钮）...', true);")
    
    tryCatch({
      # 使用智能图表获取函数
      plot_info <- get_current_plot_info(input)
      
      if (plot_info$success && !is.null(plot_info$plot)) {
        runjs(sprintf("addChatMessage('📊 检测到：%s - %s', false);", plot_info$module_info, plot_info$gene_name))
        
        # 使用新的保存并分析函数
        save_path <- paste0("backup_plot_", gsub("[^A-Za-z0-9_]", "_", plot_info$gene_name), "_", 
                           format(Sys.time(), "%Y%m%d_%H%M%S"), ".png")
        
        result <- save_and_analyze_current_plot(
          plot_info$plot, 
          save_path,
          paste0("请分析这个", plot_info$module_info, "的图表（基因：", plot_info$gene_name, "）。重点关注：1. 统计显著性分析 2. 生物学意义解读 3. 临床应用价值 4. 该模块特有的分析要点")
        )
        
        if (result$success) {
          ai_response <- gsub("\\n", "<br/>", result$content)
          ai_response <- gsub("'", "\\\\'", ai_response)  # 转义单引号
          runjs(sprintf("addChatMessage('%s', false);", ai_response))
          
          # 提示用户PNG文件位置
          runjs(sprintf("addChatMessage('💾 图表已保存为: %s', false);", save_path))
        } else {
          runjs(sprintf("addChatMessage('图表分析失败：%s', false);", result$error))
        }
      } else {
        runjs(sprintf("addChatMessage('❌ %s<br/>请先在任意模块中生成图表，然后再进行分析。', false);", plot_info$module_info))
      }
    }, error = function(e) {
      runjs(sprintf("addChatMessage('分析当前图表时出错：%s', false);", e$message))
    })
  })

  # 改进的图片分析：直接保存PNG并分析
  observeEvent(input$ai_analyze_current_plot, {
    runjs("addChatMessage('正在分析当前图表（高质量PNG模式）...', true);")
    
    tryCatch({
      # 使用智能图表获取函数
      plot_info <- get_current_plot_info(input)
      
      if (plot_info$success && !is.null(plot_info$plot)) {
        runjs(sprintf("addChatMessage('📊 检测到：%s - %s', false);", plot_info$module_info, plot_info$gene_name))
        
        # 使用新的保存并分析函数
        save_path <- paste0("chat_plot_", gsub("[^A-Za-z0-9_]", "_", plot_info$gene_name), "_", 
                           format(Sys.time(), "%Y%m%d_%H%M%S"), ".png")
        
        result <- save_and_analyze_current_plot(
          plot_info$plot, 
          save_path,
          paste0("请分析这个", plot_info$module_info, "的图表（基因：", plot_info$gene_name, "）。重点关注：1. 统计显著性分析 2. 生物学意义解读 3. 临床应用价值 4. 该模块特有的分析要点")
        )
        
        if (result$success) {
          ai_response <- gsub("\n", "<br/>", result$content)
          ai_response <- gsub("'", "\\\\'", ai_response)  # 转义单引号
          runjs(sprintf("addChatMessage('%s', false);", ai_response))
          
          # 提示用户PNG文件位置
          runjs(sprintf("addChatMessage('💾 图表已保存为: %s', false);", save_path))
        } else {
          runjs(sprintf("addChatMessage('图表分析失败：%s', false);", result$error))
        }
      } else {
        runjs(sprintf("addChatMessage('❌ %s<br/>💡 请先在任意模块(Module2-5)中输入基因名称并点击Visualize生成图表，然后再进行AI分析。', false);", plot_info$module_info))
      }
    }, error = function(e) {
      runjs(sprintf("addChatMessage('分析当前图表时出错：%s', false);", e$message))
    })
  })
  
  # 解释统计结果
  observeEvent(input$ai_explain_stats, {
    runjs("addChatMessage('让我解释一下统计分析的含义...', true);")
    
    stats_explanation <- "在基因表达分析中，常见的统计指标包括：<br/>
    1. <strong>P值</strong>：表示观察到的差异由随机因素造成的概率，通常P<0.05认为有统计学意义<br/>
    2. <strong>Fold Change</strong>：表示基因表达量的变化倍数<br/>
    3. <strong>置信区间</strong>：表示真实参数值的可能范围<br/>
    4. <strong>相关系数</strong>：表示两个变量之间线性关系的强度<br/>
    5. <strong>AUC值</strong>：ROC曲线下面积，用于评估分类性能，值越接近1表示分类效果越好"
    
    runjs(sprintf("addChatMessage('%s', false);", stats_explanation))
  })
  
}
