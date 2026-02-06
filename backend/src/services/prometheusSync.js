import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';

class PrometheusServiceSync {
  constructor(configPath) {
    this.configPath = configPath || process.env.PROMETHEUS_SERVICES_FILE || './prometheus-services.json';
    this.syncInterval = parseInt(process.env.PROMETHEUS_SYNC_INTERVAL || '30000'); // 30 seconds default
    this.intervalId = null;
    
    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async fetchAllServices() {
    console.log('[Prometheus Sync] Fetching all services from database');

    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug');

    if (orgError) {
      console.error('[Prometheus Sync] Error fetching organizations:', orgError);
      throw orgError;
    }

    const allServices = [];

    for (const org of organizations) {
      const { data: services, error: servicesError } = await supabaseAdmin
        .from('services')
        .select('id, name, target_url, current_status')
        .eq('organization_id', org.id);

      if (servicesError) {
        console.error(`[Prometheus Sync] Error fetching services for org ${org.id}:`, servicesError);
        continue;
      }

      services.forEach(service => {
        // Only add services that have a target_url
        if (service.target_url) {
          allServices.push({
            organizationId: org.id,
            organizationName: org.name,
            organizationSlug: org.slug,
            serviceId: service.id,
            serviceName: service.name,
            targetUrl: service.target_url,
            status: service.current_status
          });
        }
      });
    }

    console.log(`[Prometheus Sync] Found ${allServices.length} services with target URLs`);
    return allServices;
  }

  formatForPrometheus(services) {
    return services.map(service => {
      return {
        targets: [service.targetUrl],
        labels: {
          org_id: service.organizationId,
          org_name: service.organizationSlug,
          service_id: service.serviceId,
          service_name: service.serviceName.toLowerCase().replace(/\s+/g, '_')
        }
      };
    });
  }

  async syncToFile() {
    try {
      console.log('[Prometheus Sync] Starting sync...');
      
      const services = await this.fetchAllServices();
      const prometheusConfig = this.formatForPrometheus(services);
      
      // Write to file atomically (write to temp file, then rename)
      const tempPath = `${this.configPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(prometheusConfig, null, 2), 'utf8');
      fs.renameSync(tempPath, this.configPath);
      
      console.log(`[Prometheus Sync] Successfully synced ${services.length} services to ${this.configPath}`);
      
      return {
        success: true,
        servicesCount: services.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Prometheus Sync] Error during sync:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  start() {
    console.log(`[Prometheus Sync] Starting periodic sync every ${this.syncInterval}ms`);
    console.log(`[Prometheus Sync] Config file: ${this.configPath}`);
    
    // Initial sync
    this.syncToFile();
    
    // Set up periodic sync
    this.intervalId = setInterval(() => {
      this.syncToFile();
    }, this.syncInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Prometheus Sync] Stopped periodic sync');
    }
  }

  async manualSync() {
    console.log('[Prometheus Sync] Manual sync triggered');
    return await this.syncToFile();
  }
}

export default PrometheusServiceSync;
