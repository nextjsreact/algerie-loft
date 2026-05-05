import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName, consent } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient(true)

    const [firstName, ...rest] = (fullName || email.split('@')[0]).split(' ')
    const lastName = rest.join(' ') || firstName

    // Create customer record
    const { error } = await supabase
      .from('customers')
      .insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        status: 'prospect',
      })
      .select()
      .single()

    if (error && error.code !== '23505') {
      console.error('Failed to create customer record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Save consent to profiles table
    if (consent) {
      await supabase
        .from('profiles')
        .update({
          accepted_cgu: consent.accepted_cgu || false,
          accepted_cgu_at: consent.accepted_cgu ? new Date().toISOString() : null,
          accepted_data_transfer: consent.accepted_data_transfer || false,
          marketing_consent: consent.marketing_consent || false,
        })
        .eq('id', userId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('register-client error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
