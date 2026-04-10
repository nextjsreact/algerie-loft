import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient(true)

    const body = await request.json()
    const { is_staff, team, role, full_name } = body

    const updateData: any = {}
    if (is_staff !== undefined) updateData.is_staff = is_staff
    if (team !== undefined) updateData.team = team || null
    if (role !== undefined) updateData.role = role
    if (full_name !== undefined) updateData.full_name = full_name

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('[staff PATCH] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[staff PATCH] exception:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
