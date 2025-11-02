import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // 2. Check if user has client role
    const userRole = authData.user.user_metadata?.role
    if (userRole !== 'client') {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied. Client account required.' },
        { status: 403 }
      )
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

      const { data: newCustomer, error: insertError } = await supabase
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
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create customer record on login:', insertError)
        return NextResponse.json(
          { error: 'Failed to create customer profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        customer: newCustomer,
        message: 'Login successful, customer profile created'
      })

    } else if (!customerError) {
      // Update last login
      const { error: updateError } = await supabase
        .from('customers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('Failed to update last login:', updateError)
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        customer: customerData,
        message: 'Login successful'
      })

    } else {
      console.error('Failed to get customer data:', customerError)
      return NextResponse.json(
        { error: 'Failed to load customer profile' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Client login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}