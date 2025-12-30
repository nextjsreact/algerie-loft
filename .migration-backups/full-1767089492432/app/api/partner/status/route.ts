import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get partner profile
    const { data: partnerProfile, error } = await supabase
      .from('partner_profiles')
      .select('id, business_name, verification_status, created_at')
      .eq('user_id', session.user.id)
      .single()

    if (error || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found', hasProfile: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hasProfile: true,
      verification_status: partnerProfile.verification_status,
      business_name: partnerProfile.business_name,
      created_at: partnerProfile.created_at
    })

  } catch (error) {
    console.error('Partner status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
