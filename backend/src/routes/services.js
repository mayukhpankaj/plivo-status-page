import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateOrganizationAccess, requireAdmin, requireMemberOrAdmin } from '../middleware/tenant.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router({ mergeParams: true });

router.get('/', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  console.log('[GET /services] OrgId:', req.params.orgId, 'User:', req.user.id, 'Role:', req.userRole);
  
  const { data: services, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('organization_id', req.params.orgId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[GET /services] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch services' });
  }

  console.log('[GET /services] Success: Found', services.length, 'services');
  res.json({ services });
}));

router.post('/', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  console.log('[POST /services] OrgId:', req.params.orgId, 'User:', req.user.id, 'Body:', req.body);
  
  const { name, description, target_url, display_order = 0 } = req.body;

  if (!name) {
    console.log('[POST /services] Error: Name is required');
    return res.status(400).json({ error: 'Service name is required' });
  }

  const { data: service, error } = await supabaseAdmin
    .from('services')
    .insert({
      organization_id: req.params.orgId,
      name,
      description,
      target_url,
      display_order,
      current_status: 'operational'
    })
    .select()
    .single();

  if (error) {
    console.error('[POST /services] Error:', error);
    return res.status(500).json({ error: 'Failed to create service' });
  }

  console.log('[POST /services] Success: Service created:', service.id);
  res.status(201).json({ service });
}));

router.get('/:id', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { data: service, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .single();

  if (error || !service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.json({ service });
}));

router.put('/:id', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  console.log('[PUT /services/:id] ServiceId:', req.params.id, 'OrgId:', req.params.orgId, 'Body:', req.body);
  
  const { name, description, target_url, display_order } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (target_url !== undefined) updates.target_url = target_url;
  if (display_order !== undefined) updates.display_order = display_order;

  console.log('[PUT /services/:id] Updates:', updates);

  const { data: service, error } = await supabaseAdmin
    .from('services')
    .update(updates)
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (error) {
    console.error('[PUT /services/:id] Error:', error);
    return res.status(500).json({ error: 'Failed to update service' });
  }

  console.log('[PUT /services/:id] Success: Service updated');
  res.json({ service });
}));

router.delete('/:id', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete service' });
  }

  res.json({ message: 'Service deleted successfully' });
}));

router.post('/:id/status', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const validStatuses = ['operational', 'degraded_performance', 'partial_outage', 'major_outage'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const { data: service, error: updateError } = await supabaseAdmin
    .from('services')
    .update({ current_status: status })
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update service status' });
  }

  const { error: historyError } = await supabaseAdmin
    .from('service_status_history')
    .insert({
      service_id: req.params.id,
      status,
      message: message || `Status changed to ${status}`,
      changed_by: req.user.id
    });

  if (historyError) {
    console.error('Failed to create status history:', historyError);
  }

  res.json({ service });
}));

router.get('/:id/history', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  const { data: history, error } = await supabaseAdmin
    .from('service_status_history')
    .select('*')
    .eq('service_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch status history' });
  }

  res.json({ history });
}));

export default router;
