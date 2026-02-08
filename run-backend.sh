#!/bin/bash

# Run Status Page Backend with Monitoring Stack
echo "🚀 Starting Status Page Backend with Monitoring..."

# Stop existing container if running
sudo docker stop statusman-backend 2>/dev/null
sudo docker rm statusman-backend 2>/dev/null

# Build and run the container
echo "📦 Building Docker image..."
sudo docker build -t statusman-local .

echo "🔥 Starting container with monitoring..."
sudo docker run -d -p 8080:8080 -p 9091:9090 -p 9116:9115 --name statusman-backend \
  -e NODE_ENV=development \
  -e PORTNO=8080 \
  -e CORS_ORIGIN=http://localhost:5173 \
  -e PROMETHEUS_SYNC_ENABLED=true \
  -e SUPABASE_URL=https://drabrfedrqoxjeqleodj.supabase.co \
  -e SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjUzMTcsImV4cCI6MjA4NTkwMTMxN30.lsWJovm9RL4CCrUyAGL6bh88fosy1yX__7qYIh8MGrw \
  -e SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNTMxNywiZXhwIjoyMDg1OTAxMzE3fQ.m0kTk4F_B0P0ChUJ0BfJKKg5MCs_MwfEUeAVUaGhYmM \
  statusman-local

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Services are running!"
echo "📊 Backend API: http://localhost:8080"
echo "📈 Prometheus UI: http://localhost:9091"
echo "🔍 Blackbox Exporter: http://localhost:9116"
echo ""
echo "🔍 Check logs: sudo docker logs statusman-backend"
echo "🛑 Stop services: sudo docker stop statusman-backend"
