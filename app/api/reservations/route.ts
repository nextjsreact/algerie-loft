import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loftId = searchParams.get('loft_id')
    const status = searchParams.get('status')

    const supabase = await createClient(true) // service role — no auth needed

    let query = supabase
      .from('reservations')
      .select('*, lofts:loft_id(id, name, address)')
      .order('created_at', { ascending: false })

    if (loftId) query = query.eq('loft_id', loftId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      console.error('[API reservations GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reservations: data || [] })
  } catch (error) {
    console.error('[API reservations GET] unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
