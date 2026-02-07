#!/bin/bash

# Simple test to check if backend is running
BACKEND_URL="https://statusman-476326688061.asia-south1.run.app"

echo "🔍 Testing backend service..."
echo "URL: $BACKEND_URL"
echo ""

# Test without Origin header first
echo "📋 Test 1: Basic health check (no Origin)"
curl -X GET "$BACKEND_URL/health" \
  --max-time 10 \
  --include \
  --silent | head -20

echo ""
echo ""

# Test with Origin header
echo "📋 Test 2: Health check with Origin header"
curl -X GET "$BACKEND_URL/health" \
  -H "Origin: https://frontend-pi-seven-10.vercel.app" \
  --max-time 10 \
  --include \
  --silent | head -20

echo ""
echo ""

# Test the actual endpoint
echo "📋 Test 3: Organizations endpoint with Origin"
curl -X GET "$BACKEND_URL/api/organizations" \
  -H "Origin: https://frontend-pi-seven-10.vercel.app" \
  --max-time 10 \
  --include \
  --silent | head -20

echo ""
echo "✅ Testing complete!"
