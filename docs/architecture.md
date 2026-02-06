# System Architecture

## Overview

The Multi-Tenant Status Page application follows a three-tier architecture with clear separation of concerns:

1. **Presentation Layer** - React frontend
2. **Application Layer** - Express.js API
3. **Data Layer** - Supabase PostgreSQL

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  Public Status   │              │ Admin Dashboard  │     │
│  │  Pages (React)   │              │    (React)       │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
│           │                                  │               │
│           │         React Router             │               │
│           └──────────────┬───────────────────┘               │
└──────────────────────────┼─────────────────────────────────┘
                           │
                    HTTP/REST API
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                  Application Layer                          │
│           ┌───────────────┴────────────────┐                │
│           │     Express.js Server          │                │
│           │                                │                │
│  ┌────────┴────────┐          ┌───────────┴──────────┐     │
│  │  Middleware     │          │    API Routes        │     │
│  │  - Auth         │          │  - Organizations     │     │
│  │  - Tenant       │          │  - Services          │     │
│  │  - CORS         │          │  - Incidents         │     │
│  │  - Error        │          │  - Maintenances      │     │
│  └────────┬────────┘          │  - Public            │     │
│           │                   └───────────┬──────────┘     │
│           │                               │                │
│           └───────────┬───────────────────┘                │
└───────────────────────┼────────────────────────────────────┘
                        │
                 Supabase Client
                        │
┌───────────────────────┼────────────────────────────────────┐
│                   Data Layer                                │
│           ┌───────────┴────────────────┐                    │
│           │   Supabase PostgreSQL      │                    │
│           │                            │                    │
│  ┌────────┴────────┐      ┌───────────┴──────────┐         │
│  │  Core Tables    │      │  Supabase Auth       │         │
│  │  - orgs         │      │  - JWT tokens        │         │
│  │  - services     │      │  - User sessions     │         │
│  │  - incidents    │      │  - Email auth        │         │
│  │  - maintenances │      └──────────────────────┘         │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Tenant Design

### Tenant Isolation Strategy

**Organization-based Multi-tenancy**: Each organization is a separate tenant with isolated data.

#### Key Principles:
1. **Data Isolation**: All tables include `organization_id` foreign key
2. **Access Control**: Middleware validates organization membership on every request
3. **Row Level Security**: PostgreSQL RLS policies enforce data isolation at DB level
4. **No Cross-Tenant Access**: Users can only access data from organizations they belong to

### Tenant Context Flow

```
Request → Auth Middleware → Tenant Middleware → Route Handler
   │            │                   │                  │
   │            │                   │                  │
   ├─ Extract JWT                   │                  │
   │            │                   │                  │
   │            ├─ Validate user    │                  │
   │            │                   │                  │
   │            │                   ├─ Validate org    │
   │            │                   │  membership      │
   │            │                   │                  │
   │            │                   ├─ Attach org      │
   │            │                   │  context         │
   │            │                   │                  │
   │            │                   │                  ├─ Execute
   │            │                   │                  │  with org
   │            │                   │                  │  scope
```

## Database Schema Design

### Entity Relationships

