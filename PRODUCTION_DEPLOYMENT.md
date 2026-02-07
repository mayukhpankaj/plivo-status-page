# Production Deployment Guide

This guide covers deploying the Status Page application to production.

## Production Environment

- **Frontend**: Vercel - https://frontend-pi-seven-10.vercel.app/
- **Backend**: Google Cloud Run (to be deployed)
- **Database**: Supabase (already configured)

---

## 🚀 Full Stack Deployment (Backend + Monitoring on GCP)

### Prerequisites

1. Google Cloud account with billing enabled
2. gcloud CLI installed: https://cloud.google.com/sdk/docs/install
3. A GCP project created

### Step 1: Setup GCP Project

```bash
# Login to GCP
gcloud auth login

# Set your project (replace with your actual project ID)
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 2: Deploy Full Stack (Recommended)

Use the automated deployment script to deploy everything:

```bash
# Edit the deployment script and set your PROJECT_ID
nano deploy-full-stack-gcp.sh
# Change: PROJECT_ID="your-gcp-project-id"

# Run full stack deployment
./deploy-full-stack-gcp.sh
```

This will deploy:
- **Backend API** (Cloud Run)
- **Prometheus** (Cloud Run) 
- **Grafana** (Cloud Run)
- **Blackbox Exporter** (Cloud Run)

### Step 3: Alternative - Manual Backend Deployment

If you prefer to deploy only the backend first:

#### Create Secrets in Secret Manager

```bash
# Create Supabase URL secret
echo -n "https://drabrfedrqoxjeqleodj.supabase.co" | \
  gcloud secrets create SUPABASE_URL --data-file=-

# Create Supabase Anon Key secret
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjUzMTcsImV4cCI6MjA4NTkwMTMxN30.lsWJovm9RL4CCrUyAGL6bh88fosy1yX__7qYIh8MGrw" | \
  gcloud secrets create SUPABASE_ANON_KEY --data-file=-

# Create Supabase Service Key secret
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNTMxNywiZXhwIjoyMDg1OTAxMzE3fQ.m0kTk4F_B0P0ChUJ0BfJKKg5MCs_MwfEUeAVUaGhYmM" | \
  gcloud secrets create SUPABASE_SERVICE_KEY --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

for SECRET in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

#### Deploy Backend to Cloud Run

#### Option A: Using the deployment script (Recommended)

```bash
cd backend

# Edit deploy-gcp.sh and set your PROJECT_ID
nano deploy-gcp.sh
# Change: PROJECT_ID="your-gcp-project-id"

# Run deployment
./deploy-gcp.sh
```

#### Option B: Manual deployment

```bash
cd backend

# Deploy directly from source
gcloud run deploy status-page-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,PORT=5000,PROMETHEUS_SYNC_ENABLED=true,CORS_ORIGIN=https://frontend-pi-seven-10.vercel.app" \
  --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY:latest"
```

### Step 4: Get Backend URL

```bash
gcloud run services describe status-page-backend \
  --region asia-south1 \
  --format 'value(status.url)'
```

Copy this URL - you'll need it for the frontend configuration and monitoring setup.

---

## 📊 Monitoring Setup (Prometheus + Grafana)

### Option A: Full Stack Deployment (Recommended)

If you used `deploy-full-stack-gcp.sh`, monitoring is already set up!

**Access URLs:**
- **Prometheus**: `https://prometheus-xxxxxxxxxx-uc.a.run.app`
- **Grafana**: `https://grafana-xxxxxxxxxx-uc.a.run.app`
- **Blackbox Exporter**: `https://blackbox-exporter-xxxxxxxxxx-uc.a.run.app`

### Option B: Manual Monitoring Setup

If you deployed only the backend, you can add monitoring separately:

```bash
# Deploy monitoring stack
gcloud run deploy prometheus \
  --image prom/prometheus:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 9090 \
  --memory 1Gi

gcloud run deploy grafana \
  --image grafana/grafana:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "GF_SECURITY_ADMIN_PASSWORD=your-secure-password"

gcloud run deploy blackbox-exporter \
  --image prom/blackbox-exporter:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 9115
```

### Configure Prometheus

1. Update backend environment variables:
```bash
gcloud run services update status-page-backend \
  --region asia-south1 \
  --set-env-vars "PROMETHEUS_URL=https://prometheus-xxxxxxxxxx-uc.a.run.app"
```

2. Configure Prometheus to scrape blackbox exporter and backend metrics

### Configure Grafana

