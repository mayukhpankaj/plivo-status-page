-- Sample seed data for development and testing
-- Run this AFTER creating a user via Supabase Auth

-- Note: Replace 'YOUR_USER_ID_HERE' with actual user ID from auth.users table
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

-- Sample Organization
INSERT INTO organizations (id, name, slug, description, website_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Acme Corporation', 'acme', 'Enterprise cloud services provider', 'https://acme.example.com'),
  ('550e8400-e29b-41d4-a716-446655440001', 'TechStart Inc', 'techstart', 'Startup SaaS platform', 'https://techstart.example.com');

-- Sample Organization Members (replace user_id with actual auth user ID)
-- INSERT INTO organization_members (organization_id, user_id, role, joined_at) VALUES
--   ('550e8400-e29b-41d4-a716-446655440000', 'YOUR_USER_ID_HERE', 'admin', NOW()),
--   ('550e8400-e29b-41d4-a716-446655440001', 'YOUR_USER_ID_HERE', 'admin', NOW());

-- Sample Services for Acme Corporation
INSERT INTO services (organization_id, name, description, target_url, current_status, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'API Gateway', 'Main API endpoint for all services', 'https://api.acme.example.com', 'operational', 1),
  ('550e8400-e29b-41d4-a716-446655440000', 'Web Application', 'Customer-facing web application', 'https://app.acme.example.com', 'operational', 2),
  ('550e8400-e29b-41d4-a716-446655440000', 'Database Cluster', 'Primary PostgreSQL database', 'https://db.acme.example.com', 'operational', 3),
  ('550e8400-e29b-41d4-a716-446655440000', 'CDN', 'Content delivery network', 'https://cdn.acme.example.com', 'operational', 4),
  ('550e8400-e29b-41d4-a716-446655440000', 'Authentication Service', 'User authentication and authorization', 'https://auth.acme.example.com', 'operational', 5);

-- Sample Services for TechStart Inc
INSERT INTO services (organization_id, name, description, target_url, current_status, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Platform API', 'Core platform API', 'https://api.techstart.example.com', 'operational', 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'Dashboard', 'Admin dashboard', 'https://dashboard.techstart.example.com', 'operational', 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'Payment Processing', 'Payment gateway integration', 'https://payments.techstart.example.com', 'operational', 3);

-- Sample Incident (resolved)
INSERT INTO incidents (id, organization_id, title, description, status, impact, started_at, resolved_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 
   'Database Performance Degradation', 
   'Users experiencing slow query responses', 
   'resolved', 
   'degraded_performance', 
   NOW() - INTERVAL '2 hours', 
   NOW() - INTERVAL '30 minutes');

-- Sample Incident Updates
INSERT INTO incident_updates (incident_id, status, message) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'investigating', 'We are investigating reports of slow database queries.'),
  ('660e8400-e29b-41d4-a716-446655440000', 'identified', 'Issue identified: high CPU usage on primary database node.'),
  ('660e8400-e29b-41d4-a716-446655440000', 'monitoring', 'Database restarted. Monitoring performance metrics.'),
  ('660e8400-e29b-41d4-a716-446655440000', 'resolved', 'All systems operating normally. Performance has returned to baseline.');

-- Link incident to affected service
INSERT INTO incident_services (incident_id, service_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', (SELECT id FROM services WHERE name = 'Database Cluster' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'));

-- Sample Scheduled Maintenance
INSERT INTO maintenances (organization_id, title, description, status, scheduled_start, scheduled_end) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 
   'Database Upgrade', 
   'Upgrading PostgreSQL to latest version', 
   'scheduled', 
   NOW() + INTERVAL '3 days', 
   NOW() + INTERVAL '3 days 2 hours');

-- Link maintenance to affected services
INSERT INTO maintenance_services (maintenance_id, service_id) VALUES
  ((SELECT id FROM maintenances WHERE title = 'Database Upgrade'), 
   (SELECT id FROM services WHERE name = 'Database Cluster' AND organization_id = '550e8400-e29b-41d4-a716-446655440000')),
  ((SELECT id FROM maintenances WHERE title = 'Database Upgrade'), 
   (SELECT id FROM services WHERE name = 'API Gateway' AND organization_id = '550e8400-e29b-41d4-a716-446655440000'));
