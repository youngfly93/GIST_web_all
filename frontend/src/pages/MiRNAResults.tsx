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
        setError('Query failed, please try again later');
      }
    } catch (err) {
      setError('Network error — please check your connection');
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
          <p>Querying miRNA data for {gene}...</p>
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
          <h1>miRNA query results</h1>
        </div>

        <div className="query-info">
          <h2>Gene: <span className="gene-name">{gene}</span></h2>
          <p className="result-count">
            Found <strong>{filteredResults.length}</strong> related miRNA records
            {filteredResults.length !== results.length && ` (of ${results.length} total)`}
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search miRNA ID or experiment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <Filter size={16} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All evidence types</option>
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
            <button onClick={fetchMiRNAData}>Retry</button>
          </div>
        )}

        {!error && filteredResults.length === 0 && (
          <div className="no-results">
            <p>No matching miRNA data found</p>
            <Link to="/" className="try-again-link">Try another gene</Link>
          </div>
        )}

        {!error && filteredResults.length > 0 && (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>miRNA ID</th>
                  <th>Evidence type</th>
                  <th>Experiment method</th>
                  <th>miRTarBase ID</th>
                  <th>Reference</th>
                  <th>Action</th>
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
                        title="View miRBase details"
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
