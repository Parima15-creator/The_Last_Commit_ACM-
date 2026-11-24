import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from './config/env.js';

import billRoutes from './routes/billRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

validateConfig();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

app.use('/api/bills', billRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'JholFree API Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('JholFree Frontend build not found. Run "npm run build" first.');
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`[JholFree Server] running on http://localhost:${PORT}`);
  if (config.groqApiKey) {
    console.log(`[Groq] Ready with Vision: ${config.groqVisionModel}, Text: ${config.groqTextModel}`);
  } else {
    console.log('[Groq] Disabled. Add GROQ_API_KEY to .env to enable receipt OCR and voice splitting.');
  }
});
