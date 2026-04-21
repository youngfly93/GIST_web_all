**Title**

**dbGIST: A Single Gene Multi-Omics Functional Exploration Platform based on Al-enhanced Conversational Technology for Gastrointestinal stromal tumors**

**Author:**

Zhao Sun+, Qian Zhao+, Jiehan Li+, Jiajing Li+, Hao Liu, Yadong Tang, Fei Yang, XXX, Chao Liu\*, ShengLei Li\*, Jinghua Yang\*, Yang Fu\*

**Abstract**

Incremental evidence on the effect of cold atmospheric plasma (CAP) inspecifically killing transformed cells and advances in sequencing technologies at multiple omics have led to the demand of in‐depth exploration on the mechanisms of action driving the potency of CAP against cancer cells at the molecular level. However, high‐throughput data detailing the effect of CAP on cancer cells is lacking, let alone the corresponding database and analytical tool. Here, we sequenced the whole transcriptome, proteome, phosphorylome, acetylome, and lactylome of transformed cells in response to CAP using breast cancer cells as the disease model; and advanced our previously developed Hiplot platform by establishing a focus‐driven tumor‐specific module, namely CAP medicine in breast cancer (CAPmed‐BC) (<https://capbc.hiplot.com.cn>). CAPmed‐BC is the first multi‐omics data resource in plasma medicine for analyzing the treatment response of breast cancer cells to CAP. It can analyze each type of omics data regarding differentially expressed biomarkers, expression landscape, gene ontology analysis, pathway interpretation, gene set enrichment analysis, and protein‐protein interaction network. It can also interrogate the dynamic fluctuation, functional activity, and metabolic vulnerability of cancer cells in response to CAP by combinatorially analyzing

omics at multiple carefully defined dimensions. We also built in a visualization module to support users for producing personalized graphs via adjusting parameters. We believe that CAPmed‐BC will become a valuable resource for characterizing the outcome of CAP on breast cancers at the omics and molecular levels, and make considerable contributions to both plasma medicine and oncology.

**Highlights:**

1. dbGIST displayed an application of Al-enhanced Conversational Technology in data resource sharing and bioinformatics analysis, which provides an available and reproducible framework for researchers.
2. dbGIST is the first gastrointestinal stromal tumors reservoir based on multi-level omics data including genomics, transcriptome, proteome, phosphorylome, single-cell transcriptome generated from 21 published studies and 2 in-house proteomics and single cell sequencing dataset.
3. dbGIST can be used to capture the user input gene’s clinical associations, treatment response, involving pathways, related genes.
4. dbGIST confirms MCM7 is a robust biomarker for GISTs, which was further validated by in-vitro experiments.

**Introduction**

Gastrointestinal stromal tumors (GISTs), the most common mesenchymal neoplasms of the gastrointestinal tract, are characterized by low incidence (1–2 per 100,000 individuals) and high heterogeneity in clinical behavior and molecular profiles. Historically, in the pre-imatinib era, surgical resection was the primary treatment modality due to GISTs' inherent resistance to conventional radiotherapy and chemotherapy. Despite curative-intent surgery, a significant subset of patients experienced recurrence or metastasis, leading to poor prognoses. The advent of imatinib, a tyrosine kinase inhibitor targeting the driver mutation KIT, marked a landmark breakthrough in GIST management, establishing GISTs as a paradigm for targeted therapy in solid tumors. Nevertheless, primary and secondary resistance to imatinib remains a major clinical challenge, with resistance mechanisms involving KIT/PDGFRA secondary mutations, metabolic reprogramming, and activation of alternative signaling pathways (e.g., FGF-2/FGFR, insulin receptor). Elucidating these molecular mechanisms and identifying druggable targets demand concerted research efforts.

Molecular-driven precision oncology relies heavily on accessible and integrated multi-omics data. Notably, GISTs have been excluded from major cancer genomics initiatives such as The Cancer Genome Atlas (TCGA) and the International Cancer Genome Consortium (ICGC). Consequently, widely used computational platforms (e.g., GEPIA2, TIMER2) lack GIST-specific data, limiting their utility for this malignancy. The absence of large-scale, unified GIST consortia has further fragmented available omics resources, confining studies to small, center-specific cohorts that impede robust cross-dataset validation of target molecules. Although recent efforts have generated genomic, proteomic, phosphoproteomic, and single-cell transcriptomic data for GISTs, these resources remain dispersed and underutilized. (如果有需要，这一部分可以展开大概100词) Integrating public datasets with newly generated omics profiles could bridge this gap, enabling systematic evaluation of drug targets across molecular dimensions.

To address these limitations, we established dbGIST (http://www.dbgist.org), the first open-access platform for integrated analysis of GIST multi-omics data. We aggregated data from 34 centers encompassing ~2,000 patients and supplemented public resources with 10 deep-coverage proteomic profiles and 6 single-cell transcriptomic datasets. The platform harmonizes five omics layers—genomics, whole transcriptomics, proteomics, phosphoproteomics, and single-cell transcriptomics—alongside manually curated clinical annotations spanning >12 categories (e.g., survival outcomes, mutation status, imatinib resistance). dbGIST facilitates user-friendly online analyses, including: Molecular-clinical association, Survival analysis, Correlation landscapes, Pathway enrichment, Immune infiltration, Drug sensitivity prediction, etc. A pioneering feature is an AI-driven conversational interface that automates interpretation of analytical results and provides real-time, dialogue-based troubleshooting. This innovation significantly lowers barriers for non-bioinformaticians and accelerates discovery throughput. By centralizing and contextualizing fragmented GIST data, dbGIST empowers the research community to prioritize resistance targets, validate biomarkers, and advance precision therapeutics for this heterogeneous malignancy.

**Methods**

**Data collection**

ChatGIST focuses on identifying robust biomarkers for gastrointestinal stromal tumors (GIST) through large‑scale, multi‑source data integration. We systematically retrieved GIST datasets that include expression profiles together with key clinical annotations (e.g., survival, therapy, mutation). Data sources include public repositories (GEO, ArrayExpress, iProX, cBioPortal) and in‑house ZZU cohorts. Detailed accession IDs, platforms, and clinical variables are listed in Supplementary Table 1.

**Data re‑annotation and pre‑processing**

For microarray data, raw intensities were processed by robust multi‑array average (RMA). Probe‑to‑gene mapping was harmonized to current gene symbols using EnsDb.Hsapiens.v75 together with AnnotationDbi to minimize cross‑platform inconsistencies. Where applicable, RNA‑seq counts were transformed to log2‑scaled TPM or variance‑stabilized values. For cross‑study visualization and modeling, expression matrices were standardized gene‑wise to Z‑scores using base::scale.

**Human subjects**

The in‑house ZZU GIST cohort was collected at the First Affiliated Hospital of Zhengzhou University. All procedures were approved by the Ethics Committee of the First Affiliated Hospital of Zhengzhou University (Approval No.: 2023‑KY‑0353‑003). Written informed consent was obtained from all participants.

**In‑house ZZU proteomics**

All tissues and cell lines were lysed in RIPA buffer (Merck) with protease and phosphatase inhibitors. Lysates were centrifuged and quantified (BCA, Beyotime). Equal protein amounts were precipitated with pre‑cooled acetone (−80 °C), re‑dissolved in 25 mM ammonium bicarbonate, and digested with trypsin. Peptides were desalted (Sep‑Pak C18, Waters), vacuum‑dried, re‑dissolved in 0.1% formic acid, and quantified (Pierce colorimetric kit). LC‑MS/MS was performed on EASY‑nLC1200 coupled to Q Exactive HF‑X (Thermo Fisher Scientific). Raw files were searched against the human UniProt database using Proteome Discoverer (v2.4) with trypsin/P specificity, variable M‑oxidation and N‑terminal acetylation, and 1% FDR.

**In‑house ZZU single‑cell sequencing**

Where single‑cell data were available, samples were collected under the same IRB approval and processed following standard 10x Genomics pipelines. Quality control, normalization, dimensionality reduction, clustering, and annotation followed widely adopted best practices. In deployment, the single‑cell Shiny module primarily uses precomputed images/results to minimize runtime memory, consistent with the current server configuration.

**Data calculation and storage**

All curated expression matrices and metadata are stored as versioned R objects (RDS/RData) for reproducible analysis and efficient loading within the ChatGIST Shiny platform (e.g., an integrated transcriptomics object such as dbGIST_matrix_*.rds/RData). Manifests and serialized files ensure consistency across modules and environments.


**Implementation (Shiny platform and AI assistance)**

All analyses are exposed through the ChatGIST R Shiny platform with AI‑assisted interpretation. AI can be toggled in the UI and configured via the environment variable ENABLE_AI_ANALYSIS. Each omics module runs as an independent Shiny app; AI and basic modes can be launched separately when needed. This work focuses on analytical functionality rather than deployment details; operational routing and logging are handled by standard web‑serving practices in our environment.

Homepage assistants. The homepage first exposes lightweight assistants that complement analytics with AI‑assisted knowledge retrieval. The GIST AI Assistant is a large‑language‑model chat interface (supporting streaming responses and optional image input) configured via provider‑agnostic back‑end adapters and constrained to educational, GIST‑focused guidance. The Gene Screening Assistant helps select candidate genes and composes domain‑specific literature queries (e.g., PubMed‑style strings in a GIST context) for rapid evidence review.

GIST Data Analysis (six categories). The analysis workbench then organizes six categories: Genomics quick‑query (launches multi‑cohort cBioPortal OncoPrint for user‑entered genes), Transcriptomics (independent R/Shiny back‑end with optional AI mode), Proteomics (independent R/Shiny back‑end), Post‑translational Modification Omics (independent R/Shiny back‑end), Single‑cell Transcriptomics (independent R/Shiny back‑end), and Non‑coding RNA query (miRNA/lncRNA/circRNA aggregations with links to miRTarBase/miRBase/circBank/LNCipedia and RNAInter fallback). Four of the six categories are powered by standalone R/Shiny services (Transcriptomics/Proteomics/PTM/Single‑cell) with an AI toggle; the two quick‑query categories focus on external knowledge retrieval or lightweight internal utilities. All assistants and analysis modules are read‑only and do not alter underlying results.

**Module‑level analyses and methods**

Transcriptomics. We integrate whole‑transcriptome profiles across multiple cohorts and harmonize clinical annotations (imatinib response, KIT/PDGFRA mutation status, tumor site, stage, risk index, tumor size/grade, mitotic count, pre/post‑treatment, and, when available, CD117/Ki‑67). Gene identifiers are standardized to current symbols. Beyond clinical trait comparisons with appropriate two‑ or multi‑group tests and effect sizes, this module implements immune‑related analyses, including multi‑algorithm immune‑cell infiltration estimates (CIBERSORT/CIBERSORT‑ABS, EPIC, MCP‑counter, xCell, ESTIMATE) summarized per cohort and correlated with a user‑selected gene, as well as immunomodulator correlation maps that relate the target gene to curated categories (antigen presentation, immunoinhibitors, immunostimulators, chemokines, and receptors). Drug‑response and resistance analyses are also supported: gene–drug association heatmaps are derived from cross‑cohort correlations between gene expression and machine‑learned drug sensitivity predictions (via oncoPredict models trained on GDSC2/CTRP2 resources), with optional pre‑/post‑treatment contrasts and response‑label discrimination (ROC) when labels are available. A single‑gene Cancer‑Immunity Cycle (CIC) view summarizes step‑level association scores derived from precomputed CIC step metrics and the target gene, shown as heatmap or radar plots. Cross‑cohort correlation summaries for gene–gene and gene–phenotype relationships are provided; survival (KM/Cox) is available when endpoints exist. Outputs include publication‑ready box/violin plots, correlation heatmaps/scatter, infiltration/modulator circular or matrix heatmaps, CIC summaries, pathway bar/ridge plots, ROC curves, and KM plots.

Proteomics. We analyze protein abundance matrices alongside curated gene‑set resources (KEGG and MSigDB Hallmark). The module supports clinical feature comparisons (tumor vs normal, risk, gender, age, tumor size, mitotic count, location, WHO grade, Ki‑67, CD34, and mutation), correlation landscapes between proteins and study indices, and functional interpretation via ORA across GO/KEGG/Reactome as well as GSEA on correlation‑ranked lists with multiple‑testing control. Drug response (imatinib) can be explored, including ROC‑based discrimination when labels are available, and survival associations (KM/Cox) are reported when outcomes are recorded. Outputs comprise clinical comparison panels, correlation maps, pathway heatmaps/ridge plots, ROC curves, and KM plots.

Phosphoproteomics. Using phosphosite‑level quantification mapped to parent proteins and clinical metadata, this module enables phosphorylation‑site query and targeted selection, tumor–normal contrasts, and subgroup analyses (risk, sex, age, location, WHO grade, mutation, tumor size, and mitotic count), with imatinib response when available. It further supports survival analyses at the site/protein level and ROC‑based discrimination where appropriate. Outputs include interactive site tables, comparison plots, KM curves, ROC curves, and exportable figures.

Single‑cell transcriptomics. Single‑cell expression is presented via precomputed UMAP and violin panels with harmonized cell‑type annotations, with optional on‑demand gene utilities. Analyses summarize gene‑level distributions across cell types/states and spatial embeddings (UMAP in cell‑type and gene‑expression modes). Outputs are optimized for lightweight, fast rendering, with optional AI‑assisted summaries.



**Statistical and computational frameworks**

Across modules, we adopt consistent statistical and functional analysis practices. Differential/group comparisons use appropriate parametric or non‑parametric tests (e.g., t‑test, Wilcoxon; ANOVA/Kruskal–Wallis for multi‑group), with multiple‑testing control by Benjamini–Hochberg FDR where applicable. Functional interpretation relies on over‑representation analysis and ranked‑list enrichment (e.g., enrichGO/enrichKEGG and GSEA) with visualizations via enrichplot and related tooling; pathway activity may be summarized by single‑sample scores (e.g., ssGSEA) using curated MSigDB collections and, where applicable, WikiPathways. Correlation analyses use Spearman by default; Pearson is applied for specific immune correlation visualizations. Immune infiltration features are estimated using deconvolution/marker‑based algorithms (CIBERSORT/CIBERSORT‑ABS, EPIC, MCP‑counter, xCell, ESTIMATE) and summarized at the cohort level. Drug sensitivity predictions are obtained via oncoPredict models parameterized on GDSC2/CTRP2 resources; gene‑drug associations are computed as cross‑sample correlations and summarized across cohorts. Survival associations, when outcomes are available, follow established Kaplan–Meier/Cox procedures.


**Results**

**Overview of dbGIST**

dbGIST is an open-access, GIST-focused multi-omics analytics platform. It harmonizes genomics, whole-transcriptomics, proteomics, phosphoproteomics, and single‑cell transcriptomics across public cohorts and in‑house datasets, and exposes reproducible analyses via four R/Shiny modules (Transcriptome, Proteome, Phosphoproteome, Single‑cell) and homepage assistants (AI chat, gene screening, genomics quick‑query, non‑coding RNA query). Results are displayed as publication‑ready figures without bullet‑list formatting.

**Case study: MCM7 across multi‑omics in GIST**

Transcriptome: immune infiltration and immunomodulators. We computed per‑dataset immune‑cell scores using multiple deconvolution families (CIBERSORT/CIBERSORT‑ABS, EPIC, MCP‑counter, xCell, ESTIMATE) and correlated them with MCM7. Signals vary by cohort and algorithm, but several patterns recur: endothelial and stromal signatures frequently show negative associations, while tumor purity tends to be positive. For example, Endothelial (EPIC) is negatively associated in multiple datasets (e.g., r≈−0.30 in GSE15966, r≈−0.57 in GSE8167; nominal p<0.05 in several cohorts), StromalScore (ESTIMATE) is negative in GSE8167 (r≈−0.45; p≈0.009) and GSE15966 (r≈−0.37; p≈0.005), whereas TumorPurity is often positive (e.g., GSE15966 r≈0.39; GSE51697 r≈0.53; both nominal p<0.05). T‑cell metrics differ across algorithms and cohorts; for instance, CD8 T cells (EPIC) are negatively associated in several cohorts and reach nominal significance in EMTAB373 (r≈−0.32; p≈0.012). Immunomodulator analyses (category gene sets) show that MCM7 is frequently negative with antigen‑presentation HLA genes and selected checkpoints across cohorts (e.g., HLA‑A r≈−0.52 in GSE8167; HLA‑B r≈−0.54 in GSE8167; CD274/PD‑L1 r≈−0.30 in GSE132542), though exceptions exist. Full correlation and p‑value matrices are provided in the exported tables accompanying the figures.

![](GIST_Transcriptome/Immune_infiltration/results/fig4b_multiAlg_gene_MCM7.png)

![](GIST_Transcriptome/Immune_infiltration/results/fig4c_MCM7.png)

Transcriptome: gene–drug associations via oncoPredict. Using oncoPredict models parameterized on GDSC2/CTRP2, we correlated cohort‑level predicted drug response with MCM7 expression. Positive correlations in our export indicate higher predicted response metric and thus putative resistance; negatives suggest putative sensitivity. Cross‑cohort positive associations are repeatedly observed for Doramapimod (e.g., EMTAB373 r≈0.565; GSE132542 r≈0.508; GSE136755 r≈0.444), PCI‑34051 (EMTAB373 r≈0.462; GSE132542 r≈0.540; GSE136755 r≈0.543), AZD5438 (EMTAB373 r≈0.247; GSE132542 r≈0.483; GSE136755 r≈0.520), and BMS‑754807 (EMTAB373 r≈0.470; GSE132542 r≈0.641). Gefitinib shows modest positive associations (EMTAB373 r≈0.217; GSE136755 r≈0.406; GSE132542 r≈0.183). Selected agents exhibit negative associations in particular cohorts, including MG‑132 (GSE132542 r≈−0.599) and Vorinostat (GSE132542 r≈−0.393), while others vary by dataset (e.g., Oxaliplatin EMTAB373 r≈0.249 vs. GSE132542 r≈−0.072). These associations are shown in the fixed‑subset heatmap and detailed in the exported correlation table per dataset (see paths under onco_mrna_exports).

![](GIST_Transcriptome/Immune_infiltration/results/onco_mrna_exports/gene_drug_heatmap_MCM7_subset_fixed.png)

Single‑cell transcriptomics. Precomputed UMAP and violin panels across three datasets (GSE162115, GSE254762, and an in‑house cohort) display the cell‑type distribution and expression gradients of MCM7 across annotated compartments. These views complement bulk associations by localizing expression at single‑cell resolution and visually separating tumor/immune/stromal compartments in the embedding.

![](GIST_SingleCell/www/precomputed/umap_MCM7_GSE162115_ssc.png)
![](GIST_SingleCell/www/precomputed/violin_MCM7_GSE162115_ssc.png)

![](GIST_SingleCell/www/precomputed/umap_MCM7_GSE254762_ssc.png)
![](GIST_SingleCell/www/precomputed/violin_MCM7_GSE254762_ssc.png)

![](GIST_SingleCell/www/precomputed/umap_MCM7_In_house_ssc.png)
![](GIST_SingleCell/www/precomputed/violin_MCM7_In_house_ssc.png)

Additional analyses. The platform also supports correlation‑ranked enrichment (ORA/GSEA) in proteome/transcriptome, Cancer‑Immunity Cycle (CIC) step‑level association summaries for single genes, and ROC/KM where labels or outcomes exist. These follow the computation settings specified in Methods; we omit figures for brevity but provide exports alongside the application.

**Proteome (protein‑level)**

Proteomics co‑variation (Sun et al. cohort). We leveraged the precomputed MCM7 protein‑level correlation cache (GIST_Protemics/correlation_cache/Sun_s_Study_MCM7_50_50.RDS), which stores the top 50 positively and 50 negatively co‑varying proteins. The positive set is enriched for DNA replication/cell‑cycle machinery, beginning with MCM6/MCM3/MCM5 and replication‑linked factors (e.g., FRYL, RRM2B, FDPS, CCND2), while the negative set contains stromal/endothelial or differentiation‑linked proteins (e.g., EMD, PML, LGALS1, GSTM2, LRRC58, CLIC2, RASAL2, PGM5). These lists provide a robust basis for downstream enrichment (Hallmark/KEGG) and mechanistic interpretation, consistent with MCM7’s role in replication licensing. We include the full 50/50 lists and correlation ranks in Supplementary, and the Proteomics module renders correlation heatmaps and group comparisons on demand.

**Phosphoproteome (site‑level)**

Survival‑linked phosphosites and coverage of MCM7. In the integrated phosphoproteomics survival screen, we did not detect MCM7‑mapped phosphosites meeting inclusion in the consolidated survival list (no "MCM7/..." rows in survival_sites_ok.csv). To demonstrate module capability and provide biological context, we report representative sites with both OS and PFS significance (survival_sites_ok.csv), including HSPB1/S15 and S82, VIM/S56, LMNA/S22, BAD/S99, HSPB6/S16, and notably MCM2/S27 from the same licensing complex. For each site, the Phosphoproteomics module supports cohort‑level box/violin summaries and Kaplan–Meier/ROC utilities; figures and per‑site statistics are exportable from the app. This highlights pathway‑level coherence around replication stress and cytoskeletal remodeling even where MCM7 phosphorylation itself is not covered in the current datasets.

**Discussion**

As an interactive web tool, BEST aims to explore the clinical significance and biologi

cal functions of cancer biomarkers through large-scale data. Therefore, data richness is

the foundation of BEST. From data collection, re-annotation, pre-processing, and pre

calculation to storage, we provide a tidy and uniform pan-cancer database, allowing

users to call and interpret data quickly. BEST offers prevalent analysis modules to enable

researchers without computational programming skills to conduct various bioinformat

ics analyses. Compared with other available tools [5–8, 34–36], BEST has more datasets

and more diverse analysis options, which complements well with them (Table 1).

In BEST web application, users can identify cancer biomarkers associated with criti

cal clinical traits (e.g., stage and grade), prognosis, and immunotherapy. Moreover, the

underlying mechanisms of these biomarkers could be further explored using the enrich

ment, cell infiltration, and immunomodulator analysis modules. Users can also apply the

candidate agent analysis tab to investigate high levels of cancer biomarkers that might

indicate which drugs are resistant and which are sensitive to specific cancer.

Taken together, BEST provides a curated database and innovative analytical pipelines

to explore cancer biomarkers at high resolution. It is an easy-to-use and time-saving web

tool that allows users, especially clinicians and biologists without background knowl

edge of bioinformatics data mining, to comprehensively and systematically explore the

clinical significance and biological function of cancer biomarkers. With constant user

feedback and further improvement, BEST is promising to serve as an integral part of

routine data analyses for researchers.