import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

let prometheusSync = null;

export function setPrometheusSync(syncInstance) {
  prometheusSync = syncInstance;
}

// Get all services grouped by organization
router.get('/services', asyncHandler(async (req, res) => {
  console.log('[GET /internal/services] Fetching all services for all organizations');

  const { data: organizations, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (orgError) {
    console.error('[GET /internal/services] Error fetching organizations:', orgError);
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }

  const result = [];

  for (const org of organizations) {
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('organization_id', org.id)
      .order('display_order', { ascending: true });

    if (servicesError) {
      console.error(`[GET /internal/services] Error fetching services for org ${org.id}:`, servicesError);
      continue;
    }

    result.push({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug
      },
      services: services || [],
      service_count: services?.length || 0
    });
  }

  console.log('[GET /internal/services] Success: Found', organizations.length, 'organizations');
  
  res.json({
    total_organizations: organizations.length,
    total_services: result.reduce((sum, org) => sum + org.service_count, 0),
    data: result
  });
}));

// Trigger manual Prometheus sync
router.post('/prometheus/sync', asyncHandler(async (req, res) => {
  console.log('[POST /internal/prometheus/sync] Manual sync triggered');

  if (!prometheusSync) {
    return res.status(503).json({ 
      error: 'Prometheus sync service not initialized',
      message: 'PROMETHEUS_SYNC_ENABLED may be disabled'
    });
  }

  const result = await prometheusSync.manualSync();
  
  if (result.success) {
    res.json({
      message: 'Prometheus sync completed successfully',
      ...result
    });
  } else {
    res.status(500).json({
      message: 'Prometheus sync failed',
      ...result
    });
  }
}));

// Get Prometheus sync status
router.get('/prometheus/status', asyncHandler(async (req, res) => {
  console.log('[GET /internal/prometheus/status] Checking sync status');

  if (!prometheusSync) {
    return res.json({
      enabled: false,
      message: 'Prometheus sync is not enabled'
    });
  }

  res.json({
    enabled: true,
    config_path: prometheusSync.configPath,
    sync_interval: prometheusSync.syncInterval,
    message: 'Prometheus sync is active'
  });
}));

export default router;
