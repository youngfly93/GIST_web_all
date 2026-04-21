import axios from 'axios';

export async function fetchGeneInfo(symbol) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/gene/${symbol}/json`;
  try {
    const { data } = await axios.get(url);
    if (data.InformationList && data.InformationList.Information.length > 0) {
      const gene = data.InformationList.Information[0];
      return {
        name: gene.Name,
        description: gene.Description,
        url: `https://pubchem.ncbi.nlm.nih.gov/gene/${gene.GeneID}`,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching gene info:', error);
    return null;
  }
}