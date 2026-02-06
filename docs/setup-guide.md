# Setup Guide

This guide will help you set up the Multi-Tenant Status Page application for local development.

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (free tier is fine)
- Code editor (VS Code recommended)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd plivo-status
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: status-page-dev
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

### 2.2 Run Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Open `database/schema.sql` from this project
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. Verify success message

### 2.3 Get API Credentials

1. Go to Settings → API
2. Copy the following:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` `public` key
   - `service_role` `secret` key

### 2.4 Enable Email Authentication

1. Go to Authentication → Providers
2. Ensure "Email" is enabled
3. Configure email settings (or use default for development)

## Step 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Configure Environment Variables

Create `.env` file in `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

CORS_ORIGIN=http://localhost:5173
```

### 3.3 Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/health
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

## Step 4: Frontend Setup

### 4.1 Install Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 4.2 Configure Environment Variables

Create `.env` file in `frontend/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:5000
```

### 4.3 Start Frontend Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 5: Verify Installation

### 5.1 Access the Application

Open your browser and go to: http://localhost:5173

### 5.2 Create an Account

1. Click "Sign up"
2. Enter email and password
3. Click "Sign up"
4. You should be redirected to the dashboard

### 5.3 Create an Organization

1. Click "Create Organization"
2. Enter organization name (e.g., "Test Company")
3. Click "Create"

### 5.4 Add a Service

1. Go to "Services" in the navigation
2. Click "Add Service"
3. Enter:
   - Name: "API Gateway"
   - Description: "Main API endpoint"
4. Click "Save"

### 5.5 View Public Status Page

1. Note your organization slug (shown on dashboard)
2. Visit: http://localhost:5173/status/your-org-slug
3. You should see your public status page

## Step 6: Seed Sample Data (Optional)

To add sample data for testing:

1. Open `database/seed.sql`
2. Find the commented section for organization members
3. Get your user ID:
   - Go to Supabase → Authentication → Users
   - Copy your user ID
4. Uncomment and update the INSERT statement with your user ID
5. Run the seed file in Supabase SQL Editor

## Troubleshooting

### Backend won't start

**Error: Missing Supabase environment variables**
- Verify `.env` file exists in `backend/` directory
- Check all required variables are set
- Ensure no extra spaces around values

**Port already in use**
- Change `PORT` in `.env` to different value (e.g., 5001)
- Update `VITE_API_URL` in frontend `.env` accordingly

### Frontend won't start

**Error: Missing environment variables**
- Verify `.env` file exists in `frontend/` directory
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`

**Blank page or errors**
- Check browser console for errors
- Verify backend is running
- Check `VITE_API_URL` is correct

### Authentication issues

**Can't sign up**
- Check Supabase email settings
- Verify email provider is enabled
- Check browser console for errors

**Can't sign in**
- Verify credentials are correct
- Check Supabase → Authentication → Users
- Clear browser cache and cookies

### Database errors

**RLS policy errors**
- Verify schema was run completely
- Check Supabase → Database → Policies
- Ensure RLS is enabled on all tables

**Connection errors**
- Verify Supabase URL is correct
- Check project is not paused (free tier)
- Verify API keys are correct

### CORS errors

**Access-Control-Allow-Origin**
- Verify `CORS_ORIGIN` in backend `.env`
- Ensure it matches frontend URL exactly
- Restart backend server after changes

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes auto-refresh browser
- Backend: Uses nodemon for auto-restart

### Database Changes

After modifying schema:
1. Update `database/schema.sql`
2. Test in Supabase SQL Editor
3. Document changes in migration file

### API Testing

Use tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

Example curl request:
```bash
curl -X GET http://localhost:5000/api/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Debugging

**Backend:**
- Check terminal output
- Add `console.log()` statements
- Use Node.js debugger

**Frontend:**
- Use React DevTools
- Check browser console
- Use Network tab for API calls

## Next Steps

Now that your development environment is set up:

1. Explore the codebase
2. Read the [Architecture Documentation](architecture.md)
3. Review the [API Documentation](api.md)
4. Make your first code change
5. Test the application thoroughly
6. When ready, follow the [Deployment Guide](deployment-guide.md)

## Getting Help

If you encounter issues:

1. Check this troubleshooting section
2. Review error messages carefully
3. Check Supabase logs
4. Search for similar issues online
5. Ask for help with specific error messages

## Useful Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev         # Start dev server
npm start           # Start production server

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build

# Database
# Run in Supabase SQL Editor
# See database/schema.sql and database/seed.sql
```

---

**Happy coding!** 🚀
