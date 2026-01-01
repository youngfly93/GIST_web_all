import React, { useState } from 'react';

interface Gene {
  symbol: string;
  name: string;
  description: string;
  category: string;
  gistRelevance?: string;
}

const GeneInfo: React.FC = () => {
  // const [selectedGene, setSelectedGene] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // 预定义的基因列表，包含GIST相关基因
  const popularGenes: Gene[] = [
    // GIST core genes
    {
      symbol: 'KIT',
      name: 'KIT receptor tyrosine kinase',
      description: 'Primary driver of GIST; ~85% of patients harbor KIT mutations',
      category: 'GIST Core',
      gistRelevance: 'Core driver'
    },
    {
      symbol: 'PDGFRA',
      name: 'Platelet-derived growth factor receptor alpha',
      description: 'Second major driver; ~5–10% of GIST harbor PDGFRA mutations',
      category: 'GIST Core',
      gistRelevance: 'Secondary driver'
    },
    {
      symbol: 'SDHA',
      name: 'Succinate dehydrogenase complex subunit A',
      description: 'Associated with wild-type GIST, mainly in pediatric/young patients',
      category: 'GIST Related',
      gistRelevance: 'SDH-deficient (WT) GIST'
    },
    {
      symbol: 'SDHB',
      name: 'Succinate dehydrogenase complex subunit B',
      description: 'Associated with hereditary GIST syndromes',
      category: 'GIST Related',
      gistRelevance: 'Hereditary GIST'
    },
    {
      symbol: 'SDHC',
      name: 'Succinate dehydrogenase complex subunit C',
      description: 'Associated with hereditary GIST and paraganglioma',
      category: 'GIST Related',
      gistRelevance: 'Hereditary GIST'
    },
    {
      symbol: 'SDHD',
      name: 'Succinate dehydrogenase complex subunit D',
      description: 'Rare mutations linked to hereditary GIST',
      category: 'GIST Related',
      gistRelevance: 'Hereditary GIST'
    },
    {
      symbol: 'NF1',
      name: 'Neurofibromin 1',
      description: 'Causative gene for NF1-associated GIST',
      category: 'GIST Related',
      gistRelevance: 'NF1-associated GIST'
    },
    {
      symbol: 'BRAF',
      name: 'BRAF proto-oncogene',
      description: 'Mutations observed in a subset of wild-type GIST',
      category: 'GIST Related',
      gistRelevance: 'Wild-type GIST'
    },
    // General tumor-related genes
    {
      symbol: 'TP53',
      name: 'Tumor protein p53',
      description: 'Tumor suppressor important in GIST progression',
      category: 'Tumor Suppressors',
      gistRelevance: 'Progression-associated'
    },
    {
      symbol: 'CDKN2A',
      name: 'Cyclin dependent kinase inhibitor 2A',
      description: 'Frequently deleted in high-grade GIST',
      category: 'Cell Cycle',
      gistRelevance: 'Malignant progression marker'
    },
    {
      symbol: 'PIK3CA',
      name: 'PI3K catalytic subunit alpha (PIK3CA)',
      description: 'Key signaling pathway for GIST growth and survival',
      category: 'Signaling Pathways',
      gistRelevance: 'Therapeutic target'
    },
    {
      symbol: 'EGFR',
      name: 'Epidermal growth factor receptor',
      description: 'Regulator of cell growth and division; potential target',
      category: 'Growth Factor Receptors',
      gistRelevance: 'Potential therapeutic target'
    }
  ];

  // 过滤基因列表
  const filteredGenes = popularGenes.filter(gene => {
    const matchesSearch = gene.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gene.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gene.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || gene.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 跳转到PubMed AI，使用简化的GIST检索式
  const handleGeneSelect = (geneSymbol: string, _gene: Gene) => {
    // 简化检索式：固定GIST + 变动基因
    const searchQuery = `(GIST) AND (${geneSymbol})`;
    const pubmedUrl = `https://www.pubmed.ai/results?q=${encodeURIComponent(searchQuery)}`;
    window.open(pubmedUrl, '_blank');
  };

  return (
    <div className="gene-info-container">
      <h1>GIST Gene Screening</h1>
      <p className="page-description">Screen GIST-related genes and view professional literature</p>
      
      <div className="filter-section">
        <div className="search-section">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gene name or description..."
            className="gene-input"
          />
        </div>
        
        <div className="category-filter">
          <label>Category filter:</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All genes</option>
            <option value="GIST Core">GIST core genes</option>
            <option value="GIST Related">GIST related genes</option>
            <option value="Tumor Suppressors">Tumor suppressor genes</option>
            <option value="Signaling Pathways">Signaling pathway genes</option>
            <option value="Cell Cycle">Cell cycle genes</option>
            <option value="Growth Factor Receptors">Growth factor receptors</option>
          </select>
        </div>
      </div>
      
      <div className="genes-grid">
        {filteredGenes.map((gene) => (
          <div 
            key={gene.symbol}
            className="gene-card"
            onClick={() => handleGeneSelect(gene.symbol, gene)}
          >
            <div className="gene-header">
              <h3 className="gene-symbol">{gene.symbol}</h3>
              <span className="gene-category">{gene.category}</span>
            </div>
            <h4 className="gene-name">{gene.name}</h4>
            <p className="gene-description">{gene.description}</p>
            {gene.gistRelevance && (
              <div className="gist-relevance">
                <span className="gist-tag">GIST relevance: {gene.gistRelevance}</span>
              </div>
            )}
            <div className="gene-action">
              <span>Open GIST-related literature →</span>
            </div>
          </div>
        ))}
      </div>

      {filteredGenes.length === 0 && searchTerm && (
        <div className="no-results">
          <p>No matching genes found. Try other keywords.</p>
        </div>
      )}
    </div>
  );
};

export default GeneInfo;