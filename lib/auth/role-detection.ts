"use server"

import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/types';

/**
 * Enhanced role detection for OAuth and other authentication methods
 */

export async function detectUserRole(userId: string, userEmail: string | null): Promise<UserRole> {
  try {
    const supabase = await createClient(true); // Use service role for full access
    
    // Step 1: Check if user has a superuser profile (highest priority)
    const { data: superuserProfile } = await supabase
      .from('superuser_profiles')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (superuserProfile) {
      console.log(`[ROLE DETECTION] User ${userId} detected as superuser via profile`);
      return 'superuser';
    }
    
    // Step 2: Check customers table — real end-users who book lofts
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', userId)
      .single();

    if (customer) {
      console.log(`[ROLE DETECTION] User ${userId} found in customers table → role: client`);
      return 'client';
    }

    // Step 3: Check partner_profiles table — property owners who registered as partners
    const { data: partnerProfile } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (partnerProfile) {
      console.log(`[ROLE DETECTION] User ${userId} found in partner_profiles → role: partner`);
      return 'partner';
    }

    // Step 4: Check profiles table for employee roles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profile?.role) {
      console.log(`[ROLE DETECTION] User ${userId} has profile role: ${profile.role}`);
      
      // If user is admin, double-check for superuser privileges
      if (profile.role === 'admin') {
        const { data: superuserCheck } = await supabase
          .from('superuser_profiles')
          .select('id, is_active')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();
        
        if (superuserCheck) {
          console.log(`[ROLE DETECTION] Admin user ${userId} upgraded to superuser`);
          return 'superuser';
        }
      }
      
      // Ignore 'client' role in profiles table — real clients are in customers table
      // A profiles entry with role='client' is a mistake, treat as member
      if (profile.role === 'client') {
        console.log(`[ROLE DETECTION] User ${userId} has role=client in profiles but NOT in customers — treating as member`);
        return 'member';
      }
      
      return profile.role as UserRole;
    }
    
    // Step 5: Email-based role detection (fallback for employees)
    if (userEmail) {
      const emailRole = detectRoleFromEmail(userEmail);
      if (emailRole !== 'guest' && emailRole !== 'client') {
        console.log(`[ROLE DETECTION] User ${userId} role detected from email: ${emailRole}`);
        await createUserProfile(userId, emailRole, userEmail);
        return emailRole;
      }
    }
    
    // Step 6: Default — unknown user, safe fallback
    console.log(`[ROLE DETECTION] User ${userId} not found in any table, defaulting to member`);
    return 'member';
    
  } catch (error) {
    console.error('[ROLE DETECTION] Error detecting user role:', error);
    return 'member'; // Safe fallback
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