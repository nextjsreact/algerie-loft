import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// GET /api/admin/lofts/[id] - Get specific loft details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    const { data: loft, error } = await supabase
      .from('lofts')
      .select(`
        *,
        owner:loft_owners(name),
        partner:partners(id, business_name, verification_status),
        zone_area:zone_areas(name),
        reservations(id, check_in, check_out, status)
      `)
      .eq('id', id)
      .single()

    if (error || !loft) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Transform data for compatibility
    const transformedLoft = {
      ...loft,
      owner_name: loft.owner?.name || loft.partner?.business_name || null,
      zone_area_name: loft.zone_area?.name || null
    }

    return NextResponse.json({
      success: true,
      loft: transformedLoft
    })

  } catch (error) {
    console.error('Admin get loft API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/lofts/[id] - Update loft
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()

    // Get current loft data for audit trail
    const { data: currentLoft, error: fetchError } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentLoft) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

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

    // If partner_id is being changed, verify new partner exists and is approved
    if (partner_id && partner_id !== currentLoft.partner_id) {
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
    }

    // Update loft
    const updateData = {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(description !== undefined && { description }),
      ...(price_per_month !== undefined && { price_per_month }),
      ...(price_per_night !== undefined && { price_per_night }),
      ...(status !== undefined && { status }),
      ...(partner_id !== undefined && { partner_id, owner_id: partner_id }),
      ...(max_guests !== undefined && { max_guests }),
      ...(bedrooms !== undefined && { bedrooms }),
      ...(bathrooms !== undefined && { bathrooms }),
      ...(area_sqm !== undefined && { area_sqm }),
      ...(amenities !== undefined && { amenities }),
      ...(is_published !== undefined && { is_published }),
      ...(maintenance_notes !== undefined && { maintenance_notes }),
      ...(availability_notes !== undefined && { availability_notes }),
      updated_at: new Date().toISOString()
    }

    const { data: updatedLoft, error: updateError } = await supabase
      .from('lofts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating loft:', updateError)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .schema('audit')
      .from('audit_logs')
      .insert({
        table_name: 'lofts',
        record_id: id,
        action: 'UPDATE',
        old_values: currentLoft,
        new_values: updatedLoft,
        user_id: user.id,
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      loft: updatedLoft,
      message: 'Property updated successfully'
    })

  } catch (error) {
    console.error('Admin update loft API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/lofts/[id] - Delete loft with safeguards
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Parse deletion data from request body
    let deletionData = null
    try {
      deletionData = await request.json()
    } catch {
      // If no body provided, use default soft delete
      deletionData = {
        deletion_type: 'soft',
        reason: 'Property deleted via admin interface',
        admin_notes: '',
        confirm_text: ''
      }
    }

    const { deletion_type, reason, admin_notes, confirm_text } = deletionData

    // Get current loft data for audit trail
    const { data: currentLoft, error: fetchError } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentLoft) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Validate confirmation text if provided
    const requiredConfirmText = `DELETE ${currentLoft.name}`
    if (confirm_text && confirm_text !== requiredConfirmText) {
      return NextResponse.json({ 
        error: 'Confirmation text does not match',
        required: requiredConfirmText
      }, { status: 400 })
    }

    // Check for active reservations (always blocking)
    const { data: activeReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status, check_in, check_out')
      .eq('loft_id', id)
      .in('status', ['confirmed', 'checked_in', 'pending'])

    if (reservationError) {
      console.error('Error checking reservations:', reservationError)
      return NextResponse.json({ error: 'Failed to check reservations' }, { status: 500 })
    }

    if (activeReservations && activeReservations.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete property with active reservations',
        details: {
          activeReservations: activeReservations.length,
          reservations: activeReservations
        }
      }, { status: 400 })
    }

    // Check for future reservations (always blocking)
    const { data: futureReservations, error: futureError } = await supabase
      .from('reservations')
      .select('id, check_in, check_out')
      .eq('loft_id', id)
      .gte('check_in', new Date().toISOString())

    if (futureError) {
      console.error('Error checking future reservations:', futureError)
      return NextResponse.json({ error: 'Failed to check future reservations' }, { status: 500 })
    }

    if (futureReservations && futureReservations.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete property with future reservations',
        details: {
          futureReservations: futureReservations.length,
          reservations: futureReservations
        }
      }, { status: 400 })
    }

    let deletionResult
    const timestamp = new Date().toISOString()

    if (deletion_type === 'hard') {
      // Hard delete - permanently remove from database
      const { error: hardDeleteError } = await supabase
        .from('lofts')
        .delete()
        .eq('id', id)

      if (hardDeleteError) {
        console.error('Error hard deleting loft:', hardDeleteError)
        return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
      }

      deletionResult = {
        type: 'hard_delete',
        message: 'Property permanently deleted from database'
      }
    } else {
      // Soft delete - mark as deleted but preserve data
      const { error: softDeleteError } = await supabase
        .from('lofts')
        .update({
          status: 'maintenance',
          is_published: false,
          maintenance_notes: `Property soft-deleted by ${profile.full_name} on ${timestamp}. Reason: ${reason}${admin_notes ? `. Notes: ${admin_notes}` : ''}`,
          updated_at: timestamp
        })
        .eq('id', id)

      if (softDeleteError) {
        console.error('Error soft deleting loft:', softDeleteError)
        return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
      }

      deletionResult = {
        type: 'soft_delete',
        message: 'Property marked as deleted (data preserved)'
      }
    }

    // Create deletion history record
    await supabase
      .from('property_deletion_history')
      .insert({
        property_id: id,
        property_name: currentLoft.name,
        deletion_type,
        reason,
        admin_notes,
        performed_by: user.id,
        performed_at: timestamp,
        property_data: currentLoft
      })

    // Log audit trail
    await supabase
      .schema('audit')
      .from('audit_logs')
      .insert({
        table_name: 'lofts',
        record_id: id,
        action: 'DELETE',
        old_values: currentLoft,
        new_values: deletion_type === 'hard' ? null : { 
          ...currentLoft, 
          status: 'maintenance', 
          is_published: false 
        },
        user_id: user.id,
        timestamp,
        notes: `${deletion_type} deletion. Reason: ${reason}`
      })

    return NextResponse.json({
      success: true,
      message: `Property deleted successfully (${deletion_type} delete)`,
      details: {
        ...deletionResult,
        reason,
        admin_notes,
        performed_by: profile.full_name,
        performed_at: timestamp
      }
    })

  } catch (error) {
    console.error('Admin delete loft API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}