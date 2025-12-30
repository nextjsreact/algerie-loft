import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    // Get current session - only admins and executives can access
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or executive
    if (!['admin', 'executive'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Executive access required' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get today's date at midnight (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Count approved partners today
    const { count: approvedCount, error: approvedError } = await supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .gte('updated_at', todayISO)

    if (approvedError) {
      console.error('Error counting approved partners:', approvedError)
    }

    // Count rejected partners today
    const { count: rejectedCount, error: rejectedError } = await supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'rejected')
      .gte('updated_at', todayISO)

    if (rejectedError) {
      console.error('Error counting rejected partners:', rejectedError)
    }

    return NextResponse.json({
      approved: approvedCount || 0,
      rejected: rejectedCount || 0
    })

  } catch (error) {
    console.error('Today stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