```
users (Supabase Auth)
  │
  ├──< organization_members >──┐
  │                             │
  │                        organizations
  │                             │
  │                             ├──< services
  │                             │      │
  │                             │      ├──< service_status_history
  │                             │      │
  │                             │      ├──< incident_services >──┐
  │                             │      │                         │
  │                             │      └──< maintenance_services >──┐
  │                             │                                │  │
  │                             ├──< incidents                   │  │
  │                             │      │                         │  │
  │                             │      └──< incident_updates     │  │
  │                             │                                │  │
  │                             └──< maintenances ───────────────┘  │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Many-to-Many Relationships**:
   - Users ↔ Organizations (via `organization_members`)
   - Incidents ↔ Services (via `incident_services`)
   - Maintenances ↔ Services (via `maintenance_services`)

2. **Audit Trail**:
   - All tables include `created_at` and `updated_at` timestamps
   - Status history tracked in `service_status_history`
   - Incident timeline via `incident_updates`

3. **Soft Deletes**: Consider implementing for critical data

4. **Indexes**:
   - Foreign keys automatically indexed
   - Composite indexes on frequently queried columns
   - Slug fields for public access

## API Layer Responsibilities

### Middleware Stack

1. **CORS Middleware**: Handle cross-origin requests
2. **Body Parser**: Parse JSON request bodies
3. **Auth Middleware**: Validate JWT tokens from Supabase
4. **Tenant Middleware**: Validate organization membership
5. **Error Handler**: Centralized error handling

### Route Organization

```
/api
  /auth
    POST /signup
    POST /login
  /organizations
    GET    /                      # List user's orgs
    POST   /                      # Create org
    GET    /:id                   # Get org details
    PUT    /:id                   # Update org
    DELETE /:id                   # Delete org
    GET    /:id/members           # List members
    POST   /:id/members           # Invite member
    PUT    /:id/members/:userId   # Update role
    DELETE /:id/members/:userId   # Remove member
  /organizations/:orgId/services
    GET    /                      # List services
    POST   /                      # Create service
    PUT    /:id                   # Update service
    DELETE /:id                   # Delete service
    POST   /:id/status            # Update status
  /organizations/:orgId/incidents
    GET    /                      # List incidents
    POST   /                      # Create incident
    PUT    /:id                   # Update incident
    POST   /:id/updates           # Add update
    POST   /:id/resolve           # Resolve
  /organizations/:orgId/maintenances
    GET    /                      # List maintenances
    POST   /                      # Create maintenance
    PUT    /:id                   # Update maintenance
    DELETE /:id                   # Delete maintenance
  /public
    GET /status/:orgSlug          # Public status page
```

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── OrganizationProvider (Context)
│       ├── Router
│       │   ├── Public Routes
│       │   │   ├── Login
│       │   │   ├── Signup
│       │   │   └── PublicStatusPage
│       │   │
│       │   └── Protected Routes (RequireAuth)
│       │       ├── OrganizationSwitcher
│       │       ├── Dashboard
│       │       ├── ServicesPage
│       │       │   ├── ServiceList
│       │       │   ├── ServiceForm
│       │       │   └── StatusBadge
│       │       ├── IncidentsPage
│       │       │   ├── IncidentList
│       │       │   ├── IncidentForm
│       │       │   └── IncidentTimeline
│       │       ├── MaintenancesPage
│       │       │   ├── MaintenanceList
│       │       │   └── MaintenanceForm
│       │       └── TeamPage
│       │           ├── MemberList
│       │           └── InviteForm
```

### State Management Strategy

**Context API + Custom Hooks**:
- `AuthContext`: User authentication state
- `OrganizationContext`: Current organization, switching
- Custom hooks for data fetching (`useServices`, `useIncidents`, etc.)

### Data Flow

```
Component → Custom Hook → API Service → Backend API
    │            │              │             │
    │            │              │             ├─ Validate auth
    │            │              │             ├─ Check permissions
    │            │              │             ├─ Query database
    │            │              │             └─ Return data
    │            │              │
    │            │              ├─ Transform response
    │            │              └─ Return to hook
    │            │
    │            ├─ Manage loading/error states
    │            └─ Return data to component
    │
    └─ Render UI
```

## Authentication & Authorization

### Authentication Flow

```
1. User enters credentials
2. Frontend calls Supabase Auth API
3. Supabase returns JWT token
4. Token stored in localStorage
5. Token included in all API requests (Authorization header)
6. Backend validates token with Supabase
7. User identity extracted from token
```

### Authorization Levels

**Route Level**:
- Public routes: No auth required
- Protected routes: Valid JWT required
- Admin routes: Admin role required

**Organization Level**:
- User must be member of organization
- Role determines permissions (admin/member/viewer)

