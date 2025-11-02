/**
 * Client Authentication System
 * Handles client registration and login with proper database synchronization
 */

import { createClient } from '@/utils/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'

export interface ClientRegistrationData {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface ClientLoginData {
  email: string
  password: string
}

/**
 * Register a new client with proper database synchronization
 * Creates user in both auth.users AND public.customers
 */
export async function registerClientComplete(data: ClientRegistrationData): Promise<{
  success: boolean
  error?: string
  requiresEmailVerification?: boolean
}> {
  const supabase = createClient()

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: 'client',
        },
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed' }
    }

    // 2. Create corresponding record in public.customers table
    const [firstName, ...lastNameParts] = data.fullName.split(' ')
    const lastName = lastNameParts.join(' ') || firstName

    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: authData.user.id, // Use same ID as auth.users
        first_name: firstName,
        last_name: lastName,
        email: data.email,
        phone: data.phone || null,
        status: 'prospect',
        email_verified: false,
        preferences: {
          language: 'fr',
          currency: 'DZD',
          notifications: {
            email: true,
            sms: false,
            marketing: false
          }
        },
        created_by: authData.user.id
      })

    if (customerError) {
      console.error('Failed to create customer record:', customerError)
      // Don't fail the registration, but log the error
      // The user is created in auth.users, we can sync later
    }

    return { 
      success: true, 
      requiresEmailVerification: !authData.session // If no session, email verification required
    }

  } catch (error) {
    console.error('Client registration error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    }
  }
}

/**
 * Login client and ensure customer record exists
 */
export async function loginClientComplete(data: ClientLoginData): Promise<{
  success: boolean
  error?: string
  user?: any
}> {
  const supabase = createClient()

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Login failed' }
    }

    // 2. Check if user has client role
    const userRole = authData.user.user_metadata?.role
    if (userRole !== 'client') {
      await supabase.auth.signOut() // Sign out non-client users
      return { success: false, error: 'Access denied. Client account required.' }
    }

    // 3. Ensure customer record exists (sync if missing)
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (customerError && customerError.code === 'PGRST116') {
      // Customer record doesn't exist, create it
      const fullName = authData.user.user_metadata?.full_name || 'Client'
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ') || firstName

      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: authData.user.email!,
          status: 'active',
          email_verified: authData.user.email_confirmed_at ? true : false,
          preferences: {
            language: 'fr',
            currency: 'DZD',
            notifications: {
              email: true,
              sms: false,
              marketing: false
            }
          },
          created_by: authData.user.id,
          last_login: new Date().toISOString()
        })

      if (insertError) {
        console.error('Failed to create customer record on login:', insertError)
      }
    } else if (!customerError) {
      // Update last login
      await supabase
        .from('customers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)
    }

    return { 
      success: true, 
      user: {
        ...authData.user,
        customer: customerData
      }
    }

  } catch (error) {
    console.error('Client login error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    }
  }
}

/**
 * Get current client profile with customer data
 */
export async function getCurrentClientProfile() {
  const supabase = createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is a client
    if (user.user_metadata?.role !== 'client') {
      return { success: false, error: 'Not a client account' }
    }

    // Get customer data
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single()

    if (customerError) {
      console.error('Failed to get customer data:', customerError)
      return { success: false, error: 'Failed to load profile' }
    }

    return {
      success: true,
      user: user,
      customer: customerData
    }

  } catch (error) {
    console.error('Get client profile error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load profile' 
    }
  }
}

/**
 * Sync existing auth.users with customers table (migration utility)
 */
export async function syncAuthUsersToCustomers() {
  const supabase = createClient()

  try {
    // This would typically be run server-side with service role
    console.log('This function should be run server-side with proper permissions')
    return { success: false, error: 'Use server-side sync function' }
  } catch (error) {
    console.error('Sync error:', error)
    return { success: false, error: 'Sync failed' }
  }
}