"use server"

import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/types';

/**
 * Enhanced role detection — multi-role architecture
 * A user can be in multiple tables simultaneously (customers, owners, profiles).
 * The login_context cookie determines which role to use for the current session.
 */

export async function detectUserRole(userId: string, userEmail: string | null): Promise<UserRole> {
  try {
    const supabase = await createClient(true);

    // Read login_context cookie to determine which role the user chose at login
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const loginContext = cookieStore.get('login_context')?.value;

    console.log(`[ROLE DETECTION] User ${userId}, loginContext: ${loginContext}`);

    // Superuser always takes priority regardless of context
    const { data: superuserProfile } = await supabase
      .from('superuser_profiles')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (superuserProfile) {
      console.log(`[ROLE DETECTION] User ${userId} → superuser`);
      return 'superuser';
    }

    // Route based on login_context chosen at login
    if (loginContext === 'client') {
      // Verify user is actually in customers table
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', userId)
        .single();
      if (customer) {
        console.log(`[ROLE DETECTION] User ${userId} → client (via login_context)`);
        return 'client';
      }
      console.log(`[ROLE DETECTION] User ${userId} chose client but not in customers table`);
    }

    if (loginContext === 'partner') {
      // Verify user is actually in owners table
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('id', userId)
        .single();
      if (owner) {
        console.log(`[ROLE DETECTION] User ${userId} → partner (via login_context)`);
        return 'partner';
      }
      console.log(`[ROLE DETECTION] User ${userId} chose partner but not in owners table`);
    }

    // For employee context (or no context), use profiles table role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role && profile.role !== 'member') {
      // Check admin → superuser upgrade
      if (profile.role === 'admin') {
        const { data: superuserCheck } = await supabase
          .from('superuser_profiles')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();
        if (superuserCheck) return 'superuser';
      }
      console.log(`[ROLE DETECTION] User ${userId} → ${profile.role} (from profiles)`);
      return profile.role as UserRole;
    }

    // profile.role is 'member' (default from trigger) — check if user has other roles
    // If no login_context was set, try to infer the best role
    const [{ data: customer }, { data: owner }] = await Promise.all([
      supabase.from('customers').select('id').eq('id', userId).single(),
      supabase.from('owners').select('id').eq('id', userId).single(),
    ]);

    if (customer && !owner) {
      console.log(`[ROLE DETECTION] User ${userId} → client (only in customers, no context)`);
      return 'client';
    }
    if (owner && !customer) {
      console.log(`[ROLE DETECTION] User ${userId} → partner (only in owners, no context)`);
      return 'partner';
    }

    // User is in multiple tables but no login_context — default to member (employee)
    console.log(`[ROLE DETECTION] User ${userId} → member (fallback)`);
    return 'member';

  } catch (error) {
    console.error('[ROLE DETECTION] Error detecting user role:', error);
    return 'member';
  }
}

/**
 * Detect role from email patterns
 */
function detectRoleFromEmail(email: string): UserRole {
  const emailLower = email.toLowerCase();
  
  // Superuser patterns
  if (emailLower.includes('superuser') || 
      emailLower === 'superuser@dev.local' ||
      emailLower.includes('super-admin')) {
    return 'superuser';
  }
  
  // Admin patterns
  if (emailLower.includes('admin') || 
      emailLower === 'admin@dev.local' ||
      emailLower.includes('administrator')) {
    return 'admin';
  }
  
  // Manager patterns
  if (emailLower.includes('manager') || 
      emailLower.includes('mgr')) {
    return 'manager';
  }
  
  // Executive patterns
  if (emailLower.includes('executive') || 
      emailLower.includes('exec') ||
      emailLower.includes('director')) {
    return 'executive';
  }
  
  // Client patterns
  if (emailLower.includes('client') || 
      emailLower.includes('customer')) {
    return 'client';
  }
  
  // Partner patterns - DISABLED: Partners should register explicitly
  // if (emailLower.includes('partner') || 
  //     emailLower.includes('vendor')) {
  //   return 'partner';
  // }
  
  return 'guest'; // No pattern matched
}

/**
 * Create user profile with detected role
 */
async function createUserProfile(userId: string, role: UserRole, email: string | null): Promise<void> {
  try {
    const supabase = await createClient(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: role,
        full_name: email?.split('@')[0] || 'User',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (error) {
      console.error('[ROLE DETECTION] Error creating/updating profile:', error);
    } else {
      console.log(`[ROLE DETECTION] Profile created/updated for user ${userId} with role ${role}`);
    }
  } catch (error) {
    console.error('[ROLE DETECTION] Error in createUserProfile:', error);
  }
}

/**
 * Ensure superuser profile exists for superuser role
 */
export async function ensureSuperuserProfile(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    
    // Check if superuser profile already exists
    const { data: existing } = await supabase
      .from('superuser_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      return true; // Already exists
    }
    
    // Create superuser profile
    const { error } = await supabase
      .from('superuser_profiles')
      .insert({
        user_id: userId,
        granted_by: 'system',
        granted_at: new Date().toISOString(),
        permissions: [
          'USER_MANAGEMENT',
          'BACKUP_MANAGEMENT', 
          'SYSTEM_CONFIG',
          'AUDIT_ACCESS',
          'SECURITY_MONITORING',
          'MAINTENANCE_TOOLS',
          'ARCHIVE_MANAGEMENT',
          'EMERGENCY_ACTIONS'
        ],
        is_active: true,
        last_activity: new Date().toISOString(),
        session_timeout_minutes: 30,
        require_mfa: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('[ROLE DETECTION] Error creating superuser profile:', error);
      return false;
    }
    
    console.log(`[ROLE DETECTION] Superuser profile created for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error('[ROLE DETECTION] Error in ensureSuperuserProfile:', error);
    return false;
  }
}

/**
 * Force role update for a specific user (admin function)
 */
export async function forceUpdateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    
    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error('[ROLE DETECTION] Error updating profile role:', profileError);
      return false;
    }
    
    // If new role is superuser, ensure superuser profile exists
    if (newRole === 'superuser') {
      await ensureSuperuserProfile(userId);
    }
    
    console.log(`[ROLE DETECTION] User ${userId} role updated to ${newRole}`);
    return true;
    
  } catch (error) {
    console.error('[ROLE DETECTION] Error in forceUpdateUserRole:', error);
    return false;
  }
}