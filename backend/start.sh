#!/bin/sh

echo "Starting Blackbox Exporter..."
# Start Blackbox Exporter in background
blackbox_exporter --config.file=/etc/blackbox_exporter/config.yml &
BLACKBOX_PID=$!

echo "Starting Prometheus..."
# Wait a moment for blackbox to start
sleep 2
# Start Prometheus in background
prometheus --config.file=/etc/prometheus/prometheus.yml \
         --storage.tsdb.path=/prometheus \
         --web.console.libraries=/usr/share/prometheus/console_libraries \
         --web.console.templates=/usr/share/prometheus/consoles \
         --web.listen-address=:9090 &
PROMETHEUS_PID=$!

echo "Waiting for Prometheus to be ready..."
# Wait for Prometheus to be ready
for i in 1 2 3 4 5; do
  if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "Prometheus is ready"
    break
  fi
  echo "Waiting for Prometheus... ($i/5)"
  sleep 2
done

echo "Starting Backend..."
# Start backend in foreground
node src/server.js
