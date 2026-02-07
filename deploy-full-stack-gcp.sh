#!/bin/bash

# GCP Full Stack Deployment Script for Status Page
# Deploys Backend + Monitoring Stack to GCP

# Configuration
PROJECT_ID="your-gcp-project-id"  # CHANGE THIS to your GCP project ID
REGION="asia-south1"  # Mumbai region, change as needed
BACKEND_SERVICE_NAME="status-page-backend"
PROMETHEUS_SERVICE_NAME="prometheus"
GRAFANA_SERVICE_NAME="grafana"
BLACKBOX_SERVICE_NAME="blackbox-exporter"
FRONTEND_URL="https://frontend-pi-seven-10.vercel.app"
GRAFANA_ADMIN_PASSWORD="secure-password-change-me"  # Change this!

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Full Stack (Backend + Monitoring) to GCP Cloud Run...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}Please login to GCP...${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}Setting GCP project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create secrets if they don't exist
echo -e "${YELLOW}Setting up secrets...${NC}"

# Supabase secrets
if ! gcloud secrets describe SUPABASE_URL &> /dev/null; then
    echo -n "https://drabrfedrqoxjeqleodj.supabase.co" | gcloud secrets create SUPABASE_URL --data-file=-
fi

if ! gcloud secrets describe SUPABASE_ANON_KEY &> /dev/null; then
    echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjUzMTcsImV4cCI6MjA4NTkwMTMxN30.lsWJovm9RL4CCrUyAGL6bh88fosy1yX__7qYIh8MGrw" | gcloud secrets create SUPABASE_ANON_KEY --data-file=-
fi

if ! gcloud secrets describe SUPABASE_SERVICE_KEY &> /dev/null; then
    echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNTMxNywiZXhwIjoyMDg1OTAxMzE3fQ.m0kTk4F_B0P0ChUJ0BfJKKg5MCs_MwfEUeAVUaGhYmM" | gcloud secrets create SUPABASE_SERVICE_KEY --data-file=-
fi

# Grafana admin password
if ! gcloud secrets describe GRAFANA_ADMIN_PASSWORD &> /dev/null; then
    echo -n "${GRAFANA_ADMIN_PASSWORD}" | gcloud secrets create GRAFANA_ADMIN_PASSWORD --data-file=-
fi

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")

for SECRET in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_KEY GRAFANA_ADMIN_PASSWORD; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" &> /dev/null
done

# Deploy Backend
echo -e "${YELLOW}Building and deploying Backend...${NC}"
cd backend

BACKEND_IMAGE_NAME="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE_NAME}"
gcloud builds submit --tag ${BACKEND_IMAGE_NAME} --quiet

gcloud run deploy ${BACKEND_SERVICE_NAME} \
    --image ${BACKEND_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 5000 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production,PORT=5000,PROMETHEUS_SYNC_ENABLED=true,CORS_ORIGIN=${FRONTEND_URL}" \
    --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY:latest"

# Deploy Prometheus
echo -e "${YELLOW}Deploying Prometheus...${NC}"
PROMETHEUS_IMAGE_NAME="gcr.io/${PROJECT_ID}/${PROMETHEUS_SERVICE_NAME}"

# Create a simple Prometheus Dockerfile for Cloud Run
cat > Dockerfile.prometheus << 'EOF'
FROM prom/prometheus:latest
COPY prometheus.yml /etc/prometheus/prometheus.yml
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--web.enable-lifecycle"]
EOF

gcloud builds submit --tag ${PROMETHEUS_IMAGE_NAME} --file Dockerfile.prometheus --quiet

gcloud run deploy ${PROMETHEUS_SERVICE_NAME} \
    --image ${PROMETHEUS_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 9090 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 2 \
    --timeout 300

# Deploy Grafana
echo -e "${YELLOW}Deploying Grafana...${NC}"
GRAFANA_IMAGE_NAME="gcr.io/${PROJECT_ID}/${GRAFANA_SERVICE_NAME}"

# Create a simple Grafana Dockerfile for Cloud Run
cat > Dockerfile.grafana << 'EOF'
FROM grafana/grafana:latest
ENV GF_SECURITY_ADMIN_PASSWORD__FILE=/etc/secrets/admin_password
ENV GF_INSTALL_PLUGINS=grafana-piechart-panel
COPY --from=secrets /etc/secrets/admin_password /etc/secrets/admin_password
EOF

gcloud builds submit --tag ${GRAFANA_IMAGE_NAME} --file Dockerfile.grafana --quiet

gcloud run deploy ${GRAFANA_SERVICE_NAME} \
    --image ${GRAFANA_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 3000 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 2 \
    --timeout 300 \
    --set-secrets "GF_SECURITY_ADMIN_PASSWORD__FILE=GRAFANA_ADMIN_PASSWORD:latest"

# Deploy Blackbox Exporter
echo -e "${YELLOW}Deploying Blackbox Exporter...${NC}"
BLACKBOX_IMAGE_NAME="gcr.io/${PROJECT_ID}/${BLACKBOX_SERVICE_NAME}"

# Create a simple Blackbox Exporter Dockerfile for Cloud Run
cat > Dockerfile.blackbox << 'EOF'
FROM prom/blackbox-exporter:latest
COPY blackbox.yml /etc/blackbox_exporter/config.yml
CMD ["--config.file=/etc/blackbox_exporter/config.yml"]
EOF

gcloud builds submit --tag ${BLACKBOX_IMAGE_NAME} --file Dockerfile.blackbox --quiet

gcloud run deploy ${BLACKBOX_SERVICE_NAME} \
    --image ${BLACKBOX_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 9115 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 2 \
    --timeout 300

# Get service URLs
BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
PROMETHEUS_URL=$(gcloud run services describe ${PROMETHEUS_SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
GRAFANA_URL=$(gcloud run services describe ${GRAFANA_SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
BLACKBOX_URL=$(gcloud run services describe ${BLACKBOX_SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

# Cleanup temporary Dockerfiles
rm -f Dockerfile.prometheus Dockerfile.grafana Dockerfile.blackbox

echo -e "${GREEN}✅ Full Stack Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo -e "${GREEN}Backend API:${NC}     ${BACKEND_URL}"
echo -e "${GREEN}Prometheus:${NC}      ${PROMETHEUS_URL}"
echo -e "${GREEN}Grafana:${NC}         ${GRAFANA_URL}"
echo -e "${GREEN}Blackbox Exporter:${NC} ${BLACKBOX_URL}"
echo ""
echo -e "${YELLOW}📊 Grafana Login:${NC}"
echo -e "${GREEN}Username:${NC} admin"
echo -e "${GREEN}Password:${NC} ${GRAFANA_ADMIN_PASSWORD}"
echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. Update your frontend VITE_API_URL to: ${BACKEND_URL}"
echo "2. Configure Prometheus data source in Grafana: ${PROMETHEUS_URL}"
echo "3. Update backend to use Cloud Run service names for monitoring"
echo "4. Test all services are accessible"
echo ""
echo -e "${BLUE}📋 Testing Commands:${NC}"
echo "curl ${BACKEND_URL}/health"
echo "curl ${PROMETHEUS_URL}/api/v1/query?query=up"
echo "curl ${BLACKBOX_URL}/metrics"
