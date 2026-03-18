import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { detectUserRole } from '@/lib/auth/role-detection'

export async function GET() {
  const supabase = await createClient(true)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const [{ data: profile }, { data: customer }, { data: partner }] = await Promise.all([
    supabase.from('profiles').select('role, full_name').eq('id', user.id).single(),
    supabase.from('customers').select('id, email').eq('id', user.id).single(),
    supabase.from('partner_profiles').select('id').eq('user_id', user.id).single(),
  ])

  const detectedRole = await detectUserRole(user.id, user.email ?? null)

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    inProfilesTable: profile ? { role: profile.role, name: profile.full_name } : null,
    inCustomersTable: !!customer,
    inPartnerProfilesTable: !!partner,
    detectedRole,
  })
}
