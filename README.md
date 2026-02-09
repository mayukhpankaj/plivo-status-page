# Multi-Tenant Realtime Status Page with Prometheus 

A comprehensive, production-ready status page application with multi-organization support, team-based access control, and real-time incident management.
<img width="1381" height="906" alt="image" src="https://github.com/user-attachments/assets/9da173e1-07c8-4cf0-822d-80a56f98203a" />


## How it works ? 

<img width="1690" height="1741" alt="image" src="https://github.com/user-attachments/assets/3587b941-c925-41a2-9cb7-ea84e4ce8366" />


## 🚀 Features

### Multi-Tenant Architecture
- Multiple organizations with isolated data
- Team-based access control (Admin, Member, Viewer roles)
- Organization switching for users in multiple teams

### Public Status Pages
- Clean, accessible status pages at `/status/:orgSlug`
- Real-time service status monitoring
- Incident and maintenance timeline
- No authentication required for public viewing

### Admin Dashboard
- Service management (CRUD operations)
- Real-time status updates
- Incident management with multi-service impact
- Scheduled maintenance windows
- Team member management
- Role-based permissions

### Service Monitoring
- Multiple status levels: Operational, Degraded, Partial Outage, Major Outage
- Status history tracking
- Visual status indicators

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **Deployment**: Vercel (Frontend), Node.js hosting (Backend)

## 📁 Project Structure

```
plivo-status/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── middleware/  # Auth & tenant middleware
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── utils/       # Helper functions
│   │   └── server.js    # Entry point
│   └── package.json
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── utils/       # Utilities
│   └── package.json
├── database/            # Database schema & migrations
│   ├── schema.sql       # Complete schema
│   └── seed.sql         # Sample data
└── docs/                # Documentation
    └── architecture.md  # System architecture
```

## 🗄️ Database Schema

### Core Tables
- `users` - Supabase auth users
- `organizations` - Tenant organizations
- `organization_members` - User-organization relationships with roles
- `services` - Monitored services per organization
- `service_status_history` - Status change tracking
- `incidents` - Service incidents
- `incident_updates` - Incident timeline updates
- `incident_services` - Incident-service relationships
- `maintenances` - Scheduled maintenance windows
- `maintenance_services` - Maintenance-service relationships

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the database schema from `database/schema.sql` in the SQL Editor
3. Enable Email authentication in Authentication settings
4. Copy your project URL and anon key

### 3. Environment Configuration

**Backend** (`backend/.env`):
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full access - manage services, incidents, team members
- **Member**: Can create/update incidents and maintenances
- **Viewer**: Read-only access to organization data

### Route Protection
- Public routes: `/status/:orgSlug`
- Protected routes: All admin dashboard routes require authentication
- Organization-scoped: All API requests validate organization membership

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Team Management
- `GET /api/organizations/:id/members` - List members
- `POST /api/organizations/:id/members` - Invite member
- `PUT /api/organizations/:id/members/:userId` - Update member role
- `DELETE /api/organizations/:id/members/:userId` - Remove member

### Services
- `GET /api/organizations/:orgId/services` - List services
- `POST /api/organizations/:orgId/services` - Create service
- `PUT /api/organizations/:orgId/services/:id` - Update service
- `DELETE /api/organizations/:orgId/services/:id` - Delete service
- `POST /api/organizations/:orgId/services/:id/status` - Update status

### Incidents
- `GET /api/organizations/:orgId/incidents` - List incidents
- `POST /api/organizations/:orgId/incidents` - Create incident
- `PUT /api/organizations/:orgId/incidents/:id` - Update incident
- `POST /api/organizations/:orgId/incidents/:id/updates` - Add update
- `POST /api/organizations/:orgId/incidents/:id/resolve` - Resolve incident

### Maintenances
- `GET /api/organizations/:orgId/maintenances` - List maintenances
- `POST /api/organizations/:orgId/maintenances` - Create maintenance
- `PUT /api/organizations/:orgId/maintenances/:id` - Update maintenance
- `DELETE /api/organizations/:orgId/maintenances/:id` - Delete maintenance

### Public API
- `GET /api/public/status/:orgSlug` - Get public status page data

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Status Color System**:
  - 🟢 Operational (Green)
  - 🟡 Degraded Performance (Yellow)
  - 🟠 Partial Outage (Orange)
  - 🔴 Major Outage (Red)
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Loading States**: Skeleton loaders for better UX
- **Empty States**: Helpful messages and CTAs
- **Real-time Updates**: Auto-refresh on public status pages

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Backend (Node.js Hosting)

Deploy to platforms like:
- Railway
- Render
- Heroku
- DigitalOcean App Platform

Configure environment variables and deploy.

### Supabase Production

1. Use production Supabase project
2. Update environment variables
3. Configure Row Level Security policies
4. Set up database backups

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Database Schema](database/schema.sql)
- [API Documentation](docs/api.md)

## 🔒 Security

- Row Level Security (RLS) on all tables
- JWT-based authentication via Supabase
- Multi-tenant data isolation
- Role-based access control
- Environment variable protection
- CORS configuration

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📧 Support

For issues and questions, please open a GitHub issue.
