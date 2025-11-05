"use server"

import { createClient } from '@/utils/supabase/server';
import type { User, UserRole } from '@/lib/types';
import { requireSuperuserPermissions, logSuperuserAudit } from './auth';

export interface AdvancedUserSearchFilters {
  // Basic filters
  role?: UserRole;
  status?: 'active' | 'suspended' | 'deleted';
  search?: string; // Search in name, email
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  
  // Advanced filters
  hasPartnerProfile?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  hasSuperuserAccess?: boolean;
  includeDeleted?: boolean;
  
  // Activity filters
  loginCountMin?: number;
  loginCountMax?: number;
  activeSessionsMin?: number;
  activeSessionsMax?: number;
}

export interface SearchOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface UserSearchResult {
  users: ExtendedUser[];
  total: number;
  page: number;
  totalPages: number;
  filters: AdvancedUserSearchFilters;
}

export interface ExtendedUser extends User {
  // Profile information
  created_at: string;
  updated_at?: string;
  last_login?: string;
  is_suspended?: boolean;
  suspension_reason?: string;
  suspended_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  
  // Related data
  partner_profile?: {
    id: string;
    business_name?: string;
    verification_status: string;
  };
  superuser_profile?: {
    id: string;
    is_active: boolean;
    permissions: string[];
  };
  
  // Activity metrics
  login_count?: number;
  active_sessions?: number;
  last_activity?: string;
}

/**
 * Advanced user search with multiple criteria
 */
