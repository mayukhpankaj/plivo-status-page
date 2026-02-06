# Deployment Guide

This guide will help you deploy your Multi-Tenant Status Page application to production.

## Prerequisites

- Supabase account (https://supabase.com)
- Vercel account (https://vercel.com) for frontend
- Node.js hosting service for backend (Railway, Render, Heroku, etc.)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for the project to be provisioned
3. Note your project URL and API keys

### 1.2 Run Database Schema

1. Navigate to the SQL Editor in Supabase dashboard
2. Copy the contents of `database/schema.sql`
3. Paste and execute in the SQL Editor
4. Verify all tables are created successfully

### 1.3 Configure Authentication

1. Go to Authentication → Settings
2. Enable Email provider
3. Configure email templates (optional)
4. Set Site URL to your frontend URL
5. Add redirect URLs for your frontend domain

### 1.4 Get API Keys

From Settings → API:
- Copy your `Project URL`
- Copy your `anon/public` key
- Copy your `service_role` key (keep this secret!)

## Step 2: Backend Deployment

### Option A: Railway

1. Create account at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `backend`
5. Add environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```
6. Deploy and note your backend URL

### Option B: Render

1. Create account at https://render.com
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure:
   - Name: status-page-api
   - Root Directory: backend
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (same as above)
6. Deploy and note your backend URL

### Option C: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set buildpack: `heroku buildpacks:set heroku/nodejs`
5. Set environment variables:
   ```bash
   heroku config:set SUPABASE_URL=your_url
   heroku config:set SUPABASE_ANON_KEY=your_key
   heroku config:set SUPABASE_SERVICE_KEY=your_key
   heroku config:set CORS_ORIGIN=https://your-frontend.vercel.app
   ```
6. Deploy: `git push heroku main`

## Step 3: Frontend Deployment (Vercel)

### 3.1 Prepare Frontend

1. Update `frontend/.env.example` with your values
2. Commit your code to Git repository

### 3.2 Deploy to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.3 Add Environment Variables

In Vercel project settings → Environment Variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend-url.railway.app
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Note your frontend URL (e.g., `https://your-app.vercel.app`)

### 3.5 Update Backend CORS

Update your backend's `CORS_ORIGIN` environment variable to match your Vercel URL.

## Step 4: Post-Deployment Configuration

### 4.1 Update Supabase Auth Settings

1. Go to Supabase → Authentication → URL Configuration
2. Set Site URL: `https://your-app.vercel.app`
3. Add Redirect URLs:
   - `https://your-app.vercel.app/**`
   - `http://localhost:5173/**` (for local development)

### 4.2 Test the Application

1. Visit your Vercel URL
2. Create an account
3. Create an organization
4. Add services
5. Visit public status page: `https://your-app.vercel.app/status/your-org-slug`

### 4.3 Custom Domain (Optional)

#### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

#### Backend:
1. Configure custom domain in your hosting provider
2. Update `CORS_ORIGIN` environment variable
3. Update `VITE_API_URL` in Vercel

## Step 5: Monitoring & Maintenance

### 5.1 Set Up Monitoring

**Backend:**
- Use your hosting provider's built-in monitoring
- Consider adding Sentry for error tracking
- Set up uptime monitoring (UptimeRobot, Pingdom)

**Frontend:**
- Vercel provides analytics automatically
- Monitor Core Web Vitals

**Database:**
- Supabase provides database metrics
- Set up alerts for high usage
- Monitor query performance

### 5.2 Database Backups

Supabase automatically backs up your database, but you can:
1. Enable Point-in-Time Recovery (paid plans)
2. Set up manual backup scripts
3. Export data regularly

### 5.3 Security Checklist

- [ ] Environment variables are set correctly
- [ ] Service role key is never exposed to frontend
- [ ] CORS is configured properly
- [ ] Row Level Security policies are enabled
- [ ] HTTPS is enforced everywhere
- [ ] Rate limiting is configured (if needed)
- [ ] Authentication is working correctly
- [ ] API endpoints require proper authorization

## Step 6: Scaling Considerations

### Database (Supabase)
- Start with Free tier for testing
- Upgrade to Pro for production
- Monitor connection pool usage
- Consider read replicas for high traffic

### Backend
- Most hosting providers auto-scale
- Monitor response times
- Add Redis for caching (optional)
- Implement rate limiting

### Frontend
- Vercel handles scaling automatically
- Use CDN for static assets
- Optimize images and bundles
- Implement code splitting

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check for trailing slashes
- Ensure protocol (http/https) is correct

**2. Authentication Fails**
- Verify Supabase URL and keys are correct
- Check redirect URLs in Supabase settings
- Ensure cookies are enabled

**3. Database Connection Issues**
- Verify Supabase credentials
- Check connection limits
- Review RLS policies

**4. API Requests Fail**
- Verify `VITE_API_URL` is correct
- Check backend is running
- Review network tab in browser DevTools

**5. Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

## Environment Variables Reference

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
CORS_ORIGIN=https://your-app.vercel.app
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_API_URL=https://your-api.railway.app
```

## Rollback Procedure

If you need to rollback a deployment:

**Vercel:**
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

**Backend:**
1. Revert to previous Git commit
2. Redeploy through your hosting provider

**Database:**
1. Use Supabase backup/restore
2. Or manually revert schema changes

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure custom domain
3. Enable SSL/TLS
4. Set up CI/CD pipeline
5. Create backup strategy
6. Document your specific configuration
7. Train team members on the system

---

**Congratulations!** Your Multi-Tenant Status Page is now live! 🎉
