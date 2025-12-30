import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// GET /api/admin/property-assignments/history - Get assignment history
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
    const propertyId = searchParams.get('property_id')
    const partnerId = searchParams.get('partner_id')
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query for assignment history
    let query = supabase
      .from('property_assignment_history')
      .select(`
        *,
        from_partner:partners!property_assignment_history_from_partner_id_fkey(
          id,
          business_name
        ),
        to_partner:partners!property_assignment_history_to_partner_id_fkey(
          id,
          business_name
        ),
        performed_by_user:profiles!property_assignment_history_performed_by_fkey(
          id,
          full_name,
          email
        )
      `)
      .order('performed_at', { ascending: false })

    // Apply filters
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (partnerId) {
      query = query.or(`from_partner_id.eq.${partnerId},to_partner_id.eq.${partnerId}`)
    }

    if (action) {
      query = query.eq('action', action)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: history, error, count } = await query

    if (error) {
      console.error('Error fetching assignment history:', error)
      return NextResponse.json({ error: 'Failed to fetch assignment history' }, { status: 500 })
    }

    // Transform data to include partner names
    const transformedHistory = history?.map(entry => ({
      ...entry,
      from_partner_name: entry.from_partner?.business_name || null,
      to_partner_name: entry.to_partner?.business_name || null,
      performed_by_name: entry.performed_by_user?.full_name || 'Unknown'
    })) || []

    return NextResponse.json({
      history: transformedHistory,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Assignment history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/property-assignments/history - Create manual history entry
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
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      property_id,
      property_name,
      from_partner_id,
      to_partner_id,
      action,
      notes
    } = body

    // Validate required fields
    if (!property_id || !property_name || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: property_id, property_name, action' 
      }, { status: 400 })
    }

    if (!['assign', 'transfer', 'unassign'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be assign, transfer, or unassign' 
      }, { status: 400 })
    }

    // Verify property exists
    const { data: property, error: propertyError } = await supabase
      .from('lofts')
      .select('id, name')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Create history entry
    const { data: historyEntry, error: createError } = await supabase
      .from('property_assignment_history')
      .insert({
        property_id,
        property_name: property_name || property.name,
        from_partner_id,
        to_partner_id,
        action,
        performed_by: user.id,
        performed_at: new Date().toISOString(),
        notes: notes || `Manual ${action} entry created by ${profile.full_name}`
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating history entry:', createError)
      return NextResponse.json({ error: 'Failed to create history entry' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      history_entry: historyEntry,
      message: 'History entry created successfully'
    })

  } catch (error) {
    console.error('Create assignment history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}