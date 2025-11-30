import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// POST /api/admin/property-assignments/transfer - Transfer properties between partners
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
    const { property_ids, from_partner_id, to_partner_id, notes } = body

    // Validate required fields
    if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
      return NextResponse.json({ 
        error: 'property_ids is required and must be a non-empty array' 
      }, { status: 400 })
    }

    if (!from_partner_id || !to_partner_id) {
      return NextResponse.json({ 
        error: 'Both from_partner_id and to_partner_id are required' 
      }, { status: 400 })
    }

    if (from_partner_id === to_partner_id) {
      return NextResponse.json({ 
        error: 'Source and destination partners must be different' 
      }, { status: 400 })
    }

    // Verify both partners exist and are approved
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, verification_status, business_name')
      .in('id', [from_partner_id, to_partner_id])

    if (partnersError || !partners || partners.length !== 2) {
      return NextResponse.json({ error: 'One or both partners not found' }, { status: 400 })
    }

    const fromPartner = partners.find(p => p.id === from_partner_id)
    const toPartner = partners.find(p => p.id === to_partner_id)

    if (!fromPartner || !toPartner) {
      return NextResponse.json({ error: 'Partner data inconsistency' }, { status: 400 })
    }

    if (fromPartner.verification_status !== 'approved' || toPartner.verification_status !== 'approved') {
      return NextResponse.json({ 
        error: 'Both partners must be approved for property transfers' 
      }, { status: 400 })
    }

    // Get current property data and verify ownership
    const { data: currentProperties, error: fetchError } = await supabase
      .from('lofts')
      .select('id, name, partner_id, status')
      .in('id', property_ids)

    if (fetchError) {
      console.error('Error fetching current properties:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    if (!currentProperties || currentProperties.length === 0) {
      return NextResponse.json({ error: 'No properties found' }, { status: 404 })
    }

    // Verify all properties belong to the source partner
    const invalidProperties = currentProperties.filter(p => p.partner_id !== from_partner_id)
    if (invalidProperties.length > 0) {
      return NextResponse.json({ 
        error: 'Some properties do not belong to the source partner',
        details: {
          invalid_properties: invalidProperties.map(p => ({ id: p.id, name: p.name }))
        }
      }, { status: 400 })
    }

    // Check for active reservations that might prevent transfer
    const { data: activeReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id, loft_id, status, check_in, check_out')
      .in('loft_id', property_ids)
      .in('status', ['confirmed', 'checked_in', 'pending'])

    if (reservationError) {
      console.error('Error checking reservations:', reservationError)
      return NextResponse.json({ error: 'Failed to check reservations' }, { status: 500 })
    }

    // Warn about active reservations but don't block the transfer
    let transferWarnings = []
    if (activeReservations && activeReservations.length > 0) {
      transferWarnings.push(`${activeReservations.length} properties have active reservations`)
    }

    // Perform the transfer
    const { data: updatedProperties, error: updateError } = await supabase
      .from('lofts')
      .update({
        partner_id: to_partner_id,
        owner_id: to_partner_id, // For compatibility
        updated_at: new Date().toISOString()
      })
      .in('id', property_ids)
      .select('id, name, partner_id')

    if (updateError) {
      console.error('Error transferring properties:', updateError)
      return NextResponse.json({ error: 'Failed to transfer properties' }, { status: 500 })
    }

    // Create transfer history records
    const historyRecords = currentProperties.map(property => ({
      property_id: property.id,
      property_name: property.name,
      from_partner_id: from_partner_id,
      to_partner_id: to_partner_id,
      action: 'transfer',
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      notes: notes || `Property transfer from ${fromPartner.business_name} to ${toPartner.business_name} by ${profile.full_name}`
    }))

    // Insert history records
    const { error: historyError } = await supabase
      .from('property_assignment_history')
      .insert(historyRecords)

    if (historyError) {
      console.warn('Failed to create transfer history:', historyError)
      // Don't fail the operation if history logging fails
    }

    // Log audit trail for each property
    for (const property of currentProperties) {
      await supabase
        .schema('audit')
        .from('audit_logs')
        .insert({
          table_name: 'lofts',
          record_id: property.id,
          action: 'UPDATE',
          old_values: property,
          new_values: { ...property, partner_id: to_partner_id, owner_id: to_partner_id },
          user_id: user.id,
          timestamp: new Date().toISOString()
        })
    }

    // Send notifications to both partners (if notification system exists)
    try {
      // Notify source partner
      await supabase
        .from('notifications')
        .insert({
          user_id: fromPartner.id,
          title: 'Properties Transferred',
          message: `${property_ids.length} properties have been transferred to ${toPartner.business_name}`,
          type: 'property_transfer',
          created_at: new Date().toISOString()
        })

      // Notify destination partner
      await supabase
        .from('notifications')
        .insert({
          user_id: toPartner.id,
          title: 'Properties Received',
          message: `${property_ids.length} properties have been transferred from ${fromPartner.business_name}`,
          type: 'property_transfer',
          created_at: new Date().toISOString()
        })
    } catch (notificationError) {
      console.warn('Failed to send transfer notifications:', notificationError)
      // Don't fail the operation if notifications fail
    }

    return NextResponse.json({
      success: true,
      transferred_count: updatedProperties?.length || 0,
      properties: updatedProperties,
      from_partner: {
        id: fromPartner.id,
        name: fromPartner.business_name
      },
      to_partner: {
        id: toPartner.id,
        name: toPartner.business_name
      },
      warnings: transferWarnings,
      active_reservations: activeReservations?.length || 0,
      message: `Successfully transferred ${updatedProperties?.length || 0} properties from ${fromPartner.business_name} to ${toPartner.business_name}`
    })

  } catch (error) {
    console.error('Property transfer API error:', error)
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