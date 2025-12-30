import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireRoleAPI } from '@/lib/auth'
import type { ValidationRequestsResponse } from '@/types/partner'

// GET /api/admin/partners/validation-requests - Get partner validation requests
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await requireRoleAPI(['admin'])
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Build query based on status
    let query = supabase
      .from('partner_validation_requests')
      .select(`
        id,
        partner_id,
        status,
        submitted_data,
        admin_notes,
        processed_by,
        processed_at,
        created_at,
        partner:partners!partner_validation_requests_partner_id_fkey (
          id,
          user_id,
          business_name,
          business_type,
          verification_status,
          created_at
        ),
        processed_by_user:profiles!partner_validation_requests_processed_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('partner_validation_requests')
      .select('*', { count: 'exact', head: true })
      .eq(status !== 'all' ? 'status' : 'id', status !== 'all' ? status : undefined)

    if (countError) {
      console.error('Error getting validation requests count:', countError)
    }

    // Get paginated results
    const { data: requests, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching validation requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch validation requests' },
        { status: 500 }
      )
    }

    const response: ValidationRequestsResponse = {
      requests: requests || [],
      total: count || 0,
      page,
      limit
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in validation requests API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}