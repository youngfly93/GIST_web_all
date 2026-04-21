import express from 'express';
import { fetchGeneInfo } from '../services/geneFetcher.js';
const router = express.Router();

router.get('/:symbol', async (req, res) => {
  try {
    const data = await fetchGeneInfo(req.params.symbol);
    if (!data) return res.status(404).json({ error: 'Gene not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Gene fetch failed' });
  }
});

export default router;