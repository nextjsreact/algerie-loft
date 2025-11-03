import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// POST /api/admin/property-assignments/bulk - Bulk assign or unassign properties
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
    const { operation, property_ids, partner_id } = body

    if (!operation || !property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: operation, property_ids' 
      }, { status: 400 })
    }

    if (operation === 'assign' && !partner_id) {
      return NextResponse.json({ 
        error: 'partner_id is required for assign operation' 
      }, { status: 400 })
    }

    // Verify partner exists and is approved (for assign operation)
    if (operation === 'assign') {
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, verification_status, business_name')
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
    }

    // Get current property data for audit trail
    const { data: currentProperties, error: fetchError } = await supabase
      .from('lofts')
      .select('id, name, partner_id, owner_id')
      .in('id', property_ids)

    if (fetchError) {
      console.error('Error fetching current properties:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    if (!currentProperties || currentProperties.length === 0) {
      return NextResponse.json({ error: 'No properties found' }, { status: 404 })
    }

    // Prepare update data based on operation
    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (operation === 'assign') {
      updateData.partner_id = partner_id
      updateData.owner_id = partner_id // For compatibility
    } else if (operation === 'unassign') {
      updateData.partner_id = null
      updateData.owner_id = null
    }

    // Perform bulk update
    const { data: updatedProperties, error: updateError } = await supabase
      .from('lofts')
      .update(updateData)
      .in('id', property_ids)
      .select('id, name, partner_id')

    if (updateError) {
      console.error('Error updating properties:', updateError)
      return NextResponse.json({ error: 'Failed to update properties' }, { status: 500 })
    }

    // Create assignment history records
    const historyRecords = currentProperties.map(property => ({
      property_id: property.id,
      property_name: property.name,
      from_partner_id: operation === 'assign' ? null : property.partner_id,
      to_partner_id: operation === 'assign' ? partner_id : null,
      action: operation,
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      notes: `Bulk ${operation} operation performed by ${profile.full_name}`
    }))

    // Insert history records (assuming we have a property_assignment_history table)
    const { error: historyError } = await supabase
      .from('property_assignment_history')
      .insert(historyRecords)

    if (historyError) {
      console.warn('Failed to create assignment history:', historyError)
      // Don't fail the operation if history logging fails
    }

    // Log audit trail for each property
    for (const property of currentProperties) {
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'lofts',
          record_id: property.id,
          action: 'UPDATE',
          old_values: property,
          new_values: { ...property, ...updateData },
          user_id: user.id,
          timestamp: new Date().toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      operation,
      updated_count: updatedProperties?.length || 0,
      properties: updatedProperties,
      message: `Successfully ${operation === 'assign' ? 'assigned' : 'unassigned'} ${updatedProperties?.length || 0} properties`
    })

  } catch (error) {
    console.error('Bulk property assignment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}