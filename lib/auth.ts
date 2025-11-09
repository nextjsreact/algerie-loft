"use server"

import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient, createReadOnlyClient } from '@/utils/supabase/server'
import type { AuthSession, UserRole } from "./types"

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createReadOnlyClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Use enhanced role detection
  const { detectUserRole } = await import('@/lib/auth/role-detection');
  const role = await detectUserRole(user.id, user.email);
  
  // Get user profile for display name
  let full_name = user.user_metadata?.full_name || user.email?.split('@')[0] || null;
  
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const serviceSupabase = await createClient(true);
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profile?.full_name) {
      full_name = profile.full_name;
    }
  } catch (error) {
    console.warn('Profile name fetch failed:', error);
  }

  const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !supabaseSessionData) {
    return null;
  }

  const newSession: AuthSession = {
    user: {
      id: user.id,
      email: user.email ?? null,
      full_name: full_name,
      role: role,
      created_at: user.created_at,
      updated_at: user.updated_at ?? null
    },
    token: supabaseSessionData.access_token
  };
  
  return newSession;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    redirect("/fr/login")
  }
  return session
}

export async function requireAuthAPI(): Promise<AuthSession | null> {
  const session = await getSession()
  return session
}

export async function requireRole(allowedRoles: UserRole[], locale?: string): Promise<AuthSession> {
  const session = await getSession()
  
  // Utiliser la locale fournie ou français par défaut
  const targetLocale = locale || 'fr'
  
  if (!session) {
    redirect(`/${targetLocale}/login`)
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect(`/${targetLocale}/unauthorized`)
  }

  return session
}

export async function requireRoleAPI(allowedRoles: UserRole[]): Promise<AuthSession | null> {
  const session = await getSession()
  if (!session) {
    return null
  }

  if (!allowedRoles.includes(session.user.role)) {
    return null
  }

  return session
}

export async function login(email: string, password: string, locale?: string, loginContext?: 'employee' | 'client' | 'partner'): Promise<{ success: boolean; error?: string; user?: { id: string; email: string; role: UserRole }; loginContext?: string }> {
  // Check account lockout status
  const { AccountLockout } = await import('./security/password-security');
  const lockoutStatus = await AccountLockout.isAccountLocked(email);
  
  if (lockoutStatus.isLocked) {
    const timeRemaining = lockoutStatus.lockoutExpires 
      ? Math.ceil((lockoutStatus.lockoutExpires.getTime() - new Date().getTime()) / (1000 * 60))
      : 0;
    return { 
      success: false, 
      error: `Account is locked due to multiple failed login attempts. Please try again in ${timeRemaining} minutes.` 
    };
  }

  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase signInWithPassword error:", error);
      
      // Record failed login attempt
      await AccountLockout.recordFailedAttempt(email);
      
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log("Login successful for user:", data.user.email);
      console.log("Login context:", loginContext);
      
      // Clear any failed login attempts on successful login
      await AccountLockout.clearFailedAttempts(email);
      
      // Detect user role
      const { detectUserRole } = await import('@/lib/auth/role-detection');
      const role = await detectUserRole(data.user.id, data.user.email);
      
      // Note: login_context cookie is created client-side in the login forms
      // because server-side cookie creation doesn't work when called from client components
      
      // Record successful login for audit
      try {
        const { DataLifecycleTracker } = await import('./security/data-retention');
        await DataLifecycleTracker.recordEvent({
          userId: data.user.id,
          dataType: 'user_profile',
          action: 'accessed',
          metadata: { action: 'login', timestamp: new Date().toISOString(), context: loginContext }
        });
      } catch (auditError) {
        console.error('Failed to record login audit:', auditError);
      }
      
      return { 
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          role: role
        },
        loginContext: loginContext
      }
    }

    return { success: false, error: "No user data returned" }
  } catch (err) {
    console.error("Login exception:", err);
    
    // Record failed login attempt
    await AccountLockout.recordFailedAttempt(email);
    
    return { success: false, error: "Authentication failed" }
  }
}

