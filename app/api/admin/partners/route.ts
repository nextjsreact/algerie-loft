import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// GET /api/admin/partners - List partners with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('partners')
      .select(`
        *,
        user:profiles!partners_user_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status !== 'all') {
      query = query.eq('verification_status', status)
    }

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: partners, error, count } = await query

    if (error) {
      console.error('Error fetching partners:', error)
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
    }

    // Transform data to include computed fields
    const transformedPartners = partners?.map(partner => ({
      ...partner,
      properties_count: 0, // This would need a separate query to count properties
      total_revenue: 0,    // This would need calculation from reservations
      active_reservations_count: 0 // This would need a separate query
    })) || []

    return NextResponse.json({
      partners: transformedPartners,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Admin partners API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}