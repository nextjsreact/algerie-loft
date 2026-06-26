import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = await createClient(true)

    const { data: existing, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)

    if (findError) return NextResponse.json({ error: 'find: ' + findError.message }, { status: 500 })
    if (!existing || existing.length === 0) return NextResponse.json({ error: 'user not found in profiles' }, { status: 404 })

    const { data, error } = await supabase
      .from('profiles')
      .update({ force_logout_at: new Date().toISOString() })
      .eq('id', userId)
      .select()

    if (error) return NextResponse.json({ error: 'update: ' + error.message }, { status: 500 })

    return NextResponse.json({ ok: true, updated: data?.length || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
