import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Automatically mark confirmed reservations as completed when checkout date has passed
export async function POST() {
  try {
    const supabase = await createClient(true)
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'completed' })
      .in('status', ['confirmed', 'pending'])
      .lt('check_out_date', today)
      .select('id, guest_name, check_out_date')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, completed: data?.length || 0, reservations: data })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
