import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Dna, Microscope, BarChart3 } from 'lucide-react';
import PTMIcon from '../components/icons/PTMIcon';
import TranscriptomicsIcon from '../components/icons/TranscriptomicsIcon';
import ProteomicsIcon from '../components/icons/ProteomicsIcon';
import SingleCellIcon from '../components/icons/SingleCellIcon';
import NcRNAIcon from '../components/icons/NcRNAIcon';
import MiniChat from '../components/MiniChat';
import GeneAssistant from '../components/GeneAssistant';

const Home: React.FC = () => {
  const [quickGene, setQuickGene] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [ncRnaQueryMode, setNcRnaQueryMode] = useState(false);

  const navigate = useNavigate();

  const handleQuickSearch = () => {
    if (!quickGene.trim()) {
      alert('Please enter a gene name');
      return;
    }

    // Build GIST search query
    const searchQuery = `(GIST) AND (${quickGene.trim()})`;
    const pubmedUrl = `https://www.pubmed.ai/results?q=${encodeURIComponent(searchQuery)}`;
    window.open(pubmedUrl, '_blank');
  };

  const handleGeneSelect = (gene: string) => {
    setQuickGene(gene);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickSearch();
    }
  };

  const handleNcRNAQuery = async (gene: string, ncRNAType: string) => {
    try {
      // 如果选择全部类型，直接跳转到RNAinter
      if (ncRNAType === 'all') {
        const url = `http://www.rnainter.org/showSearch/?identifier_type=Symbol&Keyword=${gene}&Category=All&interaction_type=All&species=All&method=All&score1=0.0&score2=1.0`;
        window.open(url, '_blank');
        return;
      }

      // 各种类型都跳转到对应的结果页面
      if (ncRNAType === 'miRNA') {
        navigate(`/mirna-results?gene=${encodeURIComponent(gene)}`);
        return;
      } else if (ncRNAType === 'circRNA') {
        navigate(`/circrna-results?gene=${encodeURIComponent(gene)}&type=circRNA`);
        return;
      } else if (ncRNAType === 'lncRNA') {
        navigate(`/lncrna-results?gene=${encodeURIComponent(gene)}&type=lncRNA`);
        return;
      }

      // 其他类型回退到RNAinter
      const url = `http://www.rnainter.org/showSearch/?identifier_type=Symbol&Keyword=${gene}&Category=All&interaction_type=All&species=All&method=All&score1=0.0&score2=1.0`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to query ncRNA data:', error);
      // Fallback to RNAinter on error
      const url = `http://www.rnainter.org/showSearch/?identifier_type=Symbol&Keyword=${gene}&Category=All&interaction_type=All&species=All&method=All&score1=0.0&score2=1.0`;
      window.open(url, '_blank');
    }
  };


  return (
    <div className="home-container">
      <header className="hero-section">
        <div className="hero-logo">
          <img
            src="/GIST_gpt.png"
            alt="dbGIST Logo"
            width="140"
            height="140"
            style={{
              borderRadius: '50%',
              backgroundColor: 'white',
              padding: '10px'
            }}
          />
        </div>
        <h1 className="hero-title">dbGIST-LLM-powered web service for GISTs</h1>
        <p className="hero-subtitle">Explore gene function based on multi-omics data from 33 independent centers</p>
        <div className="hero-cta">
          <button
            className="cta-button primary"
            onClick={() => {
              const target = document.querySelector('.feature-header');
              const navbar = document.querySelector('.navbar');
              if (target && navbar) {
                const targetRect = target.getBoundingClientRect();
                const navbarHeight = navbar.getBoundingClientRect().height;
                const offsetTop = window.pageYOffset + targetRect.top - navbarHeight - 20; // 20px extra spacing
                window.scrollTo({
                  top: offsetTop,
                  behavior: 'smooth'
                });
              }
            }}
          >
            Get Started
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 10L12 15L17 10"/>
            </svg>
          </button>
        </div>
      </header>

      <section className="gist-workbench container">
        {/* Chat Assistant - Left 4 columns */}
        <article className="card chat" aria-label="GIST Intelligent Assistant">
          <div className="feature-header">
            <Bot className="feature-icon" size={40} />
            <h3>dbGIST Assistant</h3>
            <p>Chat with AI assistant to learn GIST-related knowledge</p>
          </div>
          <MiniChat height="300px" />
          <Link to="/ai-chat" className="full-chat-link">
            Enter Full Chat →
          </Link>
        </article>

        {/* Gene Screening - Right 4 columns */}
        <article className="card filter" aria-label="GIST Gene Screening">
          <div className="feature-header">
            <Dna className="feature-icon" size={40} />
            <h3>GIST Gene Screening</h3>
            <p>Screen GIST-related genes, view literature with professional search queries</p>
          </div>

          <div className="filter-content">
            {/* Intelligent Gene Assistant */}
            <GeneAssistant
              onGeneSelect={handleGeneSelect}
              height="300px"
            />

            {/* Gene Search Area */}
            <div className="gene-search-row">
              <input
                type="text"
                value={quickGene}
                onChange={(e) => setQuickGene(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter gene name..."
                className="gene-search-input"
              />
              <button
                onClick={handleQuickSearch}
                disabled={!quickGene.trim()}
                className="gene-search-button"
              >
                <Microscope size={16} />
              </button>
            </div>

            {/* Quick Tags */}
            <div className="gene-quick-tags">
              <div className="gene-tags">
                {['TP53', 'KIT', 'PDGFRA'].map((gene) => (
                  <button
                    key={gene}
                    onClick={() => setQuickGene(gene)}
                    className="gene-tag"
                  >
                    {gene}
                  </button>
                ))}
              </div>
              <Link to="/gene-info" className="more-options-link">
                More Options →
              </Link>
            </div>
          </div>
        </article>

        {/* Data Analysis Grid - Bottom full row */}
        <article className="analysis-grid-container" aria-label="GIST Data Analysis">
          <div className="analysis-grid">
            <div className="analysis-header">
              <BarChart3 className="feature-icon" size={40} />
              <h3>GIST Data Analysis</h3>
              <p>Select different omics analysis modules for professional data analysis</p>
              <div className="ai-toggle-container">
                <label className="ai-toggle-label">
                  <span>AI Switch</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </div>
            </div>

            <div className="analysis-cards">
            {/* Genomics */}
            <div className="analysis-card-wrapper">
              <div className="analysis-card">
                <div className="card-icon">
                  <Dna size={72} color="#1C484C" />
                </div>
                <span>Genomics</span>
                <div className="card-input">
                  <input
                    type="text"
                    placeholder="Enter gene name (e.g., KIT)"
                    className="gene-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const gene = e.currentTarget.value.trim();
                        if (gene) {
                          const url = `https://www.cbioportal.org/results/oncoprint?cancer_study_list=gist_msk_2025%2Cgist_msk_2022%2Cgist_msk_2023&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic%2Ccna&case_set_id=all&gene_list=${gene}&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B%22selectedDataSourceOption%22%3A%22gistic%22%7D&plots_vert_selection=%7B%7D&plots_coloring_selection=%7B%7D`;
                          window.open(url, '_blank');
                        }
                      }
                    }}
                  />
                  <button
                    className="card-btn"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const gene = input.value.trim();
                      if (gene) {
                        const url = `https://www.cbioportal.org/results/oncoprint?cancer_study_list=gist_msk_2025%2Cgist_msk_2022%2Cgist_msk_2023&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic%2Ccna&case_set_id=all&gene_list=${gene}&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B%22selectedDataSourceOption%22%3A%22gistic%22%7D&plots_vert_selection=%7B%7D&plots_coloring_selection=%7B%7D`;
                        window.open(url, '_blank');
                      } else {
                        alert('Please enter a gene name');
                      }
                    }}
                  >
                    Query
                  </button>
                </div>
              </div>
            </div>

            {/* Transcriptomics */}
            <div className="analysis-card-wrapper">
              <div className="analysis-card">
                <div className="card-icon">
                  <TranscriptomicsIcon size={72} color="#1C484C" />
                </div>
                <span>Transcriptomics</span>
                <button
                  className="card-btn primary"
                  onClick={() => {
                    const url = aiEnabled ? 'http://117.72.75.45:4964/' : 'http://117.72.75.45:4966/';
                    window.open(url, '_blank');
                  }}
                >
                  Enter Analysis →
                </button>
              </div>
            </div>

            {/* Proteomics */}
            <div className="analysis-card-wrapper">
              <div className="analysis-card">
                <div className="card-icon">
                  <ProteomicsIcon size={72} color="#1C484C" />
                </div>
                <span>Proteomics</span>
                <button
                  className="card-btn primary"
                  onClick={() => {
                    const url = aiEnabled ? 'http://117.72.75.45:4968/' : 'http://117.72.75.45:4967/';
                    window.open(url, '_blank');
                  }}
                >
                  Enter Analysis →
                </button>
              </div>
            </div>

            {/* Post-translational Modification Omics */}
            <div className="analysis-card-wrapper">
              <div className="analysis-card">
                <div className="card-icon">
                  <PTMIcon size={72} color="#1C484C" />
                </div>
                <span>Post-translational Modification Omics</span>
                <button
                  className="card-btn primary"
                  onClick={() => {
                    const url = aiEnabled ? 'http://117.72.75.45:4972/' : 'http://117.72.75.45:4971/';
                    window.open(url, '_blank');
                  }}
                >
                  Enter Analysis →
                </button>
              </div>
            </div>

            {/* Single-cell Transcriptomics */}
            <div className="analysis-card-wrapper">
              <div className="analysis-card">
                <div className="card-icon">
                  <SingleCellIcon size={72} color="#1C484C" />
                </div>
                <span>Single-cell Transcriptomics</span>
                <button
                  className="card-btn primary"
                  onClick={() => {
                    const url = aiEnabled ? 'http://117.72.75.45:4974/' : 'http://117.72.75.45:4975/';
                    window.open(url, '_blank');
                  }}
                >
                  Enter Analysis →
                </button>
              </div>
            </div>

            {/* Non-coding RNA */}
            <div className="analysis-card-wrapper">
              <div className="analysis-card" style={{ position: 'relative' }}>
                {/* 右上角模式开关：关=Analysis，开=Query（默认关） */}
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Query</span>
                  {/* 使用label包裹，确保点击滑块也能切换复选框 */}
                  <label className="toggle-switch" style={{ transform: 'scale(0.85)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ncRnaQueryMode}
                      onChange={(e) => setNcRnaQueryMode(e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="card-icon">
                  <NcRNAIcon size={72} color="#1C484C" />
                </div>
                <span>Non-coding RNA</span>

                {ncRnaQueryMode ? (
                  <div className="card-input">
                    <div className="ncrna-input-group">
                      <select className="ncrna-type-select">
                        <option value="all">All Types</option>
                        <option value="miRNA">miRNA</option>
                        <option value="lncRNA">lncRNA</option>
                        <option value="circRNA">circRNA</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Enter gene name (e.g., TP53)"
                        className="gene-input ncrna-gene-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const gene = e.currentTarget.value.trim();
                            const select = e.currentTarget.parentElement?.querySelector('.ncrna-type-select') as HTMLSelectElement;
                            const ncRNAType = select?.value || 'all';
                            if (gene) {
                              handleNcRNAQuery(gene, ncRNAType);
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      className="card-btn"
                      onClick={(e) => {
                        const inputGroup = e.currentTarget.previousElementSibling as HTMLElement;
                        const input = inputGroup.querySelector('.ncrna-gene-input') as HTMLInputElement;
                        const select = inputGroup.querySelector('.ncrna-type-select') as HTMLSelectElement;
                        const gene = input.value.trim();
                        const ncRNAType = select.value;
                        if (gene) {
                          handleNcRNAQuery(gene, ncRNAType);
                        } else {
                          alert('Please enter a gene name');
                        }
                      }}
                    >
                      Query
                    </button>
                  </div>
                ) : (
                  <button
                    className="card-btn primary"
                    onClick={() => {
                      const url = aiEnabled ? 'http://117.72.75.45:4992/' : 'http://117.72.75.45:4991/';
                      window.open(url, '_blank');
                    }}
                  >
                    Enter Analysis →
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        </article>
      </section>

      <section className="about-section">
        <h2>About dbGIST</h2>
        <p>dbGIST: An LLM-powered Web Service for Gene Multi-Omics Functional Exploration in Gastrointestinal stromal tumors</p>
      </section>

      <style>{`
        @keyframes slide {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Home;