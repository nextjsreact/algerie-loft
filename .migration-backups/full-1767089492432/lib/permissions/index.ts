/**
 * Permissions system entry point
 * Exports all permission-related utilities and types
 */

export {
  PermissionValidator,
  ROLE_PERMISSIONS,
  type Permission,
  type RolePermissions
} from './types';

export {
  AuditPermissionManager,
  AuditIntegrityManager,
  shouldShowAuditTab
} from './audit-permissions';

/**
 * Simple permission check function for backward compatibility
 */
export function hasPermission(
  userRole: string,
  resource: string,
  action: string = 'read',
  scope?: string
): boolean {
  return PermissionValidator.hasPermission(userRole as any, resource, action, scope);
}

/**
 * Check if user can access a component
 */
export function canAccessComponent(userRole: string, component: string): boolean {
  return PermissionValidator.canAccessComponent(userRole as any, component);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: string) {
  return PermissionValidator.getRolePermissions(userRole as any);
}