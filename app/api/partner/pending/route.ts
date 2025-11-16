import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    // Get all pending partner profiles with user information
    const { data: partners, error } = await supabase
      .from('partner_profiles')
      .select(`
        id,
        user_id,
        business_name,
        business_type,
        phone,
        address,
        portfolio_description,
        verification_status,
        created_at,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending partners:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending partners' },
        { status: 500 }
      )
    }

    // Transform data to match the expected format
    const transformedPartners = partners?.map(partner => ({
      id: partner.id,
      user_id: partner.user_id,
      full_name: partner.profiles?.full_name || 'N/A',
      email: partner.profiles?.email || 'N/A',
      business_name: partner.business_name,
      business_type: partner.business_type,
      phone: partner.phone,
      address: partner.address,
      portfolio_description: partner.portfolio_description,
      verification_status: partner.verification_status,
      created_at: partner.created_at
    })) || []

    return NextResponse.json({
      partners: transformedPartners,
      count: transformedPartners.length
    })

  } catch (error) {
    console.error('Pending partners API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
