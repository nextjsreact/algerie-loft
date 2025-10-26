"use server"

import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient, createReadOnlyClient } from '@/utils/supabase/server'
import type { AuthSession, UserRole } from "./types"

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createReadOnlyClient(); // Create client here for each request

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Get profile information from the profiles table (not user_metadata)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !supabaseSessionData) {
    return null;
  }
  
  // Determine full_name and role, prioritizing profile data
  const full_name = profile?.full_name || user.user_metadata?.full_name || null;
  const role = profile?.role || user.user_metadata?.role || 'member';

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

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    redirect("/fr/login")
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/fr/unauthorized")
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

export async function login(email: string, password: string, locale?: string): Promise<{ success: boolean; error?: string }> {
  // For server-side login, we need to handle this differently
  // The actual sign-in should happen on the client side
  // This function should only validate credentials
  
  const supabase = await createClient() // Use normal client
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase signInWithPassword error:", error);
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log("Login successful for user:", data.user.email);
      return { success: true }
    }

    return { success: false, error: "No user data returned" }
  } catch (err) {
    console.error("Login exception:", err);
    return { success: false, error: "Authentication failed" }
  }
}

export async function register(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'member'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient() // Use normal client (anon key) for user auth
  const { error } = await supabase.auth.signUp({
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
  redirect("/fr/public");
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

  // Get profile information from the profiles table (not user_metadata)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !supabaseSessionData) {
    return null;
  }

  // Determine full_name and role, prioritizing profile data
  const full_name = profile?.full_name || user.user_metadata?.full_name || null;
  const role = profile?.role || user.user_metadata?.role || 'member';

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