1. Login to Grafana (admin/admin or your set password)
2. Add Prometheus data source: `https://prometheus-xxxxxxxxxx-uc.a.run.app`
3. Import dashboards or create custom ones

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: `frontend`
3. Go to **Settings** → **Environment Variables**
4. Update/Add these variables:

```
VITE_API_URL=<YOUR_CLOUD_RUN_URL>
VITE_SUPABASE_URL=https://drabrfedrqoxjeqleodj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjUzMTcsImV4cCI6MjA4NTkwMTMxN30.lsWJovm9RL4CCrUyAGL6bh88fosy1yX__7qYIh8MGrw
```

### Step 2: Redeploy Frontend

```bash
cd frontend

# Option A: Deploy via Vercel CLI
vercel --prod

# Option B: Push to Git (if connected to GitHub)
git add .
git commit -m "Update production environment"
git push origin main
```

Vercel will automatically redeploy when you push to your repository.

---

## ✅ Verification

### Test Backend

```bash
# Replace with your actual Cloud Run URL
BACKEND_URL="https://status-page-backend-xxx-uc.a.run.app"

# Test health endpoint
curl $BACKEND_URL/health

# Test public status endpoint (replace with your org slug)
curl $BACKEND_URL/api/public/status/plivo
```

### Test Frontend

1. Visit: https://frontend-pi-seven-10.vercel.app/
2. Navigate to a status page
3. Verify data loads correctly
4. Check browser console for any CORS or API errors

---

## 🔧 Configuration Files

### Backend Production Config

File: `backend/.env.production`
- Contains all production environment variables
- **Note**: Secrets should be stored in GCP Secret Manager, not in .env files

### Frontend Production Config

File: `frontend/.env.production`
- Contains frontend environment variables
- Update `VITE_API_URL` after backend deployment

---

## 📊 Monitoring

### Backend Logs (Cloud Run)

```bash
# View recent logs
gcloud run services logs read status-page-backend --region asia-south1

# Follow logs in real-time
gcloud run services logs tail status-page-backend --region asia-south1
```

### Frontend Logs (Vercel)

- Visit: https://vercel.com/dashboard
- Select your project → **Logs** tab

---

## 🔄 Updating Production

### Backend Updates

```bash
cd backend

# Deploy updates
gcloud run deploy status-page-backend --source . --region asia-south1
```

### Frontend Updates

```bash
cd frontend

# Deploy via Vercel CLI
vercel --prod

# Or push to Git (auto-deploys)
git push origin main
```

---

## 🛡️ Security Checklist

- [x] Secrets stored in GCP Secret Manager (not in code)
- [x] CORS configured to only allow frontend domain
- [x] Supabase RLS policies enabled
- [x] Cloud Run service uses least-privilege service account
- [ ] Set up custom domain with SSL (optional)
- [ ] Configure rate limiting (optional)
- [ ] Set up monitoring alerts (optional)

---

## 💰 Cost Optimization

### Cloud Run
- **Min instances**: 0 (scales to zero when idle)
- **Max instances**: 10 (adjust based on traffic)
- **Memory**: 512Mi (sufficient for most workloads)
- **Free tier**: 2 million requests/month

### Vercel
- **Free tier**: Unlimited bandwidth for personal projects
- **Build minutes**: 6000 minutes/month on free tier

### Supabase
- **Free tier**: 500MB database, 2GB bandwidth/month
- Upgrade if you exceed limits

---

## 🐛 Troubleshooting

### CORS Errors

```bash
# Update CORS_ORIGIN in Cloud Run
gcloud run services update status-page-backend \
  --region asia-south1 \
  --update-env-vars CORS_ORIGIN=https://frontend-pi-seven-10.vercel.app
```

### Backend Not Responding

1. Check logs: `gcloud run services logs read status-page-backend --region asia-south1`
2. Verify secrets are accessible
3. Check Supabase connection

### Frontend Not Loading Data

1. Check browser console for errors
2. Verify `VITE_API_URL` is correct in Vercel
3. Test backend API directly with curl

---

## 📞 Support

- **GCP Documentation**: https://cloud.google.com/run/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs

---

## 🎯 Production URLs

- **Frontend**: https://frontend-pi-seven-10.vercel.app/
- **Backend**: `<YOUR_CLOUD_RUN_URL>` (after deployment)
- **Database**: Supabase (managed)

---

## 📝 Next Steps After Deployment

1. ✅ Deploy backend to Cloud Run
2. ✅ Update frontend environment variables in Vercel
3. ✅ Test all functionality
4. ⬜ Set up custom domain (optional)
5. ⬜ Configure monitoring and alerts
6. ⬜ Set up CI/CD pipeline (optional)
7. ⬜ Add rate limiting (optional)
