import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Search, Filter } from 'lucide-react';

interface NcRNARecord {
  id: string;
  type: string;
  ncRNA_id?: string;
  description: string;
  experiments: string;
  pmid: string;
  species: string;
  link: string;
  interactionID?: string;
  // miRNA 特有字段
  evidence?: string;
  miRTarBaseID?: string;
}

const NcRNAResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gene = searchParams.get('gene') || '';
  const type = searchParams.get('type') || 'circRNA';
  const [results, setResults] = useState<NcRNARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (gene && type) {
      fetchNcRNAData();
    }
  }, [gene, type]);

  const fetchNcRNAData = async () => {
    try {
      setLoading(true);
      const url = `/api/ncrna/query?gene=${encodeURIComponent(gene)}&type=${type}`;
      console.log('前端API调用:', url);

      const response = await fetch(url);
      console.log('API响应状态:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API返回数据:', data);
        console.log('结果数量:', data.results?.length || 0);
        if (data.results?.length > 0) {
          console.log('第一条记录:', data.results[0]);
        }
        setResults(data.results || []);
      } else {
        console.error('API响应错误:', response.status, response.statusText);
        setError('查询失败，请稍后重试');
      }
    } catch (err) {
      console.error('API调用异常:', err);
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(item => {
    const matchesFilter = filter === 'all' || 
      (type === 'miRNA' && item.evidence?.toLowerCase().includes(filter.toLowerCase())) ||
      (type !== 'miRNA' && item.species?.toLowerCase().includes(filter.toLowerCase()));
    
    const matchesSearch = searchTerm === '' || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.experiments.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // 根据类型获取筛选选项
  const getFilterOptions = () => {
    if (type === 'miRNA') {
      return [...new Set(results.map(item => item.evidence))].filter(Boolean);
    } else {
      return [...new Set(results.map(item => item.species))].filter(Boolean);
    }
  };

  const filterOptions = getFilterOptions();

  const getTypeTitle = () => {
    switch (type) {
      case 'circRNA': return 'circRNA';
      case 'lncRNA': return 'lncRNA';
      case 'miRNA': return 'miRNA';
      default: return 'ncRNA';
    }
  };

  if (loading) {
    return (
      <div className="mirna-results-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在查询 {gene} 相关的 {getTypeTitle()} 数据...</p>
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
          <h1>{getTypeTitle()} 查询结果</h1>
        </div>
        
        <div className="query-info">
          <h2>基因: <span className="gene-name">{gene}</span></h2>
          <p className="result-count">
            找到 <strong>{filteredResults.length}</strong> 条相关的 {getTypeTitle()} 记录
            {filteredResults.length !== results.length && ` (共 ${results.length} 条)`}
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder={`搜索 ${getTypeTitle()} ID 或实验方法...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <Filter size={16} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">
                {type === 'miRNA' ? '所有证据类型' : '所有物种'}
              </option>
              {filterOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="results-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchNcRNAData}>重试</button>
          </div>
        )}

        {!error && filteredResults.length === 0 && (
          <div className="no-results">
            <p>未找到匹配的 {getTypeTitle()} 数据</p>
            <Link to="/" className="try-again-link">尝试其他基因</Link>
          </div>
        )}

        {!error && filteredResults.length > 0 && (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>{getTypeTitle()} ID</th>
                  {type === 'miRNA' ? (
                    <>
                      <th>证据类型</th>
                      <th>实验方法</th>
                      <th>miRTarBase ID</th>
                    </>
                  ) : (
                    <>
                      <th>ncRNA ID</th>
                      <th>描述</th>
                      <th>实验方法</th>
                      <th>物种</th>
                    </>
                  )}
                  <th>参考文献</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="result-row">
                    <td className="mirna-id-cell">
                      <span className="mirna-id">{item.id}</span>
                    </td>
                    
                    {type === 'miRNA' ? (
                      <>
                        <td className="evidence-cell">
                          <span className={`evidence-badge ${item.evidence?.toLowerCase().replace(/\s+/g, '-')}`}>
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
                      </>
                    ) : (
                      <>
                        <td className="ncrna-id-cell">
                          <span className="ncrna-id">{item.ncRNA_id || '-'}</span>
                        </td>
                        <td className="description-cell">
                          <div className="description-text" title={item.description}>
                            {item.description || '-'}
                          </div>
                        </td>
                        <td className="experiments-cell">
                          <div className="experiments-text" title={item.experiments}>
                            {item.experiments || '-'}
                          </div>
                        </td>
                        <td className="species-cell">
                          <span className="species-badge">{item.species || '-'}</span>
                        </td>
                      </>
                    )}
                    
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
                        title={`查看 ${getTypeTitle()} 详情`}
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

export default NcRNAResults;