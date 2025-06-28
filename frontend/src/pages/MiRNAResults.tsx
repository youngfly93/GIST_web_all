import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Search, Filter } from 'lucide-react';

interface MiRNARecord {
  id: string;
  type: string;
  evidence: string;
  experiments: string;
  pmid: string;
  link: string;
  miRTarBaseID: string;
}

const MiRNAResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gene = searchParams.get('gene') || '';
  const [results, setResults] = useState<MiRNARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (gene) {
      fetchMiRNAData();
    }
  }, [gene]);

  const fetchMiRNAData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ncrna/query?gene=${encodeURIComponent(gene)}&type=miRNA`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        setError('查询失败，请稍后重试');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(item => {
    const matchesFilter = filter === 'all' || item.evidence.toLowerCase().includes(filter.toLowerCase());
    const matchesSearch = searchTerm === '' || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.experiments.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const evidenceTypes = [...new Set(results.map(item => item.evidence))].filter(Boolean);

  if (loading) {
    return (
      <div className="mirna-results-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在查询 {gene} 相关的 miRNA 数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mirna-results-container">
      <header className="results-header">
        <div className="header-top">
          <Link to="/" className="back-button">
            <ArrowLeft size={20} />
            返回首页
          </Link>
          <h1>miRNA 查询结果</h1>
        </div>
        
        <div className="query-info">
          <h2>基因: <span className="gene-name">{gene}</span></h2>
          <p className="result-count">
            找到 <strong>{filteredResults.length}</strong> 条相关的 miRNA 记录
            {filteredResults.length !== results.length && ` (共 ${results.length} 条)`}
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索 miRNA ID 或实验方法..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <Filter size={16} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">所有证据类型</option>
              {evidenceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="results-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchMiRNAData}>重试</button>
          </div>
        )}

        {!error && filteredResults.length === 0 && (
          <div className="no-results">
            <p>未找到匹配的 miRNA 数据</p>
            <Link to="/" className="try-again-link">尝试其他基因</Link>
          </div>
        )}

        {!error && filteredResults.length > 0 && (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>miRNA ID</th>
                  <th>证据类型</th>
                  <th>实验方法</th>
                  <th>miRTarBase ID</th>
                  <th>参考文献</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((item, index) => (
                  <tr key={`${item.miRTarBaseID}-${index}`} className="result-row">
                    <td className="mirna-id-cell">
                      <span className="mirna-id">{item.id}</span>
                    </td>
                    <td className="evidence-cell">
                      <span className={`evidence-badge ${item.evidence.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.evidence}
                      </span>
                    </td>
                    <td className="experiments-cell">
                      <div className="experiments-text" title={item.experiments}>
                        {item.experiments || '-'}
                      </div>
                    </td>
                    <td className="database-id-cell">
                      <span className="database-id">{item.miRTarBaseID || '-'}</span>
                    </td>
                    <td className="pmid-cell">
                      {item.pmid ? (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pmid-link"
                        >
                          PMID: {item.pmid}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="actions-cell">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                        title="查看 miRBase 详情"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default MiRNAResults;