**Resource Level**:
- Services: Admin only for CRUD
- Incidents: Member+ for create/update
- Status updates: Member+ 
- Team management: Admin only

### Permission Matrix

| Action | Viewer | Member | Admin |
|--------|--------|--------|-------|
| View services | ✅ | ✅ | ✅ |
| Create/edit services | ❌ | ❌ | ✅ |
| Update service status | ❌ | ✅ | ✅ |
| Create incidents | ❌ | ✅ | ✅ |
| Resolve incidents | ❌ | ✅ | ✅ |
| Manage team | ❌ | ❌ | ✅ |
| Delete organization | ❌ | ❌ | ✅ |

## Security Considerations

### Backend Security

1. **JWT Validation**: All protected routes validate JWT
2. **Tenant Isolation**: Middleware ensures org membership
3. **Role Checks**: Permission validation before mutations
4. **SQL Injection**: Parameterized queries via Supabase client
5. **Rate Limiting**: Implement for production
6. **CORS**: Whitelist frontend domain

### Frontend Security

1. **XSS Prevention**: React auto-escapes by default
2. **Secure Storage**: JWT in httpOnly cookies (consider upgrade)
3. **Route Guards**: Protected routes check auth state
4. **Input Validation**: Client-side validation + backend validation
5. **HTTPS Only**: Production deployment

### Database Security

1. **Row Level Security**: Enabled on all tables
2. **Service Role Key**: Backend only, never exposed to frontend
3. **Anon Key**: Frontend uses anon key with RLS
4. **Prepared Statements**: Supabase client handles this
5. **Backups**: Regular automated backups

## Performance Optimization

### Backend

- Database connection pooling
- Query optimization with proper indexes
- Caching strategy for public status pages
- Pagination for large datasets
- Compression middleware

### Frontend

- Code splitting by route
- Lazy loading components
- Optimistic UI updates
- Debounced search/filter
- Image optimization
- Bundle size optimization

### Database

- Composite indexes on frequently queried columns
- Materialized views for complex queries
- Partitioning for large tables (future)
- Query plan analysis

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers (can add more instances)
- Load balancer in front of API servers
- Supabase handles database scaling

### Vertical Scaling

- Upgrade Supabase plan for more resources
- Increase API server resources

### Future Enhancements

- Redis for caching and sessions
- Message queue for async tasks
- CDN for static assets
- WebSocket for real-time updates
- Read replicas for reporting

## Monitoring & Observability

### Logging

- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/response logging
- Error tracking (Sentry integration)

### Metrics

- API response times
- Error rates
- Database query performance
- User activity metrics

### Alerting

- Service downtime alerts
- Error rate thresholds
- Database performance degradation
- Disk space warnings

## Deployment Architecture

### Development

```
Developer Machine
  ├── Frontend (localhost:5173)
  ├── Backend (localhost:5000)
  └── Supabase (cloud - dev project)
```

### Production

```
Vercel (Frontend)
  │
  ├── CDN Edge Locations
  └── Static Assets

Node.js Host (Backend)
  │
  ├── Load Balancer
  └── API Servers (multiple instances)

Supabase (Database + Auth)
  │
  ├── PostgreSQL (primary + replicas)
  ├── Auth Service
  └── Storage
```

## Technology Choices Rationale

### React
- Component reusability
- Large ecosystem
- Excellent developer experience
- Strong community support

### Express.js
- Lightweight and flexible
- Middleware ecosystem
- Easy to understand
- Production-proven

### Supabase
- PostgreSQL (reliable, feature-rich)
- Built-in authentication
- Row Level Security
- Real-time capabilities
- Generous free tier

### Tailwind CSS
- Utility-first approach
- Rapid development
- Consistent design system
- Small production bundle
- Responsive design utilities

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable multi-tenant design
- ✅ Secure authentication & authorization
- ✅ Maintainable codebase
- ✅ Production-ready foundation
- ✅ Room for future enhancements
