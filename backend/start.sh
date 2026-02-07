#!/bin/sh

# Start Blackbox Exporter in background
blackbox_exporter --config.file=/etc/blackbox_exporter/config.yml &

# Start Prometheus in background
prometheus --config.file=/etc/prometheus/prometheus.yml \
         --storage.tsdb.path=/prometheus \
         --web.console.libraries=/usr/share/prometheus/console_libraries \
         --web.console.templates=/usr/share/prometheus/consoles \
         --web.listen-address=:9090 &

# Start backend in foreground
node src/server.js
