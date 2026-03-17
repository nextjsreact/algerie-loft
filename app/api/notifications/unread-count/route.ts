import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = await createClient(true)

    const { count, error } = await serviceSupabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error counting notifications:', error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error: any) {
    console.error('API Error fetching notification count:', error)
    return NextResponse.json({ count: 0 })
  }
}
