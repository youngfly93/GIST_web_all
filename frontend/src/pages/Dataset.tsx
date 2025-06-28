import React, { useState, useEffect } from 'react';
import { ArrowLeft, Database, ExternalLink, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DatasetRecord {
  'Accession No.': string;
  'Omics Types': string;
  'Sample No.': string;
  'Data links': string;
  'Platforms': string;
  'BioProject': string;
  'Paper links': string;
}

const Dataset: React.FC = () => {
  const [data, setData] = useState<DatasetRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOmicsType, setSelectedOmicsType] = useState('all');

  // 模拟CSV数据 - 在实际应用中，这些数据应该从服务器获取
  const csvData = `Accession No.,Omics Types,Sample No.,Data links,Platforms,BioProject,Paper links
GSE56670,mRNA,20,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE56670,GPL570 [HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array,PRJNA244285,PMID: 25540324
GSE47911,mRNA,16,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE47911,GPL6480 Agilent-014850 Whole Human Genome Microarray 4x44K G4112F (Probe Name version),PRJNA208309,PMID: 24124608
GSE112,mRNA,94,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE112,"GPL9 Human Unigene I, part 1;GPL10 Human Unigene I, part 2",PRJNA84483,NA
GSE21315,mRNA,8,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE21315,GPL6244 [HuGene-1_0-st] Affymetrix Human Gene 1.0 ST Array [transcript (gene) version],PRJNA126323,NA
GSE22433,mRNA,6,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE22433,GPL6947 Illumina HumanHT-12 V3.0 expression beadchip,PRJNA129059,PMID: 20927104
E-MTAB-373,mRNA,60,https://www.ebi.ac.uk/biostudies/ArrayExpress/studies/E-MTAB-373?query=%22gastrointestinal%20stromal%20tumor%22%20,Agilent Whole Human Genome Microarray 4x44K 014850 G4112F,NA,PMID: 20581836
GSE132542,mRNA,29,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE132542,GPL570 [HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array,PRJNA548332,PMID: 31238586
GSE136755,mRNA,65,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE136755,GPL17077 Agilent-039494 SurePrint G3 Human GE v2 8x60K Microarray 039381 (Probe Name version),PRJNA563592,PMID: 31553483
GSE14755,mRNA,21,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE14755,GPL5345 SWEGENE H_v2.1.1 55K,PRJNA112249,PMID: 21064103
GSE15966,mRNA,54,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE15966,GPL1708 Agilent-012391 Whole Human Genome Oligo Microarray G4112A (Feature Number version),PRJNA115541,PMID: 19671739
GSE17743,mRNA,29,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE17743,GPL570 [HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array,PRJNA118375,PMID: 19943934
GSE20708,mRNA,22,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE20708,GPL570 [HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array,PRJNA129573,PMID: 20548289
GSE31802,mRNA,14,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE31802,GPL4133 Agilent-014850 Whole Human Genome Microarray 4x44K G4112F (Feature Number version),PRJNA145477,PMID: 22258453
GSE75479,mRNA,12,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE75479,GPL19956 NanoString nCounter human PanCancer Pathways Panel,PRJNA304407,PMID: 33186588
GSE155800,mRNA,20,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE155800,GPL21290 Illumina HiSeq 3000 (Homo sapiens),PRJNA655677,PMID: 34458010
GSE225819,mRNA,40,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE225819,GPL15207 [PrimeView] Affymetrix Human Gene Expression Array,PRJNA937675,PMID: 36911388
GSE89051,miRNA,30,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE89051,GPL16791 Illumina HiSeq 2500 (Homo sapiens),PRJNA350003,PMID: 28402935;30557328
GSE51697,mRNA,21,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE51697,GPL571 [HG-U133A_2] Affymetrix Human Genome U133A 2.0 Array,PRJNA224583,PMID: 24323358
GSE254762,Single cell sequencing,9,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE254762,GPL24676 Illumina NovaSeq 6000 (Homo sapiens),PRJNA1071640,PMID: 38443340
GSE162115,Single cell sequencing,4,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162115,Illumina Hi-seq X10 150PE,PRJNA680610,PMID: 33393143
GSE8167,mRNA,32,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE8167,GPL570 [HG-U133_Plus_2] Affymetrix Human Genome U133 Plus 2.0 Array,PRJNA101063,PMID: 18757323
GSE52666,mRNA,13,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE52666,GPL10999 Illumina Genome Analyzer IIx (Homo sapiens),PRJNA229762,NA
GSE31741,miRNA,32,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE31741,"GPL10406 Agilent-021827 Human miRNA Microarray Rel12.0, v3.0, 8x15k array (Feature Number version)",PRJNA145443,PMID: 29113198;22258453
GSE36087,miRNA,19,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE36087,GPL13746 3D-Gene Human miRNA V14_1.0.1,PRJNA151739,NA
GSE45901,miRNA,17,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE45901,GPL10656 Agilent-029297 Human miRNA Microarray v14 Rev.2 (miRNA ID version),PRJNA196633,PMID: 25349971
GSE63159,miRNA,34,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE63159,GPL10656 Agilent-029297 Human miRNA Microarray v14 Rev.2 (miRNA ID version),PRJNA266835,NA
GSE147303,CircRNA,6,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE147303,GPL21825 074301 Arraystar Human CircRNA microarray V2,PRJNA613704,PMID: 39317735;32547593
GSE156715,miRNA,14,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE156715,GPL16384 [miRNA-3] Affymetrix Multispecies miRNA-3 Array,PRJNA658899,NA
GSE131481,CircRNA,6,https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE131481,GPL22120 Agilent-078298 human ceRNA array V1.0 4X180K [Probe Name Version],PRJNA543816,PMID: 31552107
IPX0005275001,Lable-Free Proteomics,NA,NA,QExactive HFX (Thermo Fisher Scientific),NA,PMID: 37995868
IPX0005275002,Lable-Free PhoProteomics,NA,NA,Orbitrap Exploris 480 (Thermo Fisher Scientific),NA,PMID: 37995868
IPX0001353000,TMT-based Proteomics,NA,NA,Q Exactive Plus (Thermo Fisher Scientific),NA,PMID: 30804049
gist_msk_2025,Genomics,182,https://www.cbioportal.org/study/summary?id=gist_msk_2025,MSK-IMPACT,NA,NA
gist_msk_2022,Genomics,499,https://www.cbioportal.org/study/summary?id=gist_msk_2022,MSK-IMPACT,NA,PMID: 36593350
gist_msk_2023,Genomics,469,https://www.cbioportal.org/study/summary?id=gist_msk_2023,MSK-IMPACT,NA,PMID: 37477937
This study,In-Depth Proteomics,10,NA,QExactive HFX (Thermo Fisher Scientific),NA,NA
This study,Single cell sequencing,6,NA,Illumina HiSeq X,NA,NA`;

  useEffect(() => {
    // 解析CSV数据
    const parseCSV = () => {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',');
      const records: DatasetRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        records.push(record as DatasetRecord);
      }

      setData(records);
      setFilteredData(records);
      setLoading(false);
    };

    parseCSV();
  }, []);

  // 搜索和筛选功能
  useEffect(() => {
    let filtered = data;

    // 按组学类型筛选
    if (selectedOmicsType !== 'all') {
      filtered = filtered.filter(record => 
        record['Omics Types'].toLowerCase().includes(selectedOmicsType.toLowerCase())
      );
    }

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredData(filtered);
  }, [data, searchTerm, selectedOmicsType]);

  // 获取唯一的组学类型
  const omicsTypes = Array.from(new Set(data.map(record => record['Omics Types'])));

  // 渲染链接
  const renderLink = (url: string, text: string) => {
    if (!url || url === 'NA') return '-';
    
    if (url.startsWith('PMID:')) {
      const pmids = url.replace('PMID:', '').trim().split(';');
      return (
        <div className="pmid-links">
          {pmids.map((pmid, index) => (
            <a
              key={index}
              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pmid-link"
            >
              PMID: {pmid.trim()}
            </a>
          ))}
        </div>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="data-link"
      >
        <ExternalLink size={14} />
        {text}
      </a>
    );
  };

  if (loading) {
    return (
      <div className="dataset-container">
        <div className="loading-spinner">
          <Database size={48} />
          <p>加载数据集...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dataset-container">
      {/* 页面头部 */}
      <div className="dataset-header">
        <div className="header-top">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            返回首页
          </Link>
          <div className="header-info">
            <Database size={32} />
            <div>
              <h1>GIST 数据集</h1>
              <p>找到 {filteredData.length} 条数据记录</p>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索数据集..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <Filter size={20} />
            <select
              value={selectedOmicsType}
              onChange={(e) => setSelectedOmicsType(e.target.value)}
            >
              <option value="all">所有类型</option>
              {omicsTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="dataset-table-container">
        <table className="dataset-table">
          <thead>
            <tr>
              <th>登录号</th>
              <th>组学类型</th>
              <th>样本数</th>
              <th>数据链接</th>
              <th>平台</th>
              <th>BioProject</th>
              <th>文献链接</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((record, index) => (
              <tr key={index}>
                <td className="accession-cell">
                  <span className="accession-id">{record['Accession No.']}</span>
                </td>
                <td className="omics-cell">
                  <span className={`omics-badge ${record['Omics Types'].toLowerCase().replace(/\s+/g, '-')}`}>
                    {record['Omics Types']}
                  </span>
                </td>
                <td className="sample-cell">
                  {record['Sample No.'] || '-'}
                </td>
                <td className="link-cell">
                  {renderLink(record['Data links'], '查看数据')}
                </td>
                <td className="platform-cell">
                  <div className="platform-text" title={record['Platforms']}>
                    {record['Platforms'] || '-'}
                  </div>
                </td>
                <td className="bioproject-cell">
                  {record['BioProject'] || '-'}
                </td>
                <td className="paper-cell">
                  {renderLink(record['Paper links'], '查看文献')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 空状态 */}
      {filteredData.length === 0 && (
        <div className="empty-state">
          <Database size={64} color="#9CA3AF" />
          <h3>未找到匹配的数据</h3>
          <p>请尝试调整搜索条件或筛选器</p>
        </div>
      )}
    </div>
  );
};

export default Dataset;
