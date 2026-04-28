import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Use raw supabase-js client with service role — bypasses RLS completely
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const body = await request.json()
    const { is_staff, team, role, full_name, preferred_zone_id, telegram_chat_id, can_validate_reservations } = body

    const updateData: any = {}
    if (is_staff !== undefined) updateData.is_staff = is_staff
    if (team !== undefined) updateData.team = team || null
    if (role !== undefined) updateData.role = role
    if (full_name !== undefined) updateData.full_name = full_name
    if (preferred_zone_id !== undefined) updateData.preferred_zone_id = preferred_zone_id || null
    if (telegram_chat_id !== undefined) updateData.telegram_chat_id = telegram_chat_id || null
    if (can_validate_reservations !== undefined) updateData.can_validate_reservations = can_validate_reservations
    if (body.can_view_reports !== undefined) updateData.can_view_reports = body.can_view_reports

    console.log('[staff PATCH] userId:', userId, 'data:', updateData)

    const { data, error, count } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()

    console.log('[staff PATCH] result:', { data, error, count })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: data })
  } catch (err) {
    console.error('[staff PATCH] exception:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
