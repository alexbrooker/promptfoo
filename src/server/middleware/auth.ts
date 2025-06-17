import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import logger from '../../logger';

// Create Supabase client for server-side auth
export const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export interface AuthenticatedRequest extends Request {
  user?: User;
  profile?: {
    id: string;
    email: string;
    name?: string;
    company?: string;
    chatbotRole?: string;
    industry?: string;
    useCase?: string;
    stripe_customer_id?: string;
  };
}

export async function authenticateSupabaseUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`Authentication failed: ${error?.message}`);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch user profile data
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        profile = profileData;
      }
    } catch (profileError) {
      logger.warn(`Failed to fetch user profile: ${profileError}`);
      // Continue without profile data - not critical for auth
    }

    // Add user and profile to request
    req.user = user;
    req.profile = profile || {
      id: user.id,
      email: user.email || '',
    };

    logger.info(`Authenticated user: ${user.email} (${user.id})`);
    next();
  } catch (error) {
    logger.error(`Authentication middleware error: ${error}`);
    res.status(500).json({ error: 'Authentication service error' });
  }
}

// Optional authentication - continues even if no auth provided
export async function optionalSupabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;

      // Try to fetch profile
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          req.profile = profileData;
        }
      } catch {
        // Continue without profile
      }
    }

    next();
  } catch (error) {
    logger.error(`Optional authentication error: ${error}`);
    // Continue without auth on error
    next();
  }
}
