import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient(true) // service role

    const [firstName, ...rest] = (fullName || email.split('@')[0]).split(' ')
    const lastName = rest.join(' ') || firstName

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

    if (error && error.code !== '23505') { // ignore duplicate key
      console.error('Failed to create customer record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('register-client error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
