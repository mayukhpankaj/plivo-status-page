# Production Environment Setup - Quick Reference

## 📋 Environment Variables Summary

### Frontend (Vercel)

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
VITE_API_URL=<YOUR_CLOUD_RUN_URL>
VITE_SUPABASE_URL=https://drabrfedrqoxjeqleodj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjUzMTcsImV4cCI6MjA4NTkwMTMxN30.lsWJovm9RL4CCrUyAGL6bh88fosy1yX__7qYIh8MGrw
```

### Backend (Google Cloud Run)

Set these as **Secrets** in GCP Secret Manager:

```bash
# Create secrets
echo -n "https://drabrfedrqoxjeqleodj.supabase.co" | gcloud secrets create SUPABASE_URL --data-file=-
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjUzMTcsImV4cCI6MjA4NTkwMTMxN30.lsWJovm9RL4CCrUyAGL6bh88fosy1yX__7qYIh8MGrw" | gcloud secrets create SUPABASE_ANON_KEY --data-file=-
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWJyZmVkcnFveGplcWxlb2RqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNTMxNywiZXhwIjoyMDg1OTAxMzE3fQ.m0kTk4F_B0P0ChUJ0BfJKKg5MCs_MwfEUeAVUaGhYmM" | gcloud secrets create SUPABASE_SERVICE_KEY --data-file=-
```

Set these as **Environment Variables** in Cloud Run:

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://frontend-pi-seven-10.vercel.app
PROMETHEUS_SYNC_ENABLED=false
```

---

## 🚀 Quick Deploy Commands

### Backend (Cloud Run)

```bash
cd backend

# Edit PROJECT_ID in deploy-gcp.sh first
nano deploy-gcp.sh

# Deploy
./deploy-gcp.sh
```

### Frontend (Vercel)

```bash
cd frontend

# Deploy
vercel --prod
```

---

## 🔗 Production URLs

- **Frontend**: https://frontend-pi-seven-10.vercel.app/
- **Backend**: Will be generated after Cloud Run deployment
  - Format: `https://status-page-backend-XXXXXXXXXX-uc.a.run.app`

---

## ⚡ One-Command Deploy (Backend)

After setting up secrets and PROJECT_ID:

```bash
cd backend && gcloud run deploy status-page-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,PORT=5000,PROMETHEUS_SYNC_ENABLED=false,CORS_ORIGIN=https://frontend-pi-seven-10.vercel.app" \
  --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY:latest"
```

---

## 📝 Post-Deployment Checklist

1. ✅ Deploy backend to Cloud Run
2. ✅ Copy the Cloud Run URL
3. ✅ Update `VITE_API_URL` in Vercel with Cloud Run URL
4. ✅ Redeploy frontend on Vercel
5. ✅ Test: Visit https://frontend-pi-seven-10.vercel.app/
6. ✅ Verify API calls work (check browser console)

---

## 🧪 Testing

```bash
# Test backend health
curl https://your-backend-url.run.app/health

# Test API endpoint
curl https://your-backend-url.run.app/api/public/status/plivo
```

---

## 📚 Full Documentation

See `PRODUCTION_DEPLOYMENT.md` for complete deployment guide.
