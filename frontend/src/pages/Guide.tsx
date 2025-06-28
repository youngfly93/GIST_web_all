import React from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Search, 
  Database, 
  BarChart3, 
  Dna,
  Zap,
  Rss,
  ArrowRight,
  Info,
  Play,
  Target
} from 'lucide-react';

const Guide: React.FC = () => {
  return (
    <div className="guide-container">
      <div className="guide-header">
        <BookOpen size={48} className="guide-icon" />
        <h1>User Guide</h1>
        <p>Learn how to use the various features of the GIST AI platform</p>
      </div>

      <div className="guide-content">
        {/* Quick Start */}
        <section className="guide-section">
          <div className="section-header">
            <Play size={24} />
            <h2>Quick Start</h2>
          </div>
          <div className="guide-cards">
            <div className="guide-card">
              <div className="card-icon">
                <MessageCircle size={32} />
              </div>
              <h3>1. AI Assistant</h3>
              <p>Find the "GIST AI Assistant" module on the left side of the homepage to directly chat with AI and learn GIST-related knowledge. Supports Q&A in multiple languages, you can ask about gene functions, disease mechanisms, etc.</p>
              <div className="guide-tip">
                <Info size={16} />
                <span>Tip: Try asking "What is GIST?" or "What is the function of the KIT gene?"</span>
              </div>
            </div>

            <div className="guide-card">
              <div className="card-icon">
                <Search size={32} />
              </div>
              <h3>2. Gene Screening</h3>
              <p>In the "GIST Gene Screening" module on the right side of the homepage, enter gene names (such as KIT, TP53) for quick queries, or use the AI assistant to get gene recommendations.</p>
              <div className="guide-tip">
                <Info size={16} />
                <span>Tip: You can click quick tags or use the AI assistant to get gene suggestions</span>
              </div>
            </div>

            <div className="guide-card">
              <div className="card-icon">
                <BarChart3 size={32} />
              </div>
              <h3>3. Data Analysis</h3>
              <p>In the "GIST Data Analysis" area at the bottom of the page, select different omics analysis modules for professional data analysis and visualization.</p>
              <div className="guide-tip">
                <Info size={16} />
                <span>Tip: Genomics and transcriptomics modules are available, other modules are under development</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Details */}
        <section className="guide-section">
          <div className="section-header">
            <Target size={24} />
            <h2>Feature Details</h2>
          </div>

          {/* AI Assistant */}
          <div className="feature-guide">
            <div className="feature-header">
              <MessageCircle size={28} />
              <h3>AI Assistant</h3>
            </div>
            <div className="feature-content">
              <div className="feature-description">
                <h4>Feature Introduction</h4>
                <p>Based on advanced AI technology, provides professional Q&A services related to GIST. Can answer various questions about gene functions, disease mechanisms, treatment plans, etc.</p>

                <h4>How to Use</h4>
                <ol>
                  <li>Enter your question in the chat box</li>
                  <li>Click the send button or press Enter</li>
                  <li>AI will provide detailed professional answers</li>
                  <li>You can continue to ask follow-up or related questions</li>
                </ol>

                <h4>Example Questions</h4>
                <ul>
                  <li>"What are the main pathogenic genes of GIST?"</li>
                  <li>"How do KIT gene mutations affect GIST pathogenesis?"</li>
                  <li>"What is the function of the PDGFRA gene?"</li>
                  <li>"What are the molecular subtypes of GIST?"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Gene Screening */}
          <div className="feature-guide">
            <div className="feature-header">
              <Dna size={28} />
              <h3>Gene Screening</h3>
            </div>
            <div className="feature-content">
              <div className="feature-description">
                <h4>Feature Introduction</h4>
                <p>Provides gene information query and screening functions, supporting gene name search, AI recommendations, and quick tag selection.</p>

                <h4>How to Use</h4>
                <ol>
                  <li><strong>Direct Search:</strong> Enter gene names in the search box (e.g., KIT, TP53)</li>
                  <li><strong>AI Recommendations:</strong> Use the intelligent gene assistant to get relevant gene recommendations</li>
                  <li><strong>Quick Tags:</strong> Click preset gene tags for quick queries</li>
                  <li><strong>View Details:</strong> Click "More Options" to enter the detailed gene information page</li>
                </ol>

                <h4>Supported Genes</h4>
                <p>The system supports querying major GIST-related genes, including but not limited to: KIT, PDGFRA, TP53, BRAF, NF1, etc.</p>
              </div>
            </div>
          </div>

          {/* Data Analysis Modules */}
          <div className="feature-guide">
            <div className="feature-header">
              <BarChart3 size={28} />
              <h3>Data Analysis Modules</h3>
            </div>
            <div className="feature-content">
              <div className="analysis-modules">
                <div className="module-item">
                  <Dna size={24} />
                  <div>
                    <h4>Genomics Analysis</h4>
                    <p>Enter gene names to view genomics data such as mutation status and copy number variations in GIST samples. Data sourced from cBioPortal database.</p>
                  </div>
                </div>

                <div className="module-item">
                  <Zap size={24} />
                  <div>
                    <h4>Transcriptomics Analysis</h4>
                    <p>Enter the interactive transcriptomics analysis platform, supporting differential expression analysis, pathway enrichment analysis, and other functions.</p>
                  </div>
                </div>

                <div className="module-item">
                  <Rss size={24} />
                  <div>
                    <h4>Non-coding RNA Analysis</h4>
                    <p>Select RNA type (miRNA, lncRNA, circRNA), enter target genes, and view related non-coding RNA regulatory relationships.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dataset Features */}
        <section className="guide-section">
          <div className="section-header">
            <Database size={24} />
            <h2>Dataset Features</h2>
          </div>
          <div className="guide-card">
            <div className="card-icon">
              <Database size={32} />
            </div>
            <h3>Dataset Data Browsing</h3>
            <p>Click "Dataset" in the navigation bar to view GIST-related datasets collected by the platform, including sample information, gene expression data, etc.</p>
            <div className="guide-tip">
              <Info size={16} />
              <span>Tip: Datasets are displayed in table format with search and filtering capabilities</span>
            </div>
          </div>
        </section>

        {/* Usage Tips */}
        <section className="guide-section">
          <div className="section-header">
            <Info size={24} />
            <h2>Usage Tips</h2>
          </div>
          <div className="tips-grid">
            <div className="tip-item">
              <h4>💡 Efficient Search</h4>
              <p>Using standard gene symbols (e.g., KIT instead of kit) can yield more accurate search results.</p>
            </div>
            <div className="tip-item">
              <h4>🔍 Combined Queries</h4>
              <p>You can first learn about related genes through the AI assistant, then use the gene screening function for detailed queries.</p>
            </div>
            <div className="tip-item">
              <h4>📊 Data Interpretation</h4>
              <p>When viewing analysis results, you can ask the AI assistant about the biological significance and clinical relevance of the data.</p>
            </div>
            <div className="tip-item">
              <h4>🔄 Continuous Learning</h4>
              <p>The platform continuously updates data and features. It's recommended to check the guide regularly for new functionalities.</p>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="guide-section">
          <div className="section-header">
            <Info size={24} />
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h4>Q: What should I do if the AI assistant cannot answer my question?</h4>
              <p>A: Please try rephrasing the question, using more specific medical terminology, or breaking complex questions into multiple simple ones.</p>
            </div>
            <div className="faq-item">
              <h4>Q: Why are there no results for my gene search?</h4>
              <p>A: Please check the spelling of the gene name, ensure you're using standard gene symbols, or try using gene aliases.</p>
            </div>
            <div className="faq-item">
              <h4>Q: How should I interpret data analysis results?</h4>
              <p>A: You can screenshot or describe the analysis results to the AI assistant, which will help you understand the biological significance of the data.</p>
            </div>
            <div className="faq-item">
              <h4>Q: Which browsers does the platform support?</h4>
              <p>A: We recommend using the latest versions of Chrome, Firefox, Safari, or Edge for the best experience.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Guide;
