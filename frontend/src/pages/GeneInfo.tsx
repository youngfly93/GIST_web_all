import React, { useState } from 'react';

interface Gene {
  symbol: string;
  name: string;
  description: string;
  category: string;
  gistRelevance?: string;
}

const GeneInfo: React.FC = () => {
  const [selectedGene, setSelectedGene] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // 预定义的基因列表，包含GIST相关基因
  const popularGenes: Gene[] = [
    // GIST核心相关基因
    {
      symbol: 'KIT',
      name: 'KIT受体酪氨酸激酶',
      description: 'GIST最主要的驱动基因，85%的GIST患者存在KIT突变',
      category: 'GIST核心',
      gistRelevance: '核心驱动基因'
    },
    {
      symbol: 'PDGFRA',
      name: '血小板衍生生长因子受体α',
      description: 'GIST的第二大驱动基因，约5-10%的GIST患者存在突变',
      category: 'GIST核心',
      gistRelevance: '次要驱动基因'
    },
    {
      symbol: 'SDHA',
      name: '琥珀酸脱氢酶亚基A',
      description: '野生型GIST相关基因，主要见于儿童和年轻患者',
      category: 'GIST相关',
      gistRelevance: '野生型GIST'
    },
    {
      symbol: 'SDHB',
      name: '琥珀酸脱氢酶亚基B',
      description: '与遗传性GIST综合征相关',
      category: 'GIST相关',
      gistRelevance: '遗传性GIST'
    },
    {
      symbol: 'SDHC',
      name: '琥珀酸脱氢酶亚基C',
      description: '与遗传性GIST和副神经节瘤相关',
      category: 'GIST相关',
      gistRelevance: '遗传性GIST'
    },
    {
      symbol: 'SDHD',
      name: '琥珀酸脱氢酶亚基D',
      description: '与遗传性GIST相关的稀有突变',
      category: 'GIST相关',
      gistRelevance: '遗传性GIST'
    },
    {
      symbol: 'NF1',
      name: '神经纤维瘤病1型基因',
      description: '神经纤维瘤病相关GIST的致病基因',
      category: 'GIST相关',
      gistRelevance: 'NF1相关GIST'
    },
    {
      symbol: 'BRAF',
      name: 'BRAF原癌基因',
      description: '在部分野生型GIST中发现突变',
      category: 'GIST相关',
      gistRelevance: '野生型GIST'
    },
    // 通用肿瘤相关基因
    {
      symbol: 'TP53',
      name: '肿瘤蛋白p53',
      description: '肿瘤抑制基因，在GIST进展中起重要作用',
      category: '肿瘤抑制',
      gistRelevance: '肿瘤进展相关'
    },
    {
      symbol: 'CDKN2A',
      name: '细胞周期蛋白依赖性激酶抑制剂2A',
      description: '在高级别GIST中常见缺失',
      category: '细胞周期',
      gistRelevance: '恶性进展标志'
    },
    {
      symbol: 'PIK3CA',
      name: 'PI3K催化亚基α',
      description: '参与GIST细胞生长和存活的信号通路',
      category: '信号通路',
      gistRelevance: '治疗靶点'
    },
    {
      symbol: 'EGFR',
      name: '表皮生长因子受体',
      description: 'GIST细胞生长和分裂的调节因子',
      category: '生长因子受体',
      gistRelevance: '潜在治疗靶点'
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
  const handleGeneSelect = (geneSymbol: string, gene: Gene) => {
    // 简化检索式：固定GIST + 变动基因
    const searchQuery = `(GIST) AND (${geneSymbol})`;
    const pubmedUrl = `https://www.pubmed.ai/results?q=${encodeURIComponent(searchQuery)}`;
    window.open(pubmedUrl, '_blank');
  };

  return (
    <div className="gene-info-container">
      <h1>GIST基因研究筛选</h1>
      <p className="page-description">筛选GIST相关基因，查看专业文献研究</p>
      
      <div className="filter-section">
        <div className="search-section">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索基因名称或描述..."
            className="gene-input"
          />
        </div>
        
        <div className="category-filter">
          <label>分类筛选:</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">全部基因</option>
            <option value="GIST核心">GIST核心基因</option>
            <option value="GIST相关">GIST相关基因</option>
            <option value="肿瘤抑制">肿瘤抑制基因</option>
            <option value="信号通路">信号通路基因</option>
            <option value="细胞周期">细胞周期基因</option>
            <option value="生长因子受体">生长因子受体</option>
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
                <span className="gist-tag">GIST相关性: {gene.gistRelevance}</span>
              </div>
            )}
            <div className="gene-action">
              <span>点击查看GIST相关研究 →</span>
            </div>
          </div>
        ))}
      </div>

      {filteredGenes.length === 0 && searchTerm && (
        <div className="no-results">
          <p>未找到匹配的基因，请尝试其他关键词</p>
        </div>
      )}
    </div>
  );
};

export default GeneInfo;