# Deploy Backend to Google Cloud Platform (Cloud Run)

This guide will help you deploy the Status Page backend to GCP Cloud Run.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed locally (for testing)

## Setup Steps

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Follow instructions at: https://cloud.google.com/sdk/docs/install

# Login to your Google account
gcloud auth login

# Set your project ID (replace with your actual project ID)
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Secrets in Google Secret Manager

Store your sensitive environment variables as secrets:

```bash
# Create Supabase URL secret
echo -n "https://your-supabase-url.supabase.co" | gcloud secrets create SUPABASE_URL --data-file=-

# Create Supabase Anon Key secret
echo -n "your-supabase-anon-key" | gcloud secrets create SUPABASE_ANON_KEY --data-file=-

# Create Supabase Service Key secret
echo -n "your-supabase-service-key" | gcloud secrets create SUPABASE_SERVICE_KEY --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding SUPABASE_URL \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SUPABASE_ANON_KEY \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SUPABASE_SERVICE_KEY \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy Using gcloud Command

#### Option A: Quick Deploy (Recommended)

```bash
cd backend

# Build and deploy in one command
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
  --set-env-vars "NODE_ENV=production,PORT=5000,PROMETHEUS_SYNC_ENABLED=false,CORS_ORIGIN=https://your-frontend-domain.vercel.app" \
  --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY:latest"
```

#### Option B: Using the Deployment Script

```bash
cd backend

# Make the script executable
chmod +x deploy-gcp.sh

# Edit the script to set your PROJECT_ID
nano deploy-gcp.sh

# Run the deployment script
./deploy-gcp.sh
```

#### Option C: Manual Build and Deploy

```bash
cd backend

# Build the container image
gcloud builds submit --tag gcr.io/$PROJECT_ID/status-page-backend

# Deploy to Cloud Run
gcloud run deploy status-page-backend \
  --image gcr.io/$PROJECT_ID/status-page-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "NODE_ENV=production,PORT=5000,PROMETHEUS_SYNC_ENABLED=false,CORS_ORIGIN=https://your-frontend-domain.vercel.app" \
  --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY:latest"
```

### 4. Get Your Service URL

After deployment, get your Cloud Run service URL:

```bash
gcloud run services describe status-page-backend \
  --platform managed \
  --region asia-south1 \
  --format 'value(status.url)'
```

### 5. Update Frontend Configuration

Update your Vercel frontend environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_API_URL` to your Cloud Run URL (e.g., `https://status-page-backend-xxx-uc.a.run.app`)
3. Redeploy your frontend

### 6. Update CORS Configuration

Update the CORS_ORIGIN environment variable in Cloud Run:

```bash
gcloud run services update status-page-backend \
  --region asia-south1 \
  --update-env-vars CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## Configuration Options

### Environment Variables

- `NODE_ENV`: Set to `production`
- `PORT`: Set to `5000` (Cloud Run default)
- `SUPABASE_URL`: Your Supabase project URL (stored as secret)
- `SUPABASE_ANON_KEY`: Your Supabase anon key (stored as secret)
- `SUPABASE_SERVICE_KEY`: Your Supabase service key (stored as secret)
- `CORS_ORIGIN`: Your frontend domain
- `PROMETHEUS_SYNC_ENABLED`: Set to `false` (Prometheus not needed on Cloud Run)

### Resource Limits

- **Memory**: 512Mi (can increase if needed)
- **CPU**: 1 (can increase for better performance)
- **Min Instances**: 0 (scales to zero when not in use)
- **Max Instances**: 10 (adjust based on expected traffic)
- **Timeout**: 300 seconds

## Testing Your Deployment

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe status-page-backend --platform managed --region asia-south1 --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health

# Test public status endpoint (replace with your org slug)
curl $SERVICE_URL/api/public/status/your-org-slug
```

## Monitoring and Logs

View logs in Cloud Console:
```bash
gcloud run services logs read status-page-backend --region asia-south1
```

Or visit: https://console.cloud.google.com/run

## Cost Optimization

Cloud Run pricing is based on:
- Request count
- CPU and memory usage
- Network egress

With `min-instances: 0`, the service scales to zero when idle, minimizing costs.

## Troubleshooting

### Issue: Service fails to start
- Check logs: `gcloud run services logs read status-page-backend --region asia-south1`
- Verify secrets are accessible
- Ensure PORT environment variable is set to 5000

### Issue: CORS errors
- Update CORS_ORIGIN to match your frontend domain
- Ensure it includes the protocol (https://)

### Issue: Database connection fails
- Verify Supabase credentials in Secret Manager
- Check if Supabase allows connections from Cloud Run IPs

## Updating Your Deployment

To deploy updates:

```bash
cd backend
gcloud run deploy status-page-backend --source . --region asia-south1
```

## Rollback

If something goes wrong, rollback to a previous revision:

```bash
# List revisions
gcloud run revisions list --service status-page-backend --region asia-south1

# Rollback to a specific revision
gcloud run services update-traffic status-page-backend \
  --to-revisions REVISION_NAME=100 \
  --region asia-south1
```

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
