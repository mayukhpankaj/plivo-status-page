#!/bin/bash

# Quick test to bypass Cloud Run and check if container works
echo "🔍 Testing if we can reach the service at all..."

# Test with different user agents to see if it's an auth issue
echo "Test 1: Basic curl without origin"
curl -X GET "https://statusman-476326688061.asia-south1.run.app/health" \
  --user-agent "Mozilla/5.0" \
  --max-time 10 \
  -v

echo ""
echo "Test 2: Try without any headers"
curl -X GET "https://statusman-476326688061.asia-south1.run.app/health" \
  --max-time 10 \
  -v

echo ""
echo "Test 3: Try POST to see if it's method-specific"
curl -X POST "https://statusman-476326688061.asia-south1.run.app/health" \
  --max-time 10 \
  -v
