#!/bin/sh

echo "Starting monitoring services..."

# Start Blackbox Exporter in background
blackbox_exporter --config.file=/etc/blackbox_exporter/config.yml &
BLACKBOX_PID=$!
echo "Blackbox Exporter started (PID: $BLACKBOX_PID)"

# Start Prometheus in background
prometheus --config.file=/etc/prometheus/prometheus.yml \
         --storage.tsdb.path=/prometheus \
         --web.console.libraries=/usr/share/prometheus/console_libraries \
         --web.console.templates=/usr/share/prometheus/consoles \
         --web.listen-address=127.0.0.1:9090 &
PROMETHEUS_PID=$!
echo "Prometheus started (PID: $PROMETHEUS_PID)"

# Give services time to start
echo "Waiting for services to be ready..."
sleep 10

# Check if Prometheus is responding
echo "Checking Prometheus health..."
for i in 1 2 3 4 5; do
    if curl -s http://127.0.0.1:9090/-/healthy > /dev/null 2>&1; then
        echo "✅ Prometheus is healthy"
        break
    else
        echo "⏳ Waiting for Prometheus... (attempt $i/5)"
        sleep 2
    fi
done

# Check if Blackbox Exporter is responding
echo "Checking Blackbox Exporter health..."
for i in 1 2 3 4 5; do
    if curl -s http://127.0.0.1:9115/-/healthy > /dev/null 2>&1; then
        echo "✅ Blackbox Exporter is healthy"
        break
    else
        echo "⏳ Waiting for Blackbox Exporter... (attempt $i/5)"
        sleep 2
    fi
done

echo "Starting Backend..."
# Start backend in foreground (this will keep the container running)
exec node src/server.js
