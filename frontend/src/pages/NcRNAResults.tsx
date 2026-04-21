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
        setError('Query failed, please try again later');
      }
    } catch (err) {
      console.error('API call exception:', err);
      setError('Network error — please check your connection');
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
          <p>Querying {getTypeTitle()} data for {gene}...</p>
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
            Back to home
          </Link>
          <h1>{getTypeTitle()} query results</h1>
        </div>

        <div className="query-info">
          <h2>Gene: <span className="gene-name">{gene}</span></h2>
          <p className="result-count">
            Found <strong>{filteredResults.length}</strong> related {getTypeTitle()} records
            {filteredResults.length !== results.length && ` (of ${results.length} total)`}
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder={`Search ${getTypeTitle()} ID or experiment method...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <Filter size={16} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">
                {type === 'miRNA' ? 'All evidence types' : 'All species'}
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
            <button onClick={fetchNcRNAData}>Retry</button>
          </div>
        )}

        {!error && filteredResults.length === 0 && (
          <div className="no-results">
            <p>No matching {getTypeTitle()} data found</p>
            <Link to="/" className="try-again-link">Try another gene</Link>
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
                      <th>Evidence type</th>
                      <th>Experiment method</th>
                      <th>miRTarBase ID</th>
                    </>
                  ) : (
                    <>
                      <th>ncRNA ID</th>
                      <th>Description</th>
                      <th>Experiment method</th>
                      <th>Species</th>
                    </>
                  )}
                  <th>Reference</th>
                  <th>Action</th>
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
                        title={`View ${getTypeTitle()} details`}
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