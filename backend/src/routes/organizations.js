import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateOrganizationAccess, requireAdmin } from '../middleware/tenant.js';
import { asyncHandler } from '../utils/helpers.js';
import { generateSlug } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  console.log('[GET /organizations] User:', req.user.id);
  
  const { data: memberships, error } = await supabaseAdmin
    .from('organization_members')
    .select(`
      role,
      organization_id,
      organizations (
        id,
        name,
        slug,
        description,
        logo_url,
        website_url,
        created_at
      )
    `)
    .eq('user_id', req.user.id);

  if (error) {
    console.error('[GET /organizations] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }

  const organizations = memberships.map(m => ({
    ...m.organizations,
    role: m.role
  }));

  console.log('[GET /organizations] Success: Found', organizations.length, 'organizations');
  res.json({ organizations });
}));

router.post('/', authenticateUser, asyncHandler(async (req, res) => {
  const { name, description, website_url } = req.body;

  if (!name) {
    console.log('[POST /organizations] Error: Name is required');
    return res.status(400).json({ error: 'Organization name is required' });
  }

  const slug = generateSlug(name);
  console.log('[POST /organizations] Generated slug:', slug);

  const { data: existing } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    console.log('[POST /organizations] Error: Organization with this name already exists');
    return res.status(400).json({ error: 'Organization with this name already exists' });
  }

  const { data: organization, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name,
      slug,
      description,
      website_url,
      logo_url
    })
    .select()
    .single();

  if (orgError) {
    console.error('[POST /organizations] Organization creation error:', orgError);
    return res.status(500).json({ error: 'Failed to create organization' });
  }

  console.log('[POST /organizations] Organization created:', organization.id);

  const { error: memberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: req.user.id,
      role: 'admin',
      joined_at: new Date().toISOString()
    });

  if (memberError) {
    console.error('[POST /organizations] Member creation error:', memberError);
    await supabaseAdmin.from('organizations').delete().eq('id', organization.id);
    return res.status(500).json({ error: 'Failed to add user as organization admin' });
  }

  console.log('[POST /organizations] Success: Organization created with admin member');
  res.status(201).json({ organization: { ...organization, role: 'admin' } });
}));

router.get('/:id', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { data: organization, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  res.json({ organization });
}));

router.put('/:id', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { name, description, website_url, logo_url } = req.body;

  const updates = {};
  if (name) {
    updates.name = name;
    updates.slug = generateSlug(name);
  }
  if (description !== undefined) updates.description = description;
  if (website_url !== undefined) updates.website_url = website_url;
  if (logo_url !== undefined) updates.logo_url = logo_url;

  const { data: organization, error } = await supabaseAdmin
    .from('organizations')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update organization' });
  }

  res.json({ organization });
}));

router.delete('/:id', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('organizations')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete organization' });
  }

  res.json({ message: 'Organization deleted successfully' });
}));

router.get('/:id/members', authenticateUser, validateOrganizationAccess, asyncHandler(async (req, res) => {
  const { data: members, error } = await supabaseAdmin
    .from('organization_members')
    .select(`
      id,
      role,
      invited_at,
      joined_at,
      user_id
    `)
    .eq('organization_id', req.params.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch members' });
  }

  const userIds = members.map(m => m.user_id);
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  
  const usersMap = {};
  users.users.forEach(user => {
    usersMap[user.id] = {
      email: user.email,
      created_at: user.created_at
    };
  });

  const membersWithDetails = members.map(member => ({
    ...member,
    email: usersMap[member.user_id]?.email || 'Unknown'
  }));

  res.json({ members: membersWithDetails });
}));

router.post('/:id/members', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { email, role = 'viewer' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === email);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { data: existing } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', req.params.id)
    .eq('user_id', targetUser.id)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'User is already a member' });
  }

  const { data: member, error } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: req.params.id,
      user_id: targetUser.id,
      role,
      invited_by: req.user.id,
      joined_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to add member' });
  }

  res.status(201).json({ member: { ...member, email } });
}));

router.put('/:id/members/:userId', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Check if this is the last admin
  const { data: currentMember } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('organization_id', req.params.id)
    .eq('user_id', req.params.userId)
    .single();

  if (currentMember?.role === 'admin' && role !== 'admin') {
    // Count total admins in the organization
    const { data: admins } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', req.params.id)
      .eq('role', 'admin');

    if (admins && admins.length === 1) {
      return res.status(400).json({ error: 'Cannot change role of the last admin. Organization must have at least one admin.' });
    }
  }

  const { data: member, error } = await supabaseAdmin
    .from('organization_members')
    .update({ role })
    .eq('organization_id', req.params.id)
    .eq('user_id', req.params.userId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update member role' });
  }

  res.json({ member });
}));

router.delete('/:id/members/:userId', authenticateUser, validateOrganizationAccess, requireAdmin, asyncHandler(async (req, res) => {
  // Check if trying to remove the last admin
  const { data: targetMember } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('organization_id', req.params.id)
    .eq('user_id', req.params.userId)
    .single();

  if (targetMember?.role === 'admin') {
    // Count total admins in the organization
    const { data: admins } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', req.params.id)
      .eq('role', 'admin');

    if (admins && admins.length === 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin. Organization must have at least one admin.' });
    }
  }

  const { error } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('organization_id', req.params.id)
    .eq('user_id', req.params.userId);

  if (error) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }

  res.json({ message: 'Member removed successfully' });
}));

export default router;
