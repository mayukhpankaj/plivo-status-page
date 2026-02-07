#!/bin/sh

echo "Starting monitoring services..."

# Start Blackbox Exporter in background
blackbox_exporter --config.file=/etc/blackbox_exporter/config.yml &
echo "Blackbox Exporter started (PID: $!)"

# Start Prometheus in background
prometheus --config.file=/etc/prometheus/prometheus.yml \
         --storage.tsdb.path=/prometheus \
         --web.console.libraries=/usr/share/prometheus/console_libraries \
         --web.console.templates=/usr/share/prometheus/consoles \
         --web.listen-address=:9090 &
echo "Prometheus started (PID: $!)"

# Give services a moment to start
sleep 5

echo "Starting Backend..."
# Start backend in foreground (this will keep the container running)
exec node src/server.js
