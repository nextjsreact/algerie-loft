// Enhanced authentication system exports

// Base authentication (backward compatibility)
export * from '@/lib/auth';

// Enhanced authentication with superuser support
export * from './enhanced-auth';

// Superuser session management
export * from './superuser-session';

// Type exports
export type { 
  EnhancedAuthSession,
  AuthorizationResult 
} from './types';

export type {
  SuperuserSessionManager,
  SessionMetadata,
  SessionValidationResult
} from './types';

// Re-export superuser types for convenience
export type {
  SuperuserProfile,
  SuperuserSession,
  SuperuserPermission,
  AuditLogEntry,
  SuperuserAuthResult,
  MFAChallenge,
  SecurityAlert,
  SystemMetrics
} from '@/types/superuser';

// Re-export base types
export type {
  AuthSession,
  UserRole,
  User
} from '@/lib/types';