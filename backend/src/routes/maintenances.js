import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateOrganizationAccess, requireMemberOrAdmin, requireAdmin } from '../middleware/tenant.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router({ mergeParams: true });

router.get('/', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = supabaseAdmin
    .from('maintenances')
    .select(`
      *,
      maintenance_services (
        service_id,
        services (
          id,
          name
        )
      )
    `)
    .eq('organization_id', req.params.orgId)
    .order('scheduled_start', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: maintenances, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch maintenances' });
  }

  const formattedMaintenances = maintenances.map(maintenance => ({
    ...maintenance,
    affected_services: maintenance.maintenance_services.map(ms => ms.services)
  }));

  res.json({ maintenances: formattedMaintenances });
}));

router.post('/', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, scheduled_start, scheduled_end, service_ids = [] } = req.body;

  if (!title || !scheduled_start || !scheduled_end) {
    return res.status(400).json({ error: 'Title, scheduled_start, and scheduled_end are required' });
  }

  if (new Date(scheduled_start) >= new Date(scheduled_end)) {
    return res.status(400).json({ error: 'Scheduled end must be after scheduled start' });
  }

  const { data: maintenance, error: maintenanceError } = await supabaseAdmin
    .from('maintenances')
    .insert({
      organization_id: req.params.orgId,
      title,
      description,
      scheduled_start,
      scheduled_end,
      status: 'scheduled',
      created_by: req.user.id
    })
    .select()
    .single();

  if (maintenanceError) {
    return res.status(500).json({ error: 'Failed to create maintenance' });
  }

  if (service_ids.length > 0) {
    const maintenanceServices = service_ids.map(serviceId => ({
      maintenance_id: maintenance.id,
      service_id: serviceId
    }));

    await supabaseAdmin
      .from('maintenance_services')
      .insert(maintenanceServices);
  }

  res.status(201).json({ maintenance });
}));

router.get('/:id', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { data: maintenance, error } = await supabaseAdmin
    .from('maintenances')
    .select(`
      *,
      maintenance_services (
        service_id,
        services (
          id,
          name
        )
      )
    `)
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .single();

  if (error || !maintenance) {
    return res.status(404).json({ error: 'Maintenance not found' });
  }

  const formattedMaintenance = {
    ...maintenance,
    affected_services: maintenance.maintenance_services.map(ms => ms.services)
  };

  res.json({ maintenance: formattedMaintenance });
}));

router.put('/:id', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, status, scheduled_start, scheduled_end, actual_start, actual_end } = req.body;

  const updates = {};
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status) updates.status = status;
  if (scheduled_start) updates.scheduled_start = scheduled_start;
  if (scheduled_end) updates.scheduled_end = scheduled_end;
  if (actual_start !== undefined) updates.actual_start = actual_start;
  if (actual_end !== undefined) updates.actual_end = actual_end;

  const { data: maintenance, error } = await supabaseAdmin
    .from('maintenances')
    .update(updates)
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update maintenance' });
  }

  res.json({ maintenance });
}));

router.delete('/:id', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('maintenances')
    .delete()
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete maintenance' });
  }

  res.json({ message: 'Maintenance deleted successfully' });
}));

router.post('/:id/start', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { data: maintenance, error } = await supabaseAdmin
    .from('maintenances')
    .update({
      status: 'in_progress',
      actual_start: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to start maintenance' });
  }

  res.json({ maintenance });
}));

router.post('/:id/complete', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { data: maintenance, error } = await supabaseAdmin
    .from('maintenances')
    .update({
      status: 'completed',
      actual_end: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to complete maintenance' });
  }

  res.json({ maintenance });
}));

export default router;
