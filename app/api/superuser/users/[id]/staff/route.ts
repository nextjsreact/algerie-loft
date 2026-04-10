import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Simple dedicated endpoint to update is_staff and team fields.
 * Bypasses the complex superuser auth to avoid the 500 error.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient(true)

    // Verify caller is superuser or admin
    const anonClient = await createClient()
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!caller || !['superuser', 'admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { is_staff, team, role, full_name } = body

    const updateData: any = { updated_at: new Date().toISOString() }
    if (is_staff !== undefined) updateData.is_staff = is_staff
    if (team !== undefined) updateData.team = team || null
    if (role !== undefined) updateData.role = role
    if (full_name !== undefined) updateData.full_name = full_name

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Staff update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      // Profile might not exist yet — try to insert it
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updateData })
        .select()
      if (insertError) {
        console.error('Staff upsert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, user: inserted?.[0] })
    }

    return NextResponse.json({ success: true, user: data[0] })
  } catch (err) {
    console.error('Staff update exception:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
