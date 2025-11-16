import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current session - only admins and executives can approve
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

    const { partnerId } = await request.json()

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update partner status to verified
    const { error } = await supabase
      .from('partner_profiles')
      .update({ 
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId)

    if (error) {
      console.error('Error approving partner:', error)
      return NextResponse.json(
        { error: 'Failed to approve partner' },
        { status: 500 }
      )
    }

    // TODO: Send email notification to partner

    return NextResponse.json({
      success: true,
      message: 'Partner approved successfully'
    })

  } catch (error) {
    console.error('Approve partner API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
