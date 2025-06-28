import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据文件路径
const DATA_DIR = path.join(__dirname, '../../data');
const GENE_NCRNA_MAP_FILE = path.join(DATA_DIR, 'gene_ncRNA_map.json');
const HSA_MTI_CSV_FILE = path.join(__dirname, '../../../hsa_MTI.csv');
const CIRCRNA_INTERACTION_FILE = path.join(__dirname, '../../../circRNA_interaction.txt');
const LNCRNA_INTERACTION_FILE = path.join(__dirname, '../../../lncRNA_interaction.txt');

let geneNcRNAMap = null;
let hsaMTIData = null;
let circRNAData = null;
let lncRNAData = null;

// 初始化数据
async function initializeData() {
  try {
    if (!fs.existsSync(GENE_NCRNA_MAP_FILE)) {
      console.warn('ncRNA数据文件不存在，请先运行数据下载脚本');
      return false;
    }

    const data = fs.readFileSync(GENE_NCRNA_MAP_FILE, 'utf8');
    geneNcRNAMap = JSON.parse(data);
    console.log(`已加载 ${Object.keys(geneNcRNAMap).length} 个基因的ncRNA数据`);
    return true;
  } catch (error) {
    console.error('初始化ncRNA数据失败:', error);
    return false;
  }
}

// 查询基因相关的ncRNA
export async function queryNcRNA(gene, type) {
  // 如果数据未初始化，尝试初始化
  if (!geneNcRNAMap) {
    const initialized = await initializeData();
    if (!initialized) {
      throw new Error('ncRNA数据未初始化');
    }
  }

  const geneData = geneNcRNAMap[gene];
  if (!geneData) {
    return [];
  }

  let results = [];

  if (type === 'all') {
    // 返回所有类型的ncRNA
    ['miRNA', 'lncRNA', 'circRNA'].forEach(ncType => {
      if (geneData[ncType]) {
        results = results.concat(geneData[ncType]);
      }
    });
  } else {
    // 返回指定类型的ncRNA
    if (geneData[type]) {
      results = geneData[type];
    }
  }

  return results;
}

// 获取数据库统计信息
export async function getDataStats() {
  if (!geneNcRNAMap) {
    const initialized = await initializeData();
    if (!initialized) {
      throw new Error('ncRNA数据未初始化');
    }
  }

  const stats = {
    totalGenes: Object.keys(geneNcRNAMap).length,
    miRNACount: 0,
    lncRNACount: 0,
    circRNACount: 0
  };

  Object.values(geneNcRNAMap).forEach(geneData => {
    if (geneData.miRNA) stats.miRNACount += geneData.miRNA.length;
    if (geneData.lncRNA) stats.lncRNACount += geneData.lncRNA.length;
    if (geneData.circRNA) stats.circRNACount += geneData.circRNA.length;
  });

  return stats;
}

// 初始化CSV数据
async function initializeCSVData() {
  try {
    if (!fs.existsSync(HSA_MTI_CSV_FILE)) {
      console.warn(`hsa_MTI.csv文件不存在: ${HSA_MTI_CSV_FILE}`);
      return false;
    }

    console.log(`正在读取CSV文件: ${HSA_MTI_CSV_FILE}`);
    const data = fs.readFileSync(HSA_MTI_CSV_FILE, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      console.warn('CSV文件为空');
      return false;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    console.log('CSV文件头:', headers);

    hsaMTIData = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 简单的CSV解析，假设没有引号内的逗号
      const values = line.split(',').map(v => v.trim());

      if (values.length >= 4) { // 至少需要前4个字段
        const record = {
          'miRTarBase ID': values[0] || '',
          'miRNA': values[1] || '',
          'Species (miRNA)': values[2] || '',
          'Target Gene': values[3] || '',
          'Target Gene (Entrez ID)': values[4] || '',
          'Species (Target Gene)': values[5] || '',
          'Experiments': values[6] || '',
          'Support Type': values[7] || '',
          'References (PMID)': values[8] || ''
        };
        hsaMTIData.push(record);
      }
    }

    console.log(`已加载 ${hsaMTIData.length} 条miRNA-Target数据`);

    // 显示前几条数据用于调试
    if (hsaMTIData.length > 0) {
      console.log('示例数据:', hsaMTIData.slice(0, 2));
    }

    return true;
  } catch (error) {
    console.error('初始化CSV数据失败:', error);
    return false;
  }
}

// 解析CSV行（处理引号内的逗号）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// 查询基因相关的miRNA（从CSV文件）
export async function queryMiRNAFromCSV(targetGene) {
  // 如果CSV数据未初始化，尝试初始化
  if (!hsaMTIData) {
    const initialized = await initializeCSVData();
    if (!initialized) {
      throw new Error('CSV数据未初始化');
    }
  }

  const results = hsaMTIData.filter(record =>
    record['Target Gene'] &&
    record['Target Gene'].toUpperCase() === targetGene.toUpperCase()
  );

  // 转换为统一格式
  return results.map(record => ({
    id: record['miRNA'] || '',
    type: 'miRNA',
    evidence: record['Support Type'] || '',
    experiments: record['Experiments'] || '',
    pmid: record['References (PMID)'] || '',
    link: `https://www.mirbase.org/cgi-bin/mirna_entry.pl?acc=${record['miRNA'] || ''}`,
    miRTarBaseID: record['miRTarBase ID'] || ''
  }));
}

