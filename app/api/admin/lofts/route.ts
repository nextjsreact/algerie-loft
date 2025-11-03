import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PartnerSystemIntegration } from '@/lib/integration/partner-system-integration'

// GET /api/admin/lofts - List all lofts with filtering
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
    const partnerId = searchParams.get('partner_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('lofts')
      .select(`
        *,
        owner:loft_owners(name),
        partner:partners(id, business_name, verification_status),
        zone_area:zone_areas(name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: lofts, error, count } = await query

    if (error) {
      console.error('Error fetching lofts:', error)
      return NextResponse.json({ error: 'Failed to fetch lofts' }, { status: 500 })
    }

    // Transform data to include owner_name for compatibility
    const transformedLofts = lofts?.map(loft => ({
      ...loft,
      owner_name: loft.owner?.name || loft.partner?.business_name || null,
      zone_area_name: loft.zone_area?.name || null
    })) || []

    return NextResponse.json({
      lofts: transformedLofts,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Admin lofts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/lofts - Create new loft
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      name,
      address,
      description,
      price_per_month,
      price_per_night,
      status,
      partner_id,
      max_guests,
      bedrooms,
      bathrooms,
      area_sqm,
      amenities,
      is_published,
      maintenance_notes,
      availability_notes
    } = body

    // Validate required fields
    if (!name || !address || !partner_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, address, partner_id' 
      }, { status: 400 })
    }

    // Verify partner exists and is approved
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, verification_status')
      .eq('id', partner_id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 400 })
    }

    if (partner.verification_status !== 'approved') {
      return NextResponse.json({ 
        error: 'Partner must be approved before assigning properties' 
      }, { status: 400 })
    }

    // Create loft with partner system integration
    const { data: loft, error: createError } = await supabase
      .from('lofts')
      .insert({
        name,
        address,
        description,
        price_per_month: price_per_month || null,
        price_per_night: price_per_night || null,
        status: status || 'available',
        partner_id,
        owner_id: partner_id, // For compatibility with existing schema
        company_percentage: 30, // Default company percentage
        owner_percentage: 70,   // Default owner percentage
        max_guests: max_guests || 1,
        bedrooms: bedrooms || 1,
        bathrooms: bathrooms || 1,
        area_sqm: area_sqm || null,
        amenities: amenities || [],
        is_published: is_published || false,
        maintenance_notes,
        availability_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating loft:', createError)
      return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
    }

    // Integrate with partner system
    const integrationResult = await PartnerSystemIntegration.integratePartnerWithLoftManagement(
      partner_id,
      [loft.id]
    )

    if (!integrationResult.success) {
      console.warn('Partner system integration warnings:', integrationResult.errors)
      // Don't fail the creation, just log warnings
    }

    // Log audit trail
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'lofts',
        record_id: loft.id,
        action: 'INSERT',
        old_values: null,
        new_values: loft,
        user_id: user.id,
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      loft,
      message: 'Property created successfully'
    })

  } catch (error) {
    console.error('Admin create loft API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}