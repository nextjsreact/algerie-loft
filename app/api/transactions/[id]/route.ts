import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient(true) // service role to bypass RLS

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'manager'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE transaction]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE transaction] unexpected:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
