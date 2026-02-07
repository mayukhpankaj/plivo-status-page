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
import PrometheusServiceSync, { setPrometheusSyncInstance } from './services/prometheusSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

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
  setPrometheusSyncInstance(prometheusSync);
  
  // Initialize sync on startup (runs once, no periodic syncing)
  prometheusSync.initialize().then(result => {
    if (result.success) {
      console.log('✅ Prometheus service discovery sync initialized successfully');
    } else {
      console.error('❌ Prometheus service discovery sync initialization failed:', result.error);
    }
  }).catch(error => {
    console.error('❌ Prometheus service discovery sync initialization error:', error);
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
