export type SuperuserPermission = 
  | 'USER_MANAGEMENT'
  | 'BACKUP_MANAGEMENT'
  | 'SYSTEM_CONFIG'
  | 'AUDIT_ACCESS'
  | 'SECURITY_MONITORING'
  | 'MAINTENANCE_TOOLS'
  | 'ARCHIVE_MANAGEMENT'
  | 'EMERGENCY_ACTIONS';

export interface SuperuserProfile {
  id: string;
  user_id: string;
  granted_by: string;
  granted_at: Date;
  permissions: SuperuserPermission[];
  is_active: boolean;
  last_activity: Date;
  session_timeout_minutes: number;
  require_mfa: boolean;
  ip_restrictions?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface SuperuserSession {
  id: string;
  superuser_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  started_at: Date;
  last_activity: Date;
  expires_at: Date;
  is_active: boolean;
  mfa_verified: boolean;
  created_at: Date;
}

export interface AuditLogEntry {
  id: string;
  superuser_id: string;
  action_type: 'USER_MANAGEMENT' | 'BACKUP' | 'SYSTEM_CONFIG' | 'SECURITY' | 'MAINTENANCE';
  action_details: Record<string, any>;
  target_user_id?: string;
  target_resource?: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  session_id: string;
  request_id?: string;
  metadata?: Record<string, any>;
}

export interface SuperuserAuthResult {
  success: boolean;
  superuser?: SuperuserProfile;
  session?: SuperuserSession;
  error?: string;
  requiresMFA?: boolean;
}

export interface SuperuserMiddlewareConfig {
  superuserRoutes: string[];
  permissionRequirements: {
    [key: string]: SuperuserPermission[];
  };
  sessionTimeoutMinutes: number;
  requireMFAForCriticalActions: boolean;
  allowedIpRanges?: string[];
}

export interface MFAChallenge {
  id: string;
  superuser_id: string;
  challenge_type: 'EMAIL' | 'TOTP' | 'SMS';
  challenge_code: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

export interface SecurityAlert {
  id: string;
  alert_type: 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'FAILED_LOGIN' | 'PRIVILEGE_ESCALATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  source_ip: string;
  user_id?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
}

export interface SystemMetrics {
  active_users: number;
  total_reservations: number;
  system_health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  database_size: number;
  backup_status: 'UP_TO_DATE' | 'PENDING' | 'FAILED';
  last_backup: Date;
  active_sessions: number;
  error_rate: number;
  response_time_avg: number;
}