-- Multi-Tenant Status Page Application
-- Database Schema for Supabase PostgreSQL

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Role types for organization members
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');

-- Service status types
CREATE TYPE service_status AS ENUM (
  'operational',
  'degraded_performance',
  'partial_outage',
  'major_outage'
);

-- Incident status types
CREATE TYPE incident_status AS ENUM (
  'investigating',
  'identified',
  'monitoring',
  'resolved'
);

-- Maintenance status types
CREATE TYPE maintenance_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Organizations (Tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members (User-Organization relationship with roles)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Services (Monitored services per organization)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_url TEXT,
  current_status service_status NOT NULL DEFAULT 'operational',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Status History (Track all status changes)
CREATE TABLE service_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status service_status NOT NULL,
  message TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incidents (Service incidents)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status incident_status NOT NULL DEFAULT 'investigating',
  impact service_status NOT NULL DEFAULT 'degraded_performance',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident Updates (Timeline of incident updates)
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status incident_status NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident Services (Many-to-many: incidents can affect multiple services)
CREATE TABLE incident_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(incident_id, service_id)
);

-- Maintenances (Scheduled maintenance windows)
CREATE TABLE maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status maintenance_status NOT NULL DEFAULT 'scheduled',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance Services (Many-to-many: maintenances can affect multiple services)
CREATE TABLE maintenance_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(maintenance_id, service_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organization indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Organization members indexes
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_role ON organization_members(role);
CREATE INDEX idx_organization_members_org_user ON organization_members(organization_id, user_id);

-- Services indexes
CREATE INDEX idx_services_org_id ON services(organization_id);
CREATE INDEX idx_services_status ON services(current_status);
CREATE INDEX idx_services_org_status ON services(organization_id, current_status);
CREATE INDEX idx_services_display_order ON services(organization_id, display_order);

-- Service status history indexes
CREATE INDEX idx_service_status_history_service_id ON service_status_history(service_id);
CREATE INDEX idx_service_status_history_created_at ON service_status_history(created_at DESC);
CREATE INDEX idx_service_status_history_service_created ON service_status_history(service_id, created_at DESC);

-- Incidents indexes
CREATE INDEX idx_incidents_org_id ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_org_status ON incidents(organization_id, status);
CREATE INDEX idx_incidents_started_at ON incidents(started_at DESC);
CREATE INDEX idx_incidents_resolved_at ON incidents(resolved_at DESC);

-- Incident updates indexes
CREATE INDEX idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX idx_incident_updates_created_at ON incident_updates(created_at DESC);
CREATE INDEX idx_incident_updates_incident_created ON incident_updates(incident_id, created_at DESC);

-- Incident services indexes
CREATE INDEX idx_incident_services_incident_id ON incident_services(incident_id);
CREATE INDEX idx_incident_services_service_id ON incident_services(service_id);

-- Maintenances indexes
CREATE INDEX idx_maintenances_org_id ON maintenances(organization_id);
CREATE INDEX idx_maintenances_status ON maintenances(status);
CREATE INDEX idx_maintenances_org_status ON maintenances(organization_id, status);
CREATE INDEX idx_maintenances_scheduled_start ON maintenances(scheduled_start);
CREATE INDEX idx_maintenances_scheduled_end ON maintenances(scheduled_end);

-- Maintenance services indexes
CREATE INDEX idx_maintenance_services_maintenance_id ON maintenance_services(maintenance_id);
CREATE INDEX idx_maintenance_services_service_id ON maintenance_services(service_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at
  BEFORE UPDATE ON maintenances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create status history when service status changes
CREATE OR REPLACE FUNCTION create_service_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.current_status != NEW.current_status) OR TG_OP = 'INSERT' THEN
    INSERT INTO service_status_history (service_id, status, message)
    VALUES (NEW.id, NEW.current_status, 'Status changed to ' || NEW.current_status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create status history
CREATE TRIGGER create_service_status_history_trigger
  AFTER INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION create_service_status_history();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_services ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Organizations
-- ============================================================================

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create organizations (they become admin automatically)
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Only admins can update their organizations
CREATE POLICY "Admins can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete their organizations
CREATE POLICY "Admins can delete their organizations"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - Organization Members
-- ============================================================================

-- Members can view other members in their organizations
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Admins can invite members
CREATE POLICY "Admins can invite members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update member roles
CREATE POLICY "Admins can update member roles"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can remove members
CREATE POLICY "Admins can remove members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - Services
-- ============================================================================

-- Members can view services in their organizations
CREATE POLICY "Members can view services"
  ON services FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create services
CREATE POLICY "Admins can create services"
  ON services FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update services
CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete services
CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - Service Status History
-- ============================================================================

-- Members can view status history for services in their organizations
CREATE POLICY "Members can view service status history"
  ON service_status_history FOR SELECT
  USING (
    service_id IN (
      SELECT s.id FROM services s
      INNER JOIN organization_members om ON s.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Members can create status history entries
CREATE POLICY "Members can create status history"
  ON service_status_history FOR INSERT
  WITH CHECK (
    service_id IN (
      SELECT s.id FROM services s
      INNER JOIN organization_members om ON s.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'member')
    )
  );

-- ============================================================================
-- RLS POLICIES - Incidents
-- ============================================================================

-- Members can view incidents in their organizations
CREATE POLICY "Members can view incidents"
  ON incidents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Members and admins can create incidents
CREATE POLICY "Members can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- Members and admins can update incidents
CREATE POLICY "Members can update incidents"
  ON incidents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- Admins can delete incidents
CREATE POLICY "Admins can delete incidents"
  ON incidents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - Incident Updates
-- ============================================================================

-- Members can view incident updates
CREATE POLICY "Members can view incident updates"
  ON incident_updates FOR SELECT
  USING (
    incident_id IN (
      SELECT i.id FROM incidents i
      INNER JOIN organization_members om ON i.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Members can create incident updates
CREATE POLICY "Members can create incident updates"
  ON incident_updates FOR INSERT
  WITH CHECK (
    incident_id IN (
      SELECT i.id FROM incidents i
      INNER JOIN organization_members om ON i.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'member')
    )
  );

-- ============================================================================
-- RLS POLICIES - Incident Services
-- ============================================================================

-- Members can view incident-service relationships
CREATE POLICY "Members can view incident services"
  ON incident_services FOR SELECT
  USING (
    incident_id IN (
      SELECT i.id FROM incidents i
      INNER JOIN organization_members om ON i.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Members can create incident-service relationships
CREATE POLICY "Members can create incident services"
  ON incident_services FOR INSERT
  WITH CHECK (
    incident_id IN (
      SELECT i.id FROM incidents i
      INNER JOIN organization_members om ON i.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'member')
    )
  );

-- Members can delete incident-service relationships
CREATE POLICY "Members can delete incident services"
  ON incident_services FOR DELETE
  USING (
    incident_id IN (
      SELECT i.id FROM incidents i
      INNER JOIN organization_members om ON i.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'member')
    )
  );

-- ============================================================================
-- RLS POLICIES - Maintenances
-- ============================================================================

-- Members can view maintenances
CREATE POLICY "Members can view maintenances"
  ON maintenances FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Members can create maintenances
CREATE POLICY "Members can create maintenances"
  ON maintenances FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- Members can update maintenances
CREATE POLICY "Members can update maintenances"
  ON maintenances FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- Admins can delete maintenances
CREATE POLICY "Admins can delete maintenances"
  ON maintenances FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - Maintenance Services
-- ============================================================================

-- Members can view maintenance-service relationships
CREATE POLICY "Members can view maintenance services"
  ON maintenance_services FOR SELECT
  USING (
    maintenance_id IN (
      SELECT m.id FROM maintenances m
      INNER JOIN organization_members om ON m.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Members can create maintenance-service relationships
CREATE POLICY "Members can create maintenance services"
  ON maintenance_services FOR INSERT
  WITH CHECK (
    maintenance_id IN (
      SELECT m.id FROM maintenances m
      INNER JOIN organization_members om ON m.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'member')
    )
  );

-- Members can delete maintenance-service relationships
CREATE POLICY "Members can delete maintenance services"
  ON maintenance_services FOR DELETE
  USING (
    maintenance_id IN (
      SELECT m.id FROM maintenances m
      INNER JOIN organization_members om ON m.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'member')
    )
  );

-- ============================================================================
-- PUBLIC ACCESS POLICIES (for status pages)
-- ============================================================================

-- Public read access to organizations by slug
CREATE POLICY "Public can view organizations by slug"
  ON organizations FOR SELECT
  USING (true);

-- Public read access to services
CREATE POLICY "Public can view services"
  ON services FOR SELECT
  USING (true);

-- Public read access to service status history
CREATE POLICY "Public can view service status history"
  ON service_status_history FOR SELECT
  USING (true);

-- Public read access to incidents
CREATE POLICY "Public can view incidents"
  ON incidents FOR SELECT
  USING (true);

-- Public read access to incident updates
CREATE POLICY "Public can view incident updates"
  ON incident_updates FOR SELECT
  USING (true);

-- Public read access to incident services
CREATE POLICY "Public can view incident services"
  ON incident_services FOR SELECT
  USING (true);

-- Public read access to maintenances
CREATE POLICY "Public can view maintenances"
  ON maintenances FOR SELECT
  USING (true);

-- Public read access to maintenance services
CREATE POLICY "Public can view maintenance services"
  ON maintenance_services FOR SELECT
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Tenant organizations - each represents a separate status page';
COMMENT ON TABLE organization_members IS 'User-organization relationships with role-based access control';
COMMENT ON TABLE services IS 'Services monitored by each organization';
COMMENT ON TABLE service_status_history IS 'Historical record of all service status changes';
COMMENT ON TABLE incidents IS 'Service incidents affecting one or more services';
COMMENT ON TABLE incident_updates IS 'Timeline updates for incidents';
COMMENT ON TABLE incident_services IS 'Many-to-many relationship between incidents and affected services';
COMMENT ON TABLE maintenances IS 'Scheduled maintenance windows';
COMMENT ON TABLE maintenance_services IS 'Many-to-many relationship between maintenances and affected services';

COMMENT ON COLUMN organizations.slug IS 'URL-friendly identifier for public status pages';
COMMENT ON COLUMN organization_members.role IS 'User role: admin (full access), member (can manage incidents), viewer (read-only)';
COMMENT ON COLUMN services.current_status IS 'Current operational status of the service';
COMMENT ON COLUMN services.display_order IS 'Order in which services are displayed on status page';
COMMENT ON COLUMN incidents.impact IS 'Overall impact level of the incident';
COMMENT ON COLUMN maintenances.scheduled_start IS 'Planned start time of maintenance';
COMMENT ON COLUMN maintenances.actual_start IS 'Actual start time (may differ from scheduled)';
