"use server"

import { createClient } from '@/utils/supabase/server';
import type { UserRole, User } from '@/lib/types';
import type { SuperuserPermission } from '@/types/superuser';
import { requireSuperuserPermissions, logSuperuserAudit } from './auth';
import { createSecurityAlert } from './security';
import { getClientIPAddress, getUserAgent } from './session';

export interface UserManagementResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface UserSearchFilters {
  role?: UserRole;
  status?: 'active' | 'suspended' | 'deleted';
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

export interface UserUpdateData {
  full_name?: string;
  email?: string;
  role?: UserRole;
  is_suspended?: boolean;
  suspension_reason?: string;
}

/**
 * Get all users with filtering and pagination
 */
export async function getAllUsers(
  filters: UserSearchFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<{
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter.toISOString());
    }

    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore.toISOString());
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'list_users',
      filters,
      page,
      limit,
      resultCount: users?.length || 0
    });

    return {
      users: users || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to retrieve users');
  }
}

/**
 * Get user by ID with detailed information
 */
export async function getUserById(userId: string): Promise<User | null> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    const { data: user, error } = await supabase
      .from('profiles')
      .select(`
        *,
        superuser_profiles(id, is_active, permissions),
        partner_profiles(id, business_name, verification_status)
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'view_user',
      target_user_id: userId
    }, { targetUserId: userId });

    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  updateData: UserUpdateData
): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get current user data for audit
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the update
    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'update_user',
      target_user_id: userId,
      old_values: currentUser,
      new_values: updateData,
      changed_fields: Object.keys(updateData)
    }, { 
      targetUserId: userId,
      severity: 'MEDIUM'
    });

    // Create security alert for role changes
    if (updateData.role && updateData.role !== currentUser.role) {
      const ipAddress = await getClientIPAddress();
      await createSecurityAlert(
        'PRIVILEGE_ESCALATION',
        `User role changed from ${currentUser.role} to ${updateData.role}`,
        ipAddress,
        {
          userId: currentUser.id,
          severity: 'HIGH',
          metadata: {
            oldRole: currentUser.role,
            newRole: updateData.role,
            targetUserId: userId
          }
        }
      );
    }

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * Suspend user account
 */
export async function suspendUser(
  userId: string,
  reason: string,
  duration?: number // Duration in hours, undefined for indefinite
): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const suspensionData: any = {
      is_suspended: true,
      suspension_reason: reason,
      suspended_at: new Date().toISOString()
    };

    if (duration) {
      suspensionData.suspension_expires_at = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update(suspensionData)
      .eq('id', userId);

    if (error) {
      throw error;
    }

    // Invalidate all user sessions
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'suspend_user',
      target_user_id: userId,
      reason,
      duration_hours: duration
    }, { 
      targetUserId: userId,
      severity: 'HIGH'
    });

    const ipAddress = await getClientIPAddress();
    await createSecurityAlert(
      'UNAUTHORIZED_ACCESS',
      `User account suspended: ${reason}`,
      ipAddress,
      {
        userId,
        severity: 'MEDIUM',
        metadata: { reason, duration }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: 'Failed to suspend user' };
  }
}

/**
 * Reactivate suspended user account
 */
export async function reactivateUser(userId: string): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspended_at: null,
        suspension_expires_at: null
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'reactivate_user',
      target_user_id: userId
    }, { 
      targetUserId: userId,
      severity: 'MEDIUM'
    });

    return { success: true };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { success: false, error: 'Failed to reactivate user' };
  }
}

/**
 * Delete user account (soft delete)
 */
export async function deleteUser(userId: string, reason: string): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get user data for audit
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Soft delete - mark as deleted but keep data for audit
    const { error } = await supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deletion_reason: reason,
        email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    // Invalidate all user sessions
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'delete_user',
      target_user_id: userId,
      reason,
      user_data: user
    }, { 
      targetUserId: userId,
      severity: 'CRITICAL'
    });

    const ipAddress = await getClientIPAddress();
    await createSecurityAlert(
      'UNAUTHORIZED_ACCESS',
      `User account deleted: ${reason}`,
      ipAddress,
      {
        userId,
        severity: 'HIGH',
        metadata: { reason, userEmail: user.email }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(
  userId: string,
  newPassword?: string // If not provided, generates temporary password
): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get user email
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user || !user.email) {
      return { success: false, error: 'User not found or no email' };
    }

    let password = newPassword;
    if (!password) {
      // Generate secure temporary password
      password = generateTemporaryPassword();
    }

    // Update password using Supabase Admin API
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
      user_metadata: {
        password_reset_required: true,
        password_reset_by: 'superuser'
      }
    });

    if (error) {
      throw error;
    }

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'reset_password',
      target_user_id: userId,
      temporary_password_generated: !newPassword
    }, { 
      targetUserId: userId,
      severity: 'HIGH'
    });

    return { 
      success: true, 
      data: { 
        temporaryPassword: !newPassword ? password : undefined,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Error resetting user password:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Assign role to user
 */
export async function assignUserRole(
  userId: string,
  newRole: UserRole
): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get current user data
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Update role
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'assign_role',
      target_user_id: userId,
      old_role: currentUser.role,
      new_role: newRole
    }, { 
      targetUserId: userId,
      severity: 'HIGH'
    });

    const ipAddress = await getClientIPAddress();
    await createSecurityAlert(
      'PRIVILEGE_ESCALATION',
      `User role changed from ${currentUser.role} to ${newRole}`,
      ipAddress,
      {
        userId,
        severity: newRole === 'admin' || newRole === 'superuser' ? 'CRITICAL' : 'HIGH',
        metadata: {
          oldRole: currentUser.role,
          newRole,
          userEmail: currentUser.email
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error assigning user role:', error);
    return { success: false, error: 'Failed to assign role' };
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string): Promise<{
  lastLogin?: Date;
  loginCount: number;
  lastActivity?: Date;
  activeSessions: number;
  recentActions: Array<{
    action: string;
    timestamp: Date;
    details: any;
  }>;
}> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get login history
    const { data: loginHistory } = await supabase
      .from('audit_logs')
      .select('timestamp')
      .eq('target_user_id', userId)
      .contains('action_details', { action: 'login' })
      .order('timestamp', { ascending: false })
      .limit(1);

    // Get session count
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get recent actions
    const { data: recentActions } = await supabase
      .from('audit_logs')
      .select('action_type, action_details, timestamp')
      .eq('target_user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return {
      lastLogin: loginHistory?.[0] ? new Date(loginHistory[0].timestamp) : undefined,
      loginCount: loginHistory?.length || 0,
      activeSessions: sessions?.length || 0,
      recentActions: recentActions?.map(action => ({
        action: action.action_type,
        timestamp: new Date(action.timestamp),
        details: action.action_details
      })) || []
    };
  } catch (error) {
    console.error('Error getting user activity summary:', error);
    return {
      loginCount: 0,
      activeSessions: 0,
      recentActions: []
    };
  }
}

/**
 * Bulk user operations
 */
export async function bulkUpdateUsers(
  userIds: string[],
  updateData: Partial<UserUpdateData>
): Promise<UserManagementResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .in('id', userIds);

    if (error) {
      throw error;
    }

    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'bulk_update_users',
      target_user_ids: userIds,
      update_data: updateData,
      affected_count: userIds.length
    }, { severity: 'HIGH' });

    return { success: true, data: { affectedCount: userIds.length } };
  } catch (error) {
    console.error('Error bulk updating users:', error);
    return { success: false, error: 'Failed to bulk update users' };
  }
}

/**
 * Generate temporary password
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}