import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../utils/helpers.js';
import axios from 'axios';

const router = express.Router();

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';

router.get('/status/:orgSlug', asyncHandler(async (req, res) => {
  const { orgSlug } = req.params;

  const { data: organization, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug, description, logo_url, website_url')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const { data: services, error: servicesError } = await supabaseAdmin
    .from('services')
    .select('id, name, description, current_status, display_order')
    .eq('organization_id', organization.id)
    .order('display_order', { ascending: true });

  if (servicesError) {
    return res.status(500).json({ error: 'Failed to fetch services' });
  }

  const { data: activeIncidents, error: incidentsError } = await supabaseAdmin
    .from('incidents')
    .select(`
      id,
      title,
      description,
      status,
      impact,
      started_at,
      resolved_at,
      incident_services (
        service_id,
        services (
          id,
          name
        )
      ),
      incident_updates (
        id,
        status,
        message,
        created_at
      )
    `)
    .eq('organization_id', organization.id)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false });

  if (incidentsError) {
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }

  const { data: recentIncidents, error: recentError } = await supabaseAdmin
    .from('incidents')
    .select(`
      id,
      title,
      status,
      impact,
      started_at,
      resolved_at
    `)
    .eq('organization_id', organization.id)
    .eq('status', 'resolved')
    .order('resolved_at', { ascending: false })
    .limit(10);

  if (recentError) {
    return res.status(500).json({ error: 'Failed to fetch recent incidents' });
  }

  const now = new Date();
  const { data: upcomingMaintenances, error: maintenancesError } = await supabaseAdmin
    .from('maintenances')
    .select(`
      id,
      title,
      description,
      status,
      scheduled_start,
      scheduled_end,
      maintenance_services (
        service_id,
        services (
          id,
          name
        )
      )
    `)
    .eq('organization_id', organization.id)
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_end', now.toISOString())
    .order('scheduled_start', { ascending: true });

  if (maintenancesError) {
    return res.status(500).json({ error: 'Failed to fetch maintenances' });
  }

  const formattedIncidents = activeIncidents.map(incident => ({
    ...incident,
    affected_services: incident.incident_services.map(is => is.services),
    updates: incident.incident_updates.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )
  }));

  const formattedMaintenances = upcomingMaintenances.map(maintenance => ({
    ...maintenance,
    affected_services: maintenance.maintenance_services.map(ms => ms.services)
  }));

  let overallStatus = 'operational';
  const hasOutage = services.some(s => s.current_status === 'major_outage');
  const hasPartialOutage = services.some(s => s.current_status === 'partial_outage');
  const hasDegraded = services.some(s => s.current_status === 'degraded_performance');

  if (hasOutage) {
    overallStatus = 'major_outage';
  } else if (hasPartialOutage) {
    overallStatus = 'partial_outage';
  } else if (hasDegraded) {
    overallStatus = 'degraded_performance';
  }

  res.json({
    organization,
    overall_status: overallStatus,
    services,
    active_incidents: formattedIncidents,
    recent_incidents: recentIncidents,
    upcoming_maintenances: formattedMaintenances
  });
}));

router.get('/status/:orgSlug/:serviceId', asyncHandler(async (req, res) => {
  const { orgSlug, serviceId } = req.params;
  const { timeRange = '1h' } = req.query;

  const { data: organization, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug, description, logo_url, website_url')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, name, description, current_status, target_url, display_order')
    .eq('id', serviceId)
    .eq('organization_id', organization.id)
    .single();

  if (serviceError || !service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const { data: incidents, error: incidentsError } = await supabaseAdmin
    .from('incidents')
    .select(`
      id,
      title,
      description,
      status,
      impact,
      started_at,
      resolved_at,
      incident_services!inner (
        service_id
      ),
      incident_updates (
        id,
        status,
        message,
        created_at
      )
    `)
    .eq('incident_services.service_id', serviceId)
    .order('started_at', { ascending: false })
    .limit(10);

  if (incidentsError) {
    console.error('Error fetching incidents:', incidentsError);
  }

  const formattedIncidents = (incidents || []).map(incident => ({
    ...incident,
    updates: incident.incident_updates?.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    ) || []
  }));

  let metrics = null;
  try {
    const timeRangeMap = {
      '1h': '1h',
      '6h': '6h',
      '24h': '24h',
      '7d': '7d',
      '30d': '30d'
    };
    const range = timeRangeMap[timeRange] || '1h';
    
    const step = timeRange === '1h' ? '1m' : 
                 timeRange === '6h' ? '5m' : 
                 timeRange === '24h' ? '15m' : 
                 timeRange === '7d' ? '1h' : '2h';

    const queries = {
      uptime: `up{service_id="${serviceId}"}`,
      responseTime: `probe_duration_seconds{service_id="${serviceId}"}`,
      httpStatus: `probe_http_status_code{service_id="${serviceId}"}`,
      sslExpiry: `probe_ssl_earliest_cert_expiry{service_id="${serviceId}"}`
    };

    const metricsData = {};
    
    for (const [key, query] of Object.entries(queries)) {
      try {
        console.log(`Querying ${key} with:`, query);
        const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
          params: {
            query,
            start: Math.floor(Date.now() / 1000) - parseTimeRange(range),
            end: Math.floor(Date.now() / 1000),
            step
          },
          timeout: 5000
        });

        if (response.data.status === 'success' && response.data.data.result.length > 0) {
          console.log(`Success for ${key}:`, response.data.data.result.length, 'data points');
          metricsData[key] = response.data.data.result[0].values.map(([timestamp, value]) => ({
            timestamp: timestamp * 1000,
            value: parseFloat(value)
          }));
        } else {
          console.log(`No data for ${key}:`, response.data.status, response.data.data.result.length);
          metricsData[key] = [];
        }
      } catch (error) {
        console.error(`Error fetching ${key} metric:`, error.message);
        if (error.response) {
          console.error(`Response status:`, error.response.status);
          console.error(`Response data:`, JSON.stringify(error.response.data, null, 2));
        }
        metricsData[key] = [];
      }
    }

    const currentQuery = `up{service_id="${serviceId}"}`;
    try {
      const currentResponse = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
        params: { query: currentQuery },
        timeout: 5000
      });

      if (currentResponse.data.status === 'success' && currentResponse.data.data.result.length > 0) {
        const result = currentResponse.data.data.result[0];
        metricsData.current = {
          up: parseFloat(result.value[1]) === 1,
          timestamp: result.value[0] * 1000
        };
      }
    } catch (error) {
      console.error('Error fetching current status:', error.message);
    }

    metrics = metricsData;
  } catch (error) {
    console.error('Error querying Prometheus:', error.message);
    metrics = { error: 'Failed to fetch metrics from Prometheus' };
  }

  res.json({
    organization,
    service,
    incidents: formattedIncidents,
    metrics
  });
}));

function parseTimeRange(range) {
  const units = {
    'm': 60,
    'h': 3600,
    'd': 86400
  };
  
  const match = range.match(/^(\d+)([mhd])$/);
  if (!match) return 3600;
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

export default router;
