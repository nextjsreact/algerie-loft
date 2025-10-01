"use server"

import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient, createReadOnlyClient } from '@/utils/supabase/server'
import type { AuthSession } from "./types"

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

export async function requireRole(allowedRoles: string[]): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/fr/unauthorized")
  }

  return session
}

export async function requireRoleAPI(allowedRoles: string[]): Promise<AuthSession | null> {
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
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient() // Use normal client (anon key) for user auth
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'member',
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut();
  redirect("/fr/login");
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