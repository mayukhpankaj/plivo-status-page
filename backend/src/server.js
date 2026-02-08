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

// Debug logging for environment variables
console.log('🔧 Environment Variables:');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORTNO:', process.env.PORTNO);

const app = express();
const PORTNO = process.env.PORTNO || 8080;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Configure CORS with explicit options
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'https://frontend-pi-seven-10.vercel.app',
      'https://frontend-pi-seven-10.vercel.app/'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'https://frontend-pi-seven-10.vercel.app',
    'https://frontend-pi-seven-10.vercel.app/'
  ];
  
  // Set the origin header if it matches or if there's no origin
  if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }
  
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

app.listen(PORTNO, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORTNO}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORTNO}/health`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Handle startup errors
app.on('error', (error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

export default app;
