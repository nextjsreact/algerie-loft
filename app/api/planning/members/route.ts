import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient(true)
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'member')
      .eq('is_staff', true)
      .order('full_name')

    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(members || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
