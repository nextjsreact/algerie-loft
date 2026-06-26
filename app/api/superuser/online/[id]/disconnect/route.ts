import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('superuser_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ force_logout_at: now })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[disconnect]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
