import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import geneRouter from './routes/gene.js';
import proxyRouter from './routes/proxy.js';
import ncRNARouter from './routes/ncrna.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/chat', chatRouter);
app.use('/api/gene', geneRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/ncrna', ncRNARouter);

const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => console.log(`Backend running on ${HOST}:${PORT}`));