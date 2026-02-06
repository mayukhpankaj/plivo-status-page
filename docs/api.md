# API Documentation

Base URL: `http://localhost:5000` (development) or your production API URL

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Authentication

### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Sign In
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Organizations

### List Organizations
Get all organizations the authenticated user belongs to.

```http
GET /api/organizations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "description": "...",
      "logo_url": "...",
      "website_url": "...",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Organization
```http
POST /api/organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Organization",
  "description": "Optional description",
  "website_url": "https://example.com"
}
```

### Get Organization
```http
GET /api/organizations/:id
Authorization: Bearer <token>
```

### Update Organization
```http
PUT /api/organizations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Organization
```http
DELETE /api/organizations/:id
Authorization: Bearer <token>
```

## Team Management

### List Members
```http
GET /api/organizations/:id/members
Authorization: Bearer <token>
```

### Invite Member
```http
POST /api/organizations/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "viewer"
}
```

Roles: `admin`, `member`, `viewer`

### Update Member Role
```http
PUT /api/organizations/:id/members/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

### Remove Member
```http
DELETE /api/organizations/:id/members/:userId
Authorization: Bearer <token>
```

## Services

### List Services
```http
GET /api/organizations/:orgId/services
Authorization: Bearer <token>
```

### Create Service
```http
POST /api/organizations/:orgId/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "API Gateway",
  "description": "Main API endpoint",
  "display_order": 1
}
```

### Get Service
```http
GET /api/organizations/:orgId/services/:id
Authorization: Bearer <token>
```

### Update Service
```http
PUT /api/organizations/:orgId/services/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Service
```http
DELETE /api/organizations/:orgId/services/:id
Authorization: Bearer <token>
```

### Update Service Status
```http
POST /api/organizations/:orgId/services/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "degraded_performance",
  "message": "Experiencing high latency"
}
```

Status values:
- `operational`
- `degraded_performance`
- `partial_outage`
- `major_outage`

### Get Service History
```http
GET /api/organizations/:orgId/services/:id/history?limit=50
Authorization: Bearer <token>
```

## Incidents

### List Incidents
```http
GET /api/organizations/:orgId/incidents?status=investigating
Authorization: Bearer <token>
```

### Create Incident
```http
POST /api/organizations/:orgId/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Database Performance Issues",
  "description": "Users experiencing slow queries",
  "impact": "degraded_performance",
  "service_ids": ["service-uuid-1", "service-uuid-2"]
}
```

Impact values:
- `degraded_performance`
- `partial_outage`
- `major_outage`

### Get Incident
```http
GET /api/organizations/:orgId/incidents/:id
Authorization: Bearer <token>
```

### Update Incident
```http
PUT /api/organizations/:orgId/incidents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "status": "monitoring"
}
```

### Delete Incident
```http
DELETE /api/organizations/:orgId/incidents/:id
Authorization: Bearer <token>
```

### Add Incident Update
```http
POST /api/organizations/:orgId/incidents/:id/updates
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "identified",
  "message": "Root cause identified. Working on fix."
}
```

Status values:
- `investigating`
- `identified`
- `monitoring`
- `resolved`

### Resolve Incident
```http
POST /api/organizations/:orgId/incidents/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Issue has been resolved."
}
```

## Maintenances

### List Maintenances
```http
GET /api/organizations/:orgId/maintenances?status=scheduled
Authorization: Bearer <token>
```

### Create Maintenance
```http
POST /api/organizations/:orgId/maintenances
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Database Upgrade",
  "description": "Upgrading to PostgreSQL 15",
  "scheduled_start": "2024-12-01T02:00:00Z",
  "scheduled_end": "2024-12-01T04:00:00Z",
  "service_ids": ["service-uuid-1"]
}
```

### Get Maintenance
```http
GET /api/organizations/:orgId/maintenances/:id
Authorization: Bearer <token>
```

### Update Maintenance
```http
PUT /api/organizations/:orgId/maintenances/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "scheduled_start": "2024-12-01T03:00:00Z"
}
```

### Delete Maintenance
```http
DELETE /api/organizations/:orgId/maintenances/:id
Authorization: Bearer <token>
```

### Start Maintenance
```http
POST /api/organizations/:orgId/maintenances/:id/start
Authorization: Bearer <token>
```

### Complete Maintenance
```http
POST /api/organizations/:orgId/maintenances/:id/complete
Authorization: Bearer <token>
```

## Public API

### Get Public Status Page
No authentication required.

```http
GET /api/public/status/:orgSlug
```

**Response:**
```json
{
  "organization": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "description": "...",
    "logo_url": "...",
    "website_url": "..."
  },
  "overall_status": "operational",
  "services": [...],
  "active_incidents": [...],
  "recent_incidents": [...],
  "upcoming_maintenances": [...]
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production using packages like `express-rate-limit`.

## Pagination

Currently not implemented. For large datasets, consider adding pagination:
```http
GET /api/organizations/:orgId/incidents?page=1&limit=20
```

## Webhooks (Future Enhancement)

Consider adding webhooks for:
- Incident created
- Incident updated
- Incident resolved
- Service status changed
- Maintenance scheduled
