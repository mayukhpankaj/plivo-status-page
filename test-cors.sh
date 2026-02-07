#!/bin/bash

# CORS Test Script
# Tests the backend API for proper CORS headers

BACKEND_URL="https://statusman-476326688061.asia-south1.run.app"
FRONTEND_URL="https://frontend-pi-seven-10.vercel.app"

echo "🔍 Testing CORS Configuration..."
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Preflight request (OPTIONS)
echo "📋 Test 1: Preflight OPTIONS request to /api/organizations"
curl -X OPTIONS "$BACKEND_URL/api/organizations" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v \
  --include \
  --max-time 10

echo ""
echo ""

# Test 2: Actual GET request
echo "📋 Test 2: GET request to /api/organizations"
curl -X GET "$BACKEND_URL/api/organizations" \
  -H "Origin: $FRONTEND_URL" \
  -H "Content-Type: application/json" \
  -v \
  --include \
  --max-time 10

echo ""
echo ""

# Test 3: Health check
echo "📋 Test 3: Health check endpoint"
curl -X GET "$BACKEND_URL/health" \
  -H "Origin: $FRONTEND_URL" \
  -v \
  --include \
  --max-time 10

echo ""
echo "✅ CORS testing complete!"
