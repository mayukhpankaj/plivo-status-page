import { supabaseAdmin } from '../config/supabase.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth Middleware] Error: No authorization token provided');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('[Auth Middleware] Invalid token - Error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('[Auth Middleware] User authenticated:', user.id, user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Exception:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
