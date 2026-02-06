import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateOrganizationAccess, requireMemberOrAdmin, requireAdmin } from '../middleware/tenant.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router({ mergeParams: true });

router.get('/', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = supabaseAdmin
    .from('incidents')
    .select(`
      *,
      incident_services (
        service_id,
        services (
          id,
          name
        )
      )
    `)
    .eq('organization_id', req.params.orgId)
    .order('started_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: incidents, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }

  const formattedIncidents = incidents.map(incident => ({
    ...incident,
    affected_services: incident.incident_services.map(is => is.services)
  }));

  res.json({ incidents: formattedIncidents });
}));

router.post('/', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, impact, service_ids = [] } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Incident title is required' });
  }

  const validImpacts = ['degraded_performance', 'partial_outage', 'major_outage'];
  if (impact && !validImpacts.includes(impact)) {
    return res.status(400).json({ error: 'Invalid impact value' });
  }

  const { data: incident, error: incidentError } = await supabaseAdmin
    .from('incidents')
    .insert({
      organization_id: req.params.orgId,
      title,
      description,
      impact: impact || 'degraded_performance',
      status: 'investigating',
      created_by: req.user.id
    })
    .select()
    .single();

  if (incidentError) {
    return res.status(500).json({ error: 'Failed to create incident' });
  }

  if (service_ids.length > 0) {
    const incidentServices = service_ids.map(serviceId => ({
      incident_id: incident.id,
      service_id: serviceId
    }));

    await supabaseAdmin
      .from('incident_services')
      .insert(incidentServices);
  }

  const { error: updateError } = await supabaseAdmin
    .from('incident_updates')
    .insert({
      incident_id: incident.id,
      status: 'investigating',
      message: description || 'We are investigating this incident.',
      created_by: req.user.id
    });

  if (updateError) {
    console.error('Failed to create initial update:', updateError);
  }

  res.status(201).json({ incident });
}));

router.get('/:id', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { data: incident, error } = await supabaseAdmin
    .from('incidents')
    .select(`
      *,
      incident_services (
        service_id,
        services (
          id,
          name
        )
      ),
      incident_updates (
        id,
        status,
        message,
        created_at,
        created_by
      )
    `)
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .single();

  if (error || !incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const formattedIncident = {
    ...incident,
    affected_services: incident.incident_services.map(is => is.services),
    updates: incident.incident_updates.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )
  };

  res.json({ incident: formattedIncident });
}));

router.put('/:id', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { title, description, status, impact } = req.body;

  const updates = {};
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status) updates.status = status;
  if (impact) updates.impact = impact;

  const { data: incident, error } = await supabaseAdmin
    .from('incidents')
    .update(updates)
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update incident' });
  }

  res.json({ incident });
}));

router.delete('/:id', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('incidents')
    .delete()
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete incident' });
  }

  res.json({ message: 'Incident deleted successfully' });
}));

router.post('/:id/updates', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Update message is required' });
  }

  const validStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const { data: update, error: updateError } = await supabaseAdmin
    .from('incident_updates')
    .insert({
      incident_id: req.params.id,
      status,
      message,
      created_by: req.user.id
    })
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({ error: 'Failed to create update' });
  }

  const incidentUpdates = { status };
  if (status === 'resolved') {
    incidentUpdates.resolved_at = new Date().toISOString();
  }

  await supabaseAdmin
    .from('incidents')
    .update(incidentUpdates)
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId);

  res.status(201).json({ update });
}));

router.post('/:id/resolve', authenticateUser, validateOrganizationAccess, requireMemberOrAdmin, asyncHandler(async (req, res) => {
  const { message } = req.body;

  const { data: incident, error: incidentError } = await supabaseAdmin
    .from('incidents')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .eq('organization_id', req.params.orgId)
    .select()
    .single();

  if (incidentError) {
    return res.status(500).json({ error: 'Failed to resolve incident' });
  }

  await supabaseAdmin
    .from('incident_updates')
    .insert({
      incident_id: req.params.id,
      status: 'resolved',
      message: message || 'This incident has been resolved.',
      created_by: req.user.id
    });

  res.json({ incident });
}));

export default router;
