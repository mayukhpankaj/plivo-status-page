# Docker Setup Guide

This guide explains how to run the Status Page application with Prometheus monitoring using Docker.

## 📋 Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- Supabase account with project created

## 🚀 Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.docker .env
```

Edit `.env` and add your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
CORS_ORIGIN=http://localhost:5173
```

### 2. Start All Services

```bash
docker-compose up -d
```

This will start:
- **Backend API** on `http://localhost:5000`
- **Prometheus** on `http://localhost:9090`
- **Grafana** on `http://localhost:3000` (optional)

### 3. Verify Services

Check if all services are running:

```bash
docker-compose ps
```

Check backend health:

```bash
curl http://localhost:5000/health
```

Check Prometheus targets:

```bash
curl http://localhost:9090/api/v1/targets
```

## 📊 Accessing Services

### Backend API
- URL: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- Internal API: `http://localhost:5000/api/internal/services`

### Prometheus
- URL: `http://localhost:9090`
- Targets: `http://localhost:9090/targets`
- Graph: `http://localhost:9090/graph`

### Grafana (Optional)
- URL: `http://localhost:3000`
- Default credentials:
  - Username: `admin`
  - Password: `admin`

## 🔧 How It Works

### Service Discovery

1. **Backend** periodically fetches all services from Supabase (every 30 seconds)
2. **Backend** writes service targets to `/etc/prometheus/services.json`
3. **Prometheus** watches this file and automatically discovers new targets
4. **Prometheus** scrapes metrics from discovered services

### Shared Volume

The `prometheus-config` volume is shared between backend and Prometheus:
- Backend writes to: `/etc/prometheus/services.json`
- Prometheus reads from: `/etc/prometheus/services.json`

## 📝 Prometheus Queries

Once services are discovered, you can query them in Prometheus:

```promql
# Check all discovered services
up{job="dynamic-services"}

# Query by organization
up{org_id="your-org-id"}

# Query by service
up{service_id="your-service-id"}

# Query by organization name
up{org_name="plivo"}

# Query by service name
up{service_name="live_kit_infra"}
```

## 🛠️ Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Prometheus only
docker-compose logs -f prometheus
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

### Rebuild Backend

```bash
docker-compose up -d --build backend
```

## 🔍 Troubleshooting

### Backend not starting

Check logs:
```bash
docker-compose logs backend
```

Verify environment variables:
```bash
docker-compose exec backend env | grep SUPABASE
```

### Prometheus not discovering services

1. Check if backend is writing the file:
```bash
docker-compose exec backend cat /etc/prometheus/services.json
```

2. Check Prometheus configuration:
```bash
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml
```

3. Check Prometheus targets page: `http://localhost:9090/targets`

### Service discovery file not updating

Trigger manual sync:
```bash
curl -X POST http://localhost:5000/api/internal/prometheus/sync
```

Check sync status:
```bash
curl http://localhost:5000/api/internal/prometheus/status
```

## 📦 Production Deployment

For production, consider:

1. **Use secrets management** instead of `.env` file
2. **Configure persistent volumes** for Prometheus data
3. **Set up proper networking** with reverse proxy (nginx/traefik)
4. **Enable authentication** for Prometheus and Grafana
5. **Configure alerting** in Prometheus
6. **Set resource limits** in docker-compose.yml

Example resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 🔐 Security Notes

- Change default Grafana password immediately
- Use strong passwords for all services
- Enable authentication for Prometheus in production
- Use HTTPS in production
- Restrict network access to monitoring services
- Regularly update Docker images

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Grafana Documentation](https://grafana.com/docs/)
