import type { AuthSession, UserRole } from '@/lib/types';
import type { SuperuserProfile, SuperuserPermission, SuperuserSession } from '@/types/superuser';

/**
 * Enhanced authentication types
 */

export interface EnhancedAuthSession extends AuthSession {
  isSuperuser: boolean;
  superuserProfile?: SuperuserProfile;
  superuserSession?: SuperuserSession;
  permissions: SuperuserPermission[];
}

export interface AuthorizationResult {
  authorized: boolean;
  session?: EnhancedAuthSession;
  error?: string;
  redirectUrl?: string;
}

export interface SuperuserSessionManager {
  createSession: (superuserProfile: SuperuserProfile, metadata?: SessionMetadata) => Promise<SuperuserSession | null>;
  validateSession: (sessionToken?: string) => Promise<SuperuserSession | null>;
  refreshSession: (sessionId: string, additionalMinutes?: number) => Promise<boolean>;
  invalidateSession: (sessionId?: string) => Promise<void>;
  extendSession: (sessionId: string, additionalMinutes?: number) => Promise<boolean>;
  requireActiveSession: () => Promise<SuperuserSession>;
}

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  mfaVerified?: boolean;
  requestId?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: SuperuserSession;
  reason?: 'expired' | 'not_found' | 'inactive' | 'invalid_user';
}