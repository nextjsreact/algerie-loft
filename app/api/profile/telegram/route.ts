import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const anonSupabase = await createClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { telegram_chat_id } = await request.json()

    const supabase = await createClient(true)
    const { error } = await supabase
      .from('profiles')
      .update({ telegram_chat_id: telegram_chat_id || null })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
