
# ==== Library Packages ====
library(shiny)
library(bs4Dash)
library(waiter)
library(shinyjs)
library(shinyBS)
library(slickR)
library(shinyFeedback)
library(shinycssloaders)
library(shinyWidgets)
library(DT)
library(htmlwidgets)

library(tidyverse)
library(data.table)
library(stringr)
require(ggplot2)
require(ggsci)
library(pROC)
library(readr)
library(ggpubr)
library(eoffice)
library(Rcpp)
library(clusterProfiler)
library(tidyverse)
library(org.Hs.eg.db)
library(EnsDb.Hsapiens.v75)
library(AnnotationDbi)
library(patchwork)
# install_github("miccec/yaGST")  # 安装包yaGST
# library(yaGST)  # 暂时注释，如果应用运行正常可以删除

# AI 聊天机器人相关包
library(httr)
library(jsonlite)
library(base64enc)

# 加载 AI 聊天模块
source("ai_chat_module.R")

# ==== Variable Text ====
home_whole_intro_text <- "intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text intro_text "
module2_text <- "module2_text"
plot_introduction_text <- "plot_introduction_text"

module3_text <- "module3_text"

## Introduction界面的滚动图片 ==
slick_intro_plot <- list.files("./www/slick_png/", pattern=".png", full.names = TRUE)

# ==== Loading the Rdata ====     

load("./original/dbGIST_matrix(2).Rdata")

return_nrow <- function(x){
  return(dbGIST_matrix[[x]]$ID)
}

lapply(as.list(1:length(dbGIST_matrix)), return_nrow)

# ==== modified the dataset  ====

dbGIST_matrix[13][[1]]$Clinical$Imatinib <- "R"
dbGIST_matrix[13][[1]]$Clinical$Imatinib[which(dbGIST_matrix[13][[1]]$Clinical$Imatinib_naive.Resistant == "Imatinib-resistant")] <- 
  "NR"

cli2 <- read.csv("./original/GSE15966_20230217.CSV")
dbGIST_matrix[3][[1]]$Clinical$Imatinib <- cli2$Imatinib
dbGIST_matrix[3][[1]]$Clinical$Imatinib[which(dbGIST_matrix[3][[1]]$Clinical$Imatinib == "N")] <- "NR"
dbGIST_matrix[3][[1]]$Clinical$Mutations <- "KIT"
dbGIST_matrix[3][[1]]$Clinical$Mutations[which(dbGIST_matrix[3][[1]]$Clinical$Mutation_type == "KIT mutation_WT")] <- "WT"
dbGIST_matrix[3][[1]]$Clinical$Group <- str_remove(cli2$Sample_title," .* ")
dbGIST_matrix[3][[1]]$Clinical$Type <- str_extract(cli2$Sample_title,"(Pre)|(Post)")


# ==== coding the dataset by clinical info ====   

# ==== mRNA ID ====     

Age_ID <- c(1,5,7,8,14,12)
Gender_ID <- c(1,4,5,7,8,14,12)
RISK_ID <- c(7,8,14)
Location_ID <- c(1,7,13,14,6,12)
Mutation_ID <- c(2,4,5,8,14)
Mutation_type_ID <- c(1,2,3,14,4)
Mutation_chr_ID <- c(4,8,14,12)
Tumor_size_ID <- c(1,4)
Metastatic_Primary_ID <- c(6,14)
Metastatic_tumor_site_ID <- c(6,14)
Mitotic_activity_ID <- c(4)
Stage_ID <- c(4,14)
Tumor_grade_ID <- c(4)
Initial_tumor_increase_decrease_ID <- c(3)
KIT_expression_ID <- c(4)
Post_pre_treament_ID <- c(3)
CD117_status_ID <- c(4)
Imatinib_naive_Resisent_ID <- c(13)
Tumor_group_ID <- c(9) ###miniGIST
Genotype_ID <- c(10) ###SDH突变
IM_ID <- c(13,3)
mRNA_ID <- 1:14

