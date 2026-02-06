import { supabaseAdmin } from '../config/supabase.js';

export const validateOrganizationAccess = async (req, res, next) => {
  try {
    const organizationId = req.params.orgId || req.params.id;
    const userId = req.user.id;

    console.log('[Tenant Middleware] Validating access - OrgId:', organizationId, 'UserId:', userId);

    if (!organizationId) {
      console.log('[Tenant Middleware] Error: Organization ID is required');
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const { data: membership, error } = await supabaseAdmin
      .from('organization_members')
      .select('role, organization_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error || !membership) {
      console.error('[Tenant Middleware] Access denied - Error:', error, 'Membership:', membership);
      return res.status(403).json({ error: 'Access denied to this organization' });
    }

    console.log('[Tenant Middleware] Access granted - Role:', membership.role);
    req.organizationId = organizationId;
    req.userRole = membership.role;
    next();
  } catch (error) {
    console.error('[Tenant Middleware] Exception:', error);
    return res.status(500).json({ error: 'Failed to validate organization access' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'User role not found' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireMemberOrAdmin = requireRole(['admin', 'member']);