// 初始化circRNA数据
async function initializeCircRNAData() {
  try {
    if (!fs.existsSync(CIRCRNA_INTERACTION_FILE)) {
      console.warn(`circRNA交互文件不存在: ${CIRCRNA_INTERACTION_FILE}`);
      return false;
    }

    console.log(`正在读取circRNA文件: ${CIRCRNA_INTERACTION_FILE}`);
    const data = fs.readFileSync(CIRCRNA_INTERACTION_FILE, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());

    circRNAData = [];

    for (const line of lines) {
      const columns = line.split('\t');
      if (columns.length >= 6) {
        const record = {
          id: columns[0] || '',
          ncRNA_name: columns[1] || '',
          ncRNA_id: columns[2] || '',
          type: columns[3] || '',
          target_gene: columns[4] || '',
          target_gene_id: columns[5] || '',
          // 根据实际数据结构调整列索引
          description: columns[7] || '',
          experiments: columns[8] || '',
          pmid: columns[9] || '',
          species: columns[10] || '',
          // 添加更多字段以便调试
          interaction_type: columns[12] || '',
          detection_method: columns[13] || '',
          interaction_category: columns[14] || '',
          source: columns[15] || ''
        };
        circRNAData.push(record);
      }
    }

    console.log(`已加载 ${circRNAData.length} 条circRNA交互数据`);
    return true;
  } catch (error) {
    console.error('初始化circRNA数据失败:', error);
    return false;
  }
}

// 初始化lncRNA数据
async function initializeLncRNAData() {
  try {
    if (!fs.existsSync(LNCRNA_INTERACTION_FILE)) {
      console.warn(`lncRNA交互文件不存在: ${LNCRNA_INTERACTION_FILE}`);
      return false;
    }

    console.log(`正在读取lncRNA文件: ${LNCRNA_INTERACTION_FILE}`);
    const data = fs.readFileSync(LNCRNA_INTERACTION_FILE, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());

    lncRNAData = [];

    // 调试：查看前几行数据结构
    console.log('lncRNA文件前3行数据结构:');
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const columns = lines[i].split('\t');
      console.log(`行 ${i + 1}: 列数=${columns.length}, 前6列:`, columns.slice(0, 6));
    }

    for (const line of lines) {
      const columns = line.split('\t');
      if (columns.length >= 6) {
        const record = {
          id: columns[0] || '',
          ncRNA_name: columns[1] || '',
          ncRNA_id: columns[2] || '',
          type: columns[3] || '',
          target_gene: columns[4] || '',
          target_gene_id: columns[5] || '',
          // 根据实际数据结构调整列索引
          description: columns[7] || '',
          experiments: columns[8] || '',
          pmid: columns[9] || '',
          species: columns[10] || '',
          // 添加更多字段以便调试
          interaction_type: columns[12] || '',
          detection_method: columns[13] || '',
          interaction_category: columns[14] || '',
          source: columns[15] || ''
        };
        lncRNAData.push(record);
      }
    }

    console.log(`已加载 ${lncRNAData.length} 条lncRNA交互数据`);

    // 调试：显示TP53相关的前几条记录
    const tp53Records = lncRNAData.filter(record =>
      record.target_gene && record.target_gene.toUpperCase() === 'TP53'
    );
    console.log(`TP53相关lncRNA记录数: ${tp53Records.length}`);
    if (tp53Records.length > 0) {
      console.log('TP53相关记录示例:', tp53Records.slice(0, 2));
    }

    return true;
  } catch (error) {
    console.error('初始化lncRNA数据失败:', error);
    return false;
  }
}

// 查询基因相关的circRNA
export async function queryCircRNAFromFile(targetGene) {
  if (!circRNAData) {
    const initialized = await initializeCircRNAData();
    if (!initialized) {
      throw new Error('circRNA数据未初始化');
    }
  }

  const results = circRNAData.filter(record =>
    record.target_gene &&
    record.target_gene.toUpperCase() === targetGene.toUpperCase()
  );

  return results.map(record => ({
    id: record.ncRNA_name || '',
    type: 'circRNA',
    ncRNA_id: record.ncRNA_id || '',
    description: record.description || '',
    experiments: record.experiments || '',
    pmid: record.pmid || '',
    species: record.species || '',
    link: `https://www.circbank.cn/searchCirc.html?keyword=${record.ncRNA_name || ''}`,
    interactionID: record.id || ''
  }));
}

// 查询基因相关的lncRNA
export async function queryLncRNAFromFile(targetGene) {
  if (!lncRNAData) {
    const initialized = await initializeLncRNAData();
    if (!initialized) {
      throw new Error('lncRNA数据未初始化');
    }
  }

  const results = lncRNAData.filter(record =>
    record.target_gene &&
    record.target_gene.toUpperCase() === targetGene.toUpperCase()
  );

  return results.map(record => ({
    id: record.ncRNA_name || '',
    type: 'lncRNA',
    ncRNA_id: record.ncRNA_id || '',
    description: record.description || '',
    experiments: record.experiments || '',
    pmid: record.pmid || '',
    species: record.species || '',
    link: `https://lncipedia.org/db/search?q=${record.ncRNA_name || ''}`,
    interactionID: record.id || ''
  }));
}

// 启动时初始化数据
initializeData();
initializeCSVData();
initializeCircRNAData();
initializeLncRNAData();