# ==== miRNA ID ====    

Age_miRNA_ID <- c(15)
Gender_miRNA_ID <- c(15)
Risk_miRNA_ID <- c(15)
Location_miRNA_ID <- c(15,16)
Mitoses_miRNA_ID <- c(16)
Tumor_size_miRNA_ID <- c(16)
Drug.resistant_Drug.sensitive_miRNA_ID <- c(17)
Treated_Non.treated_miRNA_ID <- c(18)
Relapse_Unrelapse_miRNA_ID <- c(22)

# ==== circRNA ID  ====     

Age_circRNA_ID <- c(19,21)
Gender_circRNA_ID <- c(19,21)
Tissue_circRNA_ID <- c(19,21)

# ==== lncRNA ID ====     

Age_LncRNA_ID <- c(20)
Age_LncRNA_ID <- c(20)
Age_LncRNA_ID <- c(20)

# ==== Function module 1:  Check the Gene symbol ====    

edb <- EnsDb.Hsapiens.v75
keys <- keys(edb,keytype = "GENEID")
gene2sym <- AnnotationDbi::select(edb,keys = keys,columns = c("SYMBOL","GENEBIOTYPE"),keytype = "GENEID")

gene2sym <- gene2sym[gene2sym$GENEBIOTYPE == "protein_coding",]

gene2sym$Print <- str_c(gene2sym$SYMBOL,"/",gene2sym$GENEID)

Judge_GENESYMBOL <- function(ID = "TP53",gene2sym){
  
  # # 把其它的转化成GeneSymbol
  # ID <- c("FDX1","TP53","TP52","tp5")
  # gene2sym
  
  if(length(ID) == 1){
    
    # 先看单基因
    
    if(ID %in% gene2sym$SYMBOL){
      
      Results <- "Validated gene"
      
      cat(str_c("Validated gene: ",gene2sym$Print[match(ID,gene2sym$SYMBOL)]))
      
      return(FALSE)
      
    } else {
      
      Results <- "Invalidated gene"
      
      cat("Please input the correct gene symbol !")
      
      return(TRUE)
      
    }
    
  } else {
    
    # 再看多基因
    
    Validated_number <- ID %in% gene2sym$SYMBOL
    
    Rates <- round((length(ID) - sum(Validated_number))/length(ID)*100,2)
    
    if(Rates == 0){
      
      Results <- "Validated gene"
      
      cat("All validated !")
      
      return(FALSE)
      
    } else {
      
      Results <- "Part validated gene"
      
      cat(str_c("Overall ",Rates,"% cannot macth the gene symbol !\nplease check the followed genes:\n",
                str_c(ID[!Validated_number],collapse = "\n")))
      
      ID <- ID[Validated_number]
      
    }
    
  }
 
  return(ID)
  
}


# ==== Function module 2:  Single gene expression investigation ====    