export async function register(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'member'
): Promise<{ success: boolean; error?: string }> {
  // Validate password strength
  const { validatePasswordStrength } = await import('./security/password-security');
  const passwordValidation = validatePasswordStrength(password);
  
  if (!passwordValidation.isValid) {
    return { 
      success: false, 
      error: `Password requirements not met: ${passwordValidation.errors.join(', ')}` 
    };
  }

  // Check if password is compromised
  const { checkPasswordCompromise } = await import('./security/password-security');
  if (checkPasswordCompromise(password)) {
    return { 
      success: false, 
      error: 'This password has been found in data breaches. Please choose a different password.' 
    };
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Record GDPR consent and data processing
  if (data.user) {
    try {
      const { ConsentManager, DataProcessingRegistry } = await import('./security/gdpr-compliance');
      const { DataLifecycleTracker } = await import('./security/data-retention');
      
      // Record consent for account creation
      await ConsentManager.recordConsent({
        userId: data.user.id,
        dataCategory: 'personal_identity' as any,
        legalBasis: 'contract' as any,
        purpose: 'Account creation and service provision',
        consentGiven: true,
        version: '1.0'
      });

      // Record data processing activity
      await DataProcessingRegistry.recordProcessing({
        userId: data.user.id,
        dataCategory: 'personal_identity' as any,
        legalBasis: 'contract' as any,
        purpose: 'User account management',
        dataFields: ['email', 'full_name', 'role'],
        encrypted: false,
        source: 'registration_form'
      });

      // Record lifecycle event
      await DataLifecycleTracker.recordEvent({
        userId: data.user.id,
        dataType: 'user_profile',
        action: 'created'
      });
    } catch (gdprError) {
      // Log GDPR error but don't fail registration
      console.error('GDPR compliance recording failed:', gdprError);
    }
  }

  return { success: true }
}

export async function registerClient(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  return register(email, password, fullName, 'client');
}

export async function registerPartner(
  email: string,
  password: string,
  fullName: string,
  businessInfo: {
    businessName?: string;
    businessType: 'individual' | 'company';
    address: string;
    phone: string;
    taxId?: string;
  }
): Promise<{ success: boolean; error?: string; requiresApproval?: boolean }> {
  const supabase = await createClient();
  
  // First register the user with partner role
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'partner',
      },
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  // If user registration successful, create partner profile
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('partner_profiles')
      .insert({
        user_id: authData.user.id,
        business_name: businessInfo.businessName,
        business_type: businessInfo.businessType,
        address: businessInfo.address,
        phone: businessInfo.phone,
        tax_id: businessInfo.taxId,
        verification_status: 'pending'
      });

    if (profileError) {
      return { success: false, error: 'Failed to create partner profile' };
    }
  }

  return { success: true, requiresApproval: true };
}

export async function registerWithRole(
  email: string,
  password: string,
  fullName: string,
  role: 'client' | 'partner',
  additionalData?: {
    businessName?: string;
    businessType?: 'individual' | 'company';
    address?: string;
    phone?: string;
    taxId?: string;
  }
): Promise<{ success: boolean; error?: string; requiresApproval?: boolean }> {
  const supabase = await createClient()
  
  try {
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "User creation failed" }
    }

    // If partner, create partner profile
    if (role === 'partner' && additionalData) {
      const { error: profileError } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: authData.user.id,
          business_name: additionalData.businessName,
          business_type: additionalData.businessType || 'individual',
          address: additionalData.address || '',
          phone: additionalData.phone || '',
          tax_id: additionalData.taxId,
          verification_status: 'pending'
        })

      if (profileError) {
        console.error("Partner profile creation error:", profileError)
        // Don't fail the registration, just log the error
      }

      return { success: true, requiresApproval: true }
    }

    return { success: true, requiresApproval: false }
  } catch (err) {
    console.error("Registration exception:", err)
    return { success: false, error: "Registration failed" }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut();
  
  // Clear login context cookie
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('login_context');
    console.log('Cleared login_context cookie');
  } catch (error) {
    console.error('Failed to clear login_context cookie:', error);
  }
  
  redirect("/fr");
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Configuration avec fallback pour développement
  const baseUrl = process.env.NODE_ENV === 'development'
    ? `http://localhost:3000`
    : process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`

  // Pour le développement, on utilise une approche plus flexible
  // En production, il faudra configurer les URLs dans Supabase dashboard
  const redirectTo = `${baseUrl}/api/auth/reset-password`

  console.log('Password reset request for:', email)
  console.log('Redirect URL configured:', redirectTo)
  console.log('Environment:', process.env.NODE_ENV)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo,
  })

  if (error) {
    console.error("Error in requestPasswordReset:", error)
    return { success: false, error: "An error occurred while processing your request." }
  }

  console.log('Password reset email sent successfully')
  return { success: true }
}

export async function resetPassword(password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error("Error in resetPassword:", error)
    return { success: false, error: "An error occurred" }
  }

  return { success: true }
}

// Read-only version of getSession for layouts and other contexts where cookies cannot be set
export async function getSessionReadOnly(): Promise<AuthSession | null> {
  const supabase = await createReadOnlyClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Use enhanced role detection (read-only version)
  const { detectUserRole } = await import('@/lib/auth/role-detection');
  const role = await detectUserRole(user.id, user.email);
  
  // Get user profile for display name
  let full_name = user.user_metadata?.full_name || user.email?.split('@')[0] || null;
  
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const serviceSupabase = await createClient(true);
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profile?.full_name) {
      full_name = profile.full_name;
    }
  } catch (error) {
    console.warn('Profile name fetch failed in ReadOnly:', error);
  }

  const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !supabaseSessionData) {
    return null;
  }

  const session: AuthSession = {
    user: {
      id: user.id,
      email: user.email ?? null,
      full_name: full_name,
      role: role,
      created_at: user.created_at,
      updated_at: user.updated_at ?? null
    },
    token: supabaseSessionData.access_token
  };

  return session;
}