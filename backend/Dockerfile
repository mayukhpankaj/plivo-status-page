# Multi-stage build for Backend + Prometheus + Blackbox Exporter

# Stage 1: Prometheus
FROM prom/prometheus:latest as prometheus-stage

# Stage 2: Blackbox Exporter
FROM prom/blackbox-exporter:latest as blackbox-stage

# Stage 3: Backend with monitoring tools included
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy Prometheus binaries from stage 1
COPY --from=prometheus-stage /bin/prometheus /usr/local/bin/prometheus
COPY --from=prometheus-stage /bin/promtool /usr/local/bin/promtool

# Copy Blackbox Exporter from stage 2
COPY --from=blackbox-stage /bin/blackbox_exporter /usr/local/bin/blackbox_exporter

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Copy Prometheus configuration
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Copy Blackbox Exporter configuration
COPY blackbox.yml /etc/blackbox_exporter/config.yml

# Create directory for Prometheus service discovery file
RUN mkdir -p /etc/prometheus

# Expose ports
EXPOSE 8080 9090 9115

# Health check for backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start script to run both processes
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
