# Quick Start Guide

Get your Status Page running in 10 minutes!

## 1. Prerequisites

- Node.js 18+ installed
- Supabase account (free)

## 2. Supabase Setup (3 minutes)

1. Create project at https://supabase.com
2. Go to SQL Editor → New Query
3. Copy/paste contents of `database/schema.sql`
4. Click Run
5. Go to Settings → API and copy:
   - Project URL
   - `anon` key
   - `service_role` key

## 3. Backend Setup (2 minutes)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

## 4. Frontend Setup (2 minutes)

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

## 5. Access Application (1 minute)

1. Open http://localhost:5173
2. Sign up with email/password
3. Create organization
4. Add services
5. View public page at http://localhost:5173/status/your-org-slug

## 6. Test Features (2 minutes)

- ✅ Add a service
- ✅ Update service status
- ✅ Create an incident
- ✅ Schedule maintenance
- ✅ Invite team member
- ✅ View public status page

## Next Steps

- Read [Setup Guide](docs/setup-guide.md) for detailed instructions
- Review [Architecture](docs/architecture.md) to understand the system
- Check [API Documentation](docs/api.md) for API details
- Follow [Deployment Guide](docs/deployment-guide.md) to go live

## Need Help?

Common issues:
- **Backend won't start**: Check `.env` file has all variables
- **Can't sign up**: Verify Supabase email auth is enabled
- **CORS errors**: Ensure `CORS_ORIGIN` matches frontend URL
- **Database errors**: Verify schema was run successfully

See [Setup Guide](docs/setup-guide.md) for detailed troubleshooting.

---

**You're all set!** Start building your status page! 🎉