export async function searchUsers(
  filters: AdvancedUserSearchFilters,
  options: SearchOptions
): Promise<UserSearchResult> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Build the base query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        partner_profiles(id, business_name, verification_status),
        superuser_profiles(id, is_active, permissions)
      `, { count: 'exact' });

    // Apply filters
    query = applySearchFilters(query, filters);

    // Apply sorting
    const sortColumn = mapSortColumn(options.sortBy);
    query = query.order(sortColumn, { ascending: options.sortOrder === 'asc' });

    // Apply pagination
    const offset = (options.page - 1) * options.limit;
    query = query.range(offset, offset + options.limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    // Enhance users with activity data
    const enhancedUsers = await enhanceUsersWithActivity(users || []);

    return {
      users: enhancedUsers,
      total: count || 0,
      page: options.page,
      totalPages: Math.ceil((count || 0) / options.limit),
      filters
    };

  } catch (error) {
    console.error('Error in advanced user search:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Apply search filters to the query
 */
function applySearchFilters(query: any, filters: AdvancedUserSearchFilters) {
  // Role filter
  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  // Status filters
  if (filters.status === 'active') {
    query = query.eq('is_suspended', false);
    if (!filters.includeDeleted) {
      query = query.or('is_deleted.is.null,is_deleted.eq.false');
    }
  } else if (filters.status === 'suspended') {
    query = query.eq('is_suspended', true);
  } else if (filters.status === 'deleted') {
    query = query.eq('is_deleted', true);
  }

  // Include/exclude deleted users
  if (!filters.includeDeleted) {
    query = query.or('is_deleted.is.null,is_deleted.eq.false');
  }

  // Text search in name and email
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  // Date filters
  if (filters.createdAfter) {
    query = query.gte('created_at', filters.createdAfter.toISOString());
  }
  if (filters.createdBefore) {
    query = query.lte('created_at', filters.createdBefore.toISOString());
  }
  if (filters.lastLoginAfter) {
    query = query.gte('last_login', filters.lastLoginAfter.toISOString());
  }
  if (filters.lastLoginBefore) {
    query = query.lte('last_login', filters.lastLoginBefore.toISOString());
  }

  // Partner profile filter
  if (filters.hasPartnerProfile !== undefined) {
    if (filters.hasPartnerProfile) {
      query = query.not('partner_profiles', 'is', null);
    } else {
      query = query.is('partner_profiles', null);
    }
  }

  // Superuser access filter
  if (filters.hasSuperuserAccess !== undefined) {
    if (filters.hasSuperuserAccess) {
      query = query.not('superuser_profiles', 'is', null);
    } else {
      query = query.is('superuser_profiles', null);
    }
  }

  return query;
}

/**
 * Map sort column names to database columns
 */
function mapSortColumn(sortBy: string): string {
  const columnMap: { [key: string]: string } = {
    'name': 'full_name',
    'email': 'email',
    'role': 'role',
    'created': 'created_at',
    'updated': 'updated_at',
    'lastLogin': 'last_login'
  };

  return columnMap[sortBy] || 'created_at';
}

/**
 * Enhance users with activity data
 */
async function enhanceUsersWithActivity(users: any[]): Promise<ExtendedUser[]> {
  const supabase = await createClient(true);
  
  const enhancedUsers = await Promise.all(
    users.map(async (user) => {
      try {
        // Get login count from audit logs
        const { count: loginCount } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('target_user_id', user.id)
          .contains('action_details', { action: 'login' });

        // Get active sessions count
        const { count: activeSessions } = await supabase
          .from('user_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Get last activity from sessions
        const { data: lastSession } = await supabase
          .from('user_sessions')
          .select('last_activity')
          .eq('user_id', user.id)
          .order('last_activity', { ascending: false })
          .limit(1)
          .single();

        return {
          ...user,
          login_count: loginCount || 0,
          active_sessions: activeSessions || 0,
          last_activity: lastSession?.last_activity
        };
      } catch (error) {
        console.error(`Error enhancing user ${user.id}:`, error);
        return {
          ...user,
          login_count: 0,
          active_sessions: 0
        };
      }
    })
  );

  return enhancedUsers;
}

/**
 * Export user data in various formats
 */
export async function exportUserData(
  filters: AdvancedUserSearchFilters,
  format: 'csv' | 'json'
): Promise<{
  success: boolean;
  data?: string;
  recordCount?: number;
  error?: string;
}> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    // Get all matching users (no pagination for export)
    const result = await searchUsers(filters, {
      page: 1,
      limit: 10000, // Large limit for export
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    if (format === 'csv') {
      const csvData = convertToCSV(result.users);
      return {
        success: true,
        data: csvData,
        recordCount: result.users.length
      };
    } else {
      const jsonData = JSON.stringify({
        exportDate: new Date().toISOString(),
        filters,
        totalRecords: result.users.length,
        users: result.users.map(sanitizeUserForExport)
      }, null, 2);
      
      return {
        success: true,
        data: jsonData,
        recordCount: result.users.length
      };
    }

  } catch (error) {
    console.error('Error exporting user data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    };
  }
}

/**
 * Convert users array to CSV format
 */
function convertToCSV(users: ExtendedUser[]): string {
  const headers = [
    'ID',
    'Email',
    'Full Name',
    'Role',
    'Created At',
    'Last Login',
    'Is Suspended',
    'Suspension Reason',
    'Is Deleted',
    'Login Count',
    'Active Sessions',
    'Partner Business Name',
    'Partner Verification Status',
    'Has Superuser Access'
  ];

  const csvRows = [headers.join(',')];

  users.forEach(user => {
    const row = [
      user.id,
      `"${user.email || ''}"`,
      `"${user.full_name || ''}"`,
      user.role,
      user.created_at,
      user.last_login || '',
      user.is_suspended || false,
      `"${user.suspension_reason || ''}"`,
      user.is_deleted || false,
      user.login_count || 0,
      user.active_sessions || 0,
      `"${user.partner_profile?.business_name || ''}"`,
      user.partner_profile?.verification_status || '',
      user.superuser_profile?.is_active || false
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Sanitize user data for export (remove sensitive information)
 */
function sanitizeUserForExport(user: ExtendedUser) {
  const sanitized = { ...user };
  
  // Remove sensitive fields
  delete sanitized.avatar_url;
  
  // Sanitize partner profile
  if (sanitized.partner_profile) {
    sanitized.partner_profile = {
      id: sanitized.partner_profile.id,
      business_name: sanitized.partner_profile.business_name,
      verification_status: sanitized.partner_profile.verification_status
    };
  }

  // Sanitize superuser profile
  if (sanitized.superuser_profile) {
    sanitized.superuser_profile = {
      id: sanitized.superuser_profile.id,
      is_active: sanitized.superuser_profile.is_active,
      permissions: sanitized.superuser_profile.permissions
    };
  }

  return sanitized;
}

/**
 * Get user search statistics
 */
export async function getUserSearchStatistics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  deletedUsers: number;
  usersByRole: { [role: string]: number };
  recentRegistrations: number; // Last 30 days
}> {
  await requireSuperuserPermissions(['USER_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get total counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_suspended', false)
      .or('is_deleted.is.null,is_deleted.eq.false');

    const { count: suspendedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_suspended', true);

    const { count: deletedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', true);

    // Get users by role
    const { data: roleData } = await supabase
      .from('profiles')
      .select('role')
      .or('is_deleted.is.null,is_deleted.eq.false');

    const usersByRole: { [role: string]: number } = {};
    roleData?.forEach(user => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentRegistrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      suspendedUsers: suspendedUsers || 0,
      deletedUsers: deletedUsers || 0,
      usersByRole,
      recentRegistrations: recentRegistrations || 0
    };

  } catch (error) {
    console.error('Error getting user search statistics:', error);
    throw new Error('Failed to get user statistics');
  }
}