dbGIST_boxplot_Risk <- function(ID,DB = dbGIST_matrix[RISK_ID]){
  
  # ID = "P4HA1"
  # 
  # DB = dbGIST_matrix[RISK_ID]
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Risk[match(colnames(DB[[i]]$Matrix),
                                                                    DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      #   p1
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Risk[match(colnames(DB[[i]]$Matrix),
                                                                      DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <-  ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  p1
  
  return(p1)
  
}

dbGIST_boxplot_Mutation_ID <- function(ID,DB = dbGIST_matrix[Mutation_ID]){
  
  #  ID = "ACTA2"
  # # 
  #  DB = dbGIST_matrix[Mutation_ID]
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Mutation[match(colnames(DB[[i]]$Matrix),
                                                                        DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Mutation[match(colnames(DB[[i]]$Matrix),
                                                                          DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Age <- function(ID,Cut_off = 65,DB = dbGIST_matrix[Age_ID]){
  
  # ID = "P4HA1"
  
  # DB = dbGIST_matrix[RISK_ID]
  
  for(i in 1){
    
    #   i = 2
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Risk[match(colnames(DB[[i]]$Matrix),
                                                                    DB[[i]]$Clinical$Sample_geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,notch = F,size = 0.4)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = 0.4,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              plot.title = element_text(hjust = 0.5,size = 14),
              axis.title.y = element_text(size=12),
              axis.text.x =element_text(size=12,angle = 45,hjust = 1),
              axis.title.x = element_blank()) # + 
      # stat_compare_means(comparisons = my_comparisons)
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Risk[match(colnames(DB[[i]]$Matrix),
                                                                      DB[[i]]$Clinical$Sample_geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,notch = F,size = 0.4)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = 0.4,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                plot.title = element_text(hjust = 0.5,size = 14),
                axis.title.y = element_text(size=12),
                axis.text.x =  element_text(size=12,angle = 45,hjust = 1),
                axis.title.x = element_blank()) # + 
        # stat_compare_means(comparisons = my_comparisons)
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Site <- function(ID,DB = dbGIST_matrix[Location_ID]){
  
  # ID = "P4HA1"
  
  # DB = dbGIST_matrix[Location_ID]
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Location[match(colnames(DB[[i]]$Matrix),
                                                                        DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Location[match(colnames(DB[[i]]$Matrix),
                                                                          DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Gender <- function(ID,DB = dbGIST_matrix[Gender_ID]){
  
  # ID = "P4HA1"
  # 
  # DB = dbGIST_matrix[Gender_ID]
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Gender[match(colnames(DB[[i]]$Matrix),
                                                                      DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Gender[match(colnames(DB[[i]]$Matrix),
                                                                        DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <-ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Stage <- function(ID,DB = dbGIST_matrix[Stage_ID]){
  
  # ID = "P4HA1"
  # 
  # DB = dbGIST_matrix[Gender_ID]
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Stage[match(colnames(DB[[i]]$Matrix),
                                                                     DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Stage[match(colnames(DB[[i]]$Matrix),
                                                                       DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <-ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Tumor_size <- function(ID,DB = dbGIST_matrix[Stage_ID]){
  
  # ID = "P4HA1"
  # 
  # DB = dbGIST_matrix[Gender_ID]
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Tumor_size[match(colnames(DB[[i]]$Matrix),
                                                                          DB[[i]]$Clinical$geo_accession)])
      
      p1_table$Clinical <- as.numeric(str_extract(p1_table$Clinical,"[0-9]+"))
      
      colnames(p1_table)[2] <- "ID2"
      
      P1_R <- cor.test(p1_table$ID,p1_table$ID2)
      
      ggsub <- str_c("r=",round(as.numeric(P1_R$estimate),2),",p=",round(as.numeric(P1_R$p.value),2))
      
      p1 <- ggplot(p1_table,aes(ID,ID2))+
        geom_point(size = 3,alpha = 0.7)  +  
        scale_color_lancet() + 
        theme_bw() + 
        stat_smooth(method='lm',formula = y~x)+
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        annotate("text",
                 x = min(p1_table$ID) + 0.7*(max(p1_table$ID) - min(p1_table$ID)),
                 y = min(p1_table$ID2) + 0.85*(max(p1_table$ID2) - min(p1_table$ID2)),
                 label = ggsub,
                 #   size = 5,
                 color = "darkred")+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank())
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Tumor_size[match(colnames(DB[[i]]$Matrix),
                                                                            DB[[i]]$Clinical$geo_accession)])
        
        p1_table$Clinical <- as.numeric(str_extract(p1_table$Clinical,"[0-9]+"))
        
        colnames(p1_table)[2] <- "ID2"
        
        P1_R <- cor.test(p1_table$ID,p1_table$ID2)
        
        ggsub <- str_c("r=",round(as.numeric(P1_R$estimate),2),",p=",round(as.numeric(P1_R$p.value),2))
        
        p2 <- ggplot(p1_table,aes(ID,ID2))+
          geom_point(size = 3,alpha = 0.7)  +  
          scale_color_lancet() + 
          theme_bw() + 
          stat_smooth(method='lm',formula = y~x)+
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          annotate("text",
                   x = min(p1_table$ID) + 0.7*(max(p1_table$ID) - min(p1_table$ID)),
                   y = min(p1_table$ID2) + 0.85*(max(p1_table$ID2) - min(p1_table$ID2)),
                   label = ggsub,
                   #   size = 5,
                   color = "darkred")+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank())
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Grade <- function(ID,DB = dbGIST_matrix[Stage_ID]){
  
  # ID = "P4HA1"
  # 
  #  DB = dbGIST_matrix[Tumor_grade_ID]
  
  for(i in 1){
    
    #  i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Tumor_grade[match(colnames(DB[[i]]$Matrix),
                                                                           DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Tumor_grade[match(colnames(DB[[i]]$Matrix),
                                                                             DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <-ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

dbGIST_boxplot_Metastatic_Primary <- function(ID,DB = dbGIST_matrix[Stage_ID]){
  
  # ID = "P4HA1"
  # 
  #  DB = dbGIST_matrix[Metastatic_Primary_ID]
  
  for(i in 1){
    
    #  i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Metastasis.Primary[match(colnames(DB[[i]]$Matrix),
                                                                                  DB[[i]]$Clinical$geo_accession)])
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = NA,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              axis.title.x = element_blank()) + stat_compare_means()
      
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Metastasis.Primary[match(colnames(DB[[i]]$Matrix),
                                                                                    DB[[i]]$Clinical$geo_accession)])
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p2 <-ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,alpha = 0.4,notch = F,size = 0.5)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = NA,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                axis.title.x = element_blank()) + stat_compare_means()
        
        p1 <- p1+p2
      } 
      
    }
    
  }
  
  return(p1)
  
}

# ==== Function module 3:  Expression corralation between genes  ====

dbGIST_cor_ID <- function(ID,
                          ID2,
                          DB = dbGIST_matrix){
  
  # ID = "P4HA1"
  # 
  # ID2 = "TP53"
  # 
  # DB = dbGIST_matrix
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix) & 
       ID2 %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             ID2 = as.numeric(DB[[i]]$Matrix[match(ID2,rownames(DB[[i]]$Matrix)),]))
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      P1_R <- cor.test(p1_table$ID,p1_table$ID2)
      
      ggsub <- str_c("r=",round(as.numeric(P1_R$estimate),2),",p=",round(as.numeric(P1_R$p.value),2))
      
      p1 <- ggplot(p1_table,
                   aes(ID,ID2)) + 
        geom_point(size = 3,
                   alpha = 0.6) + 
        #    scale_color_manual(values = c("#E13220","#3450A8")) + 
        theme_bw() + #ylim(c(-3,4.5)) + xlim(c(0,8)) +
        stat_smooth(method='lm',formula = y~x) +
        guides(fill = "none")+
        xlab(ID) +
        ylab(ID2)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        annotate("text",
                 x = min(p1_table$ID) + 0.7*(max(p1_table$ID) - min(p1_table$ID)),
                 y = min(p1_table$ID2) + 0.85*(max(p1_table$ID2) - min(p1_table$ID2)),
                 label = ggsub,
                 #   size = 5,
                 color = "darkred") +
        #scale_colour_manual(values = c("#E13220","#3450A8"))+
        theme(legend.position = 'none',
              panel.background = element_rect(fill = "#F3F6F6"),
              panel.border = element_rect(linewidth = 1.2),
              panel.grid.major = element_line(colour = "#DEE2E4",
                                              linewidth = 1.0,
                                              linetype = "dashed"),
              plot.title = element_text(hjust = 0.5,
                                        size = 14,
                                        colour = "darkred",
                                        face = "bold"),
              axis.title.y = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.title.x = element_text(size=12,
                                          colour = "darkred",
                                          face = "bold"),
              axis.text.x =element_text(size=12,
                                        angle = 45,
                                        hjust = 1,
                                        #  colour = "black",
                                        face = "bold"),
              axis.text.y = element_text(size=10,
                                         #  colour = "black",
                                         face = "bold"),
              legend.text = element_text(size = 11),
              legend.title = element_text(size = 13),
              plot.margin = unit(c(0.4,0.4,0.4,0.4),'cm'))
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      #   i = 2
      
      if(ID %in% rownames(DB[[i]]$Matrix) & 
         ID2 %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               ID2 = as.numeric(DB[[i]]$Matrix[match(ID2,rownames(DB[[i]]$Matrix)),]))
        
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        P1_R <- cor.test(p1_table$ID,p1_table$ID2)
        
        ggsub <- str_c("r=",round(as.numeric(P1_R$estimate),2),",p=",round(as.numeric(P1_R$p.value),2))
        
        p2 <- ggplot(p1_table,
                     aes(ID,ID2)) + 
          geom_point(size = 3,
                     alpha = 0.6) + 
          #    scale_color_manual(values = c("#E13220","#3450A8")) + 
          theme_bw() + #ylim(c(-3,4.5)) + xlim(c(0,8)) +
          stat_smooth(method='lm',formula = y~x) +
          guides(fill = "none")+
          xlab(ID) +
          ylab(ID2)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          annotate("text",
                   x = min(p1_table$ID) + 0.7*(max(p1_table$ID) - min(p1_table$ID)),
                   y = min(p1_table$ID2) + 0.85*(max(p1_table$ID2) - min(p1_table$ID2)),
                   label = ggsub,
                   #   size = 5,
                   color = "darkred") +
          #scale_colour_manual(values = c("#E13220","#3450A8"))+
          theme(legend.position = 'none',
                panel.background = element_rect(fill = "#F3F6F6"),
                panel.border = element_rect(linewidth = 1.2),
                panel.grid.major = element_line(colour = "#DEE2E4",
                                                linewidth = 1.0,
                                                linetype = "dashed"),
                plot.title = element_text(hjust = 0.5,
                                          size = 14,
                                          colour = "darkred",
                                          face = "bold"),
                axis.title.y = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.title.x = element_text(size=12,
                                            colour = "darkred",
                                            face = "bold"),
                axis.text.x =element_text(size=12,
                                          angle = 45,
                                          hjust = 1,
                                          #  colour = "black",
                                          face = "bold"),
                axis.text.y = element_text(size=10,
                                           #  colour = "black",
                                           face = "bold"),
                legend.text = element_text(size = 11),
                legend.title = element_text(size = 13),
                plot.margin = unit(c(0.4,0.4,0.4,0.4),'cm'))
        
        p1 <- p1 + p2
        
      } 
      
    }
    
    
  }
  
  return(p1)
  
}

# ==== Function module 4:  Exploration of the drug-resistent gene ====

dbGIST_boxplot_Drug <- function(ID,DB = dbGIST_matrix[IM_ID]){
  
  # ID = "MCM7"
  # 
  #  DB = dbGIST_matrix[IM_ID]
  # 
  #  i = 1
  
  for(i in 1){
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                             Clinical = DB[[i]]$Clinical$Imatinib[match(colnames(DB[[i]]$Matrix),
                                                                        DB[[i]]$Clinical$geo_accession)])
      
      p1_table <- na.omit(p1_table)
      p1_table <- p1_table[p1_table$Clinical != "NA",]
      
      #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
      
      p1 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
        geom_boxplot(outlier.colour = NA,notch = F,size = 0.4)+
        geom_jitter(shape = 21,size=2,width = 0.2) + 
        geom_violin(position = position_dodge(width = .75), 
                    size = 0.4,alpha = 0.4,trim = T) + 
        scale_fill_lancet() + 
        theme_bw() + 
        xlab("Risk") +
        ylab(ID)+ 
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        theme(legend.position = 'none',
              plot.title = element_text(hjust = 0.5,size = 14),
              axis.title.y = element_text(size=12),
              axis.text.x =element_text(size=12,angle = 45,hjust = 1),
              axis.title.x = element_blank()) # + 
      # stat_compare_means(comparisons = my_comparisons)
      
      p1_roc <- roc(p1_table$Clinical,p1_table$ID)
      tt <- p1_roc
      tp <- tt$sensitivities%>%as.data.frame()
      fp <- (1-tt$specificities)%>%as.data.frame()
      dd <- data.frame(fp = fp,tp = tp);colnames(dd) <- c("fp","tp")
      dd <- dd %>% arrange(desc(fp), tp)
      
      ggsub <- str_c("AUC: ",round(p1_roc$auc,2))
      
      p2 <- ggplot(dd,aes(fp,tp))+
        geom_line(size=1)+
        labs(x='1-Specificity',y='Sensitivity',color=NULL) +
        theme_bw(base_rect_size = 1.5)+
        geom_abline(slope = 1,color='grey70')+
        ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
        annotate("text",
                 x = 0.7,
                 y = 0.2,
                 label = ggsub,
                 #   size = 5,
                 color = "darkred")+
        theme(plot.title = element_text(hjust = 0.5,size = 14),
              axis.text = element_text(size=11),
              axis.title = element_text(size=13),
              legend.text = element_text(size=12),
              legend.position = c(0.995,0.012),
              legend.justification = c(1,0))+
        scale_color_nejm()+
        scale_x_continuous(expand = c(0.01,0.01))+
        scale_y_continuous(expand = c(0.01,0.01))
      
    } 
    
  }
  
  if(length(DB) > 1){
    
    for(i in 2:length(DB)){
      
      if(ID %in% rownames(DB[[i]]$Matrix)){
        
        p1_table <- data.frame(ID = as.numeric(DB[[i]]$Matrix[match(ID,rownames(DB[[i]]$Matrix)),]),
                               Clinical = DB[[i]]$Clinical$Imatinib[match(colnames(DB[[i]]$Matrix),
                                                                          DB[[i]]$Clinical$geo_accession)])
        
        
        p1_table <- na.omit(p1_table)
        #  my_comparisons <- list(c("Hypo-ICD","Hyper-ICD"))
        
        p3 <- ggplot(p1_table,aes(Clinical,ID,fill=Clinical))+
          geom_boxplot(outlier.colour = NA,notch = F,size = 0.4)+
          geom_jitter(shape = 21,size=2,width = 0.2) + 
          geom_violin(position = position_dodge(width = .75), 
                      size = 0.4,alpha = 0.4,trim = T) + 
          scale_fill_lancet() + 
          theme_bw() + 
          xlab("Risk") +
          ylab(ID)+ 
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          theme(legend.position = 'none',
                plot.title = element_text(hjust = 0.5,size = 14),
                axis.title.y = element_text(size=12),
                axis.text.x =element_text(size=12,angle = 45,hjust = 1),
                axis.title.x = element_blank()) # + 
        # stat_compare_means(comparisons = my_comparisons)
        
        p1_roc <- roc(p1_table$Clinical,p1_table$ID)
        tt <- p1_roc
        tp <- tt$sensitivities%>%as.data.frame()
        fp <- (1-tt$specificities)%>%as.data.frame()
        dd <- data.frame(fp = fp,tp = tp);colnames(dd) <- c("fp","tp")
        dd <- dd %>% arrange(desc(fp), tp)
        
        ggsub <- str_c("AUC: ",round(p1_roc$auc,2))
        
        p4 <- ggplot(dd,aes(fp,tp))+
          geom_line(size=1)+
          labs(x='1-Specificity',y='Sensitivity',color=NULL) +
          theme_bw(base_rect_size = 1.5)+
          geom_abline(slope = 1,color='grey70')+
          ggtitle(str_c(DB[[i]]$ID,"(n = ",ncol(DB[[i]]$Matrix),")"))+
          annotate("text",
                   x = 0.7,
                   y = 0.2,
                   label = ggsub,
                   #   size = 5,
                   color = "darkred")+
          theme(plot.title = element_text(hjust = 0.5,size = 14),
                axis.text = element_text(size=11),
                axis.title = element_text(size=13),
                legend.text = element_text(size=12),
                legend.position = c(0.995,0.012),
                legend.justification = c(1,0))+
          scale_color_nejm()+
          scale_x_continuous(expand = c(0.01,0.01))+
          scale_y_continuous(expand = c(0.01,0.01))
        
        
      } 
      
    }
    
  }
  
  # Arrange plots in a 2x2 grid with patchwork
  combined_plot <- (p1 + p2) / (p3 + p4)
  return(combined_plot)
  
}

# ==== Function module 5:  Exploration of the pre|post treatment gene ====

dbGIST_boxplot_PrePost <- function(ID,Mutation = "All",DB = dbGIST_matrix[Post_pre_treament_ID]){
  
  # ID = "P4HA1"
  # 
  # DB = dbGIST_matrix[RISK_ID]
  
  
  for(i in 1){
    
    #   i = 1
    
    if(ID %in% rownames(DB[[i]]$Matrix)){
      
      Speci_GSE_cli2 <- DB[[i]]$Clinical[-c(1,6,7,22,23,36,37,40,41,42,43,44,45,46,47,50,53,54),]
      
      if(Mutation == "All"){
        
        Speci_GSE_cli2 <-  Speci_GSE_cli2
        
      } else {
        
        if(Mutation == "KIT"){
          
          Speci_GSE_cli2 <- Speci_GSE_cli2[which(Speci_GSE_cli2$Mutations == "KIT"),]
          
        } else {
          
          if(Mutation == "WT"){
            
            Speci_GSE_cli2 <- Speci_GSE_cli2[which(Speci_GSE_cli2$Mutations == "WT"),]
            
          }
          
        }
        
      }
      
      p1_table <- data.frame(Gene = as.numeric(DB[[i]]$Matrix[which(rownames(DB[[i]]$Matrix) == ID),
                                                              match(Speci_GSE_cli2$geo_accession,colnames(DB[[i]]$Matrix))]),
                             Type = Speci_GSE_cli2$Type,
                             Group = Speci_GSE_cli2$Group)
      p1 <-  ggpaired(p1_table, 
                      x = 'Type',
                      y = 'Gene',
                      id='Group',
                      fill = "Type", palette = "jco") + 
        stat_compare_means(method = "t.test",paired = TRUE) + 
        ylab(ID)
      
      
      #   p1
      
    } 
    
  }
  
  return(p1)
  
}



# ==== Usage 1:  Check the Gene symbol ====   

Input_Single_gene <- c("KIT","M7")

ID <- Judge_GENESYMBOL(ID = Input_Single_gene,gene2sym)

ID <- "MCM"

ID <- Judge_GENESYMBOL(ID = ID,gene2sym)

# ==== Usage 2:  Single gene expression investigation ==== 

ID = "MCM7"

dbGIST_boxplot_Gender(ID = ID, DB = dbGIST_matrix[Gender_ID])

# ==== Usage 3:  Expression corralation between genes ==== 

ID = "MCM7"; ID2 = "MKI67"

dbGIST_cor_ID(ID = ID,ID2 = ID2,DB = dbGIST_matrix[mRNA_ID])

# ==== Usage 4:  Exploration of the drug-resistent gene ====

ID = "MCM7"

dbGIST_boxplot_Drug(ID = ID,DB = dbGIST_matrix[IM_ID])


# ==== Usage 5:  Exploration of the pre|post treatment gene ====

ID = "MCM7"

dbGIST_boxplot_PrePost(ID,Mutation = "All",DB = dbGIST_matrix[Post_pre_treament_ID])
