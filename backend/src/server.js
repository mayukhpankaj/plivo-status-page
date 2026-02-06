import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import organizationsRouter from './routes/organizations.js';
import servicesRouter from './routes/services.js';
import incidentsRouter from './routes/incidents.js';
import maintenancesRouter from './routes/maintenances.js';
import publicRouter from './routes/public.js';
import internalRouter, { setPrometheusSync } from './routes/internal.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import PrometheusServiceSync from './services/prometheusSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/organizations', organizationsRouter);
app.use('/api/organizations/:orgId/services', servicesRouter);
app.use('/api/organizations/:orgId/incidents', incidentsRouter);
app.use('/api/organizations/:orgId/maintenances', maintenancesRouter);
app.use('/api/public', publicRouter);
app.use('/api/internal', internalRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Prometheus sync if enabled
if (process.env.PROMETHEUS_SYNC_ENABLED === 'true') {
  const prometheusSync = new PrometheusServiceSync();
  setPrometheusSync(prometheusSync);
  prometheusSync.start();
  console.log('✅ Prometheus service discovery sync enabled');
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
