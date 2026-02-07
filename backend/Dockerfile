# Simple Backend-Only Dockerfile for Cloud Run
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directory for Prometheus service discovery file (for future use)
RUN mkdir -p /etc/prometheus

# Expose port
EXPOSE 8080

# Simple health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the backend
CMD ["node", "src/server.js"]
