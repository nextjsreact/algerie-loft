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

    // Get all pending partner profiles
    const { data: partnerProfiles, error: profilesError } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching partner profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch partner profiles' },
        { status: 500 }
      )
    }

    // Get user information for each partner
    const userIds = partnerProfiles?.map(p => p.user_id) || []
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching user profiles:', usersError)
    }

    // Combine the data
    const partners = partnerProfiles?.map(partner => {
      const user = users?.find(u => u.id === partner.user_id)
      return {
        ...partner,
        full_name: user?.full_name || 'N/A',
        email: user?.email || 'N/A'
      }
    }) || []

    return NextResponse.json({
      partners: partners,
      count: partners.length
    })

  } catch (error) {
    console.error('Pending partners API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
