import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Fetching partner profiles...')
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[API] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API] User authenticated:', user.id)

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[API] Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    console.log('[API] User role:', profile?.role)

    if (!profile || !['admin', 'executive'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build query - fetch partner profiles first
    let query = supabase
      .from('partner_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('verification_status', status)
    }

    const { data: partnerProfiles, error } = await query

    if (error) {
      console.error('[API] Error fetching partner profiles:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch partner profiles',
        details: error.message 
      }, { status: 500 })
    }

    console.log('[API] Found partner profiles:', partnerProfiles?.length || 0)

    // Fetch user profiles separately for each partner
    const partnersWithProfiles = await Promise.all(
      (partnerProfiles || []).map(async (partner) => {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', partner.user_id)
          .single()
        
        return {
          ...partner,
          profiles: userProfile
        }
      })
    )

    return NextResponse.json({
      partners: partnersWithProfiles,
      total: partnersWithProfiles.length
    })

  } catch (error) {
    console.error('Admin partner profiles API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
