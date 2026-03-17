import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const anonSupabase = await createClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabase = await createClient(true)

    // Try with read_at first, fall back without it if column doesn't exist
    let error: any = null

    const result1 = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    error = result1.error

    // If read_at column doesn't exist, retry without it
    if (error && (error.message?.includes('read_at') || error.code === '42703')) {
      const result2 = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      error = result2.error
    }

    if (error) {
      console.error('[mark-all-read] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[mark-all-read] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
