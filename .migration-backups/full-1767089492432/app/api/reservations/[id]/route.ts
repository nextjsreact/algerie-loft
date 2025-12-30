import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Get reservation details by ID
 * Requirements: 5.4, 5.5, 10.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = id;

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get reservation with related data
    const { data: reservation, error: reservationError } = await (await supabase)
      .from('reservations')
      .select(`
        *,
        loft:lofts(
          id,
          name,
          address,
          description,
          price_per_night,
          max_guests,
          amenities,
          photos:loft_photos(
            id,
            url,
            alt_text,
            order_index
          )
        ),
        customer:customers(
          id,
          full_name,
          email,
          phone,
          nationality,
          date_of_birth,
          preferences
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError) {
      if (reservationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching reservation:', reservationError);
      return NextResponse.json(
        { error: 'Failed to fetch reservation' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedReservation = {
      id: reservation.id,
      userId: reservation.customer_id,
      loftId: reservation.loft_id,
      checkIn: reservation.check_in_date,
      checkOut: reservation.check_out_date,
      guests: reservation.guest_info?.total_guests || 1,
      guestInfo: {
        primaryGuest: {
          firstName: reservation.guest_info?.primary_guest?.first_name || '',
          lastName: reservation.guest_info?.primary_guest?.last_name || '',
          email: reservation.guest_info?.primary_guest?.email || '',
          phone: reservation.guest_info?.primary_guest?.phone || '',
          nationality: reservation.guest_info?.primary_guest?.nationality || '',
          dateOfBirth: reservation.guest_info?.primary_guest?.date_of_birth || '',
          idNumber: reservation.guest_info?.primary_guest?.id_number || '',
          emergencyContact: reservation.guest_info?.primary_guest?.emergency_contact || {}
        },
        additionalGuests: reservation.guest_info?.additional_guests || []
      },
      pricing: {
        nightlyRate: reservation.pricing?.nightly_rate || 0,
        nights: reservation.nights || 1,
        subtotal: reservation.pricing?.base_price || 0,
        cleaningFee: reservation.pricing?.cleaning_fee || 0,
        serviceFee: reservation.pricing?.service_fee || 0,
        taxes: reservation.pricing?.taxes || 0,
        total: reservation.pricing?.total_amount || 0,
        currency: reservation.pricing?.currency || 'EUR'
      },
      preferences: {
        arrivalTime: reservation.preferences?.arrival_time || '',
        specialRequests: reservation.special_requests || '',
        accessibilityNeeds: reservation.accessibility_needs || '',
        dietaryRestrictions: reservation.dietary_requirements || ''
      },
      status: reservation.status,
      paymentStatus: reservation.payment_status,
      bookingReference: reservation.booking_reference,
      confirmationCode: reservation.confirmation_code,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at,
      termsAccepted: reservation.terms_accepted,
      termsAcceptedAt: reservation.terms_accepted_at,
      termsVersion: reservation.terms_version
    };

    // Transform loft data
    const transformedLoft = reservation.loft ? {
      id: reservation.loft.id,
      name: reservation.loft.name,
      address: reservation.loft.address,
      description: reservation.loft.description,
      pricePerNight: reservation.loft.price_per_night,
      maxGuests: reservation.loft.max_guests,
      amenities: reservation.loft.amenities || [],
      photos: reservation.loft.photos?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    } : null;

    // Transform customer data
    const transformedCustomer = reservation.customer ? {
      id: reservation.customer.id,
      fullName: reservation.customer.full_name,
      email: reservation.customer.email,
      phone: reservation.customer.phone,
      nationality: reservation.customer.nationality,
      dateOfBirth: reservation.customer.date_of_birth,
      preferences: reservation.customer.preferences
    } : null;

    return NextResponse.json({
      success: true,
      reservation: transformedReservation,
      loft: transformedLoft,
      customer: transformedCustomer
    });

  } catch (error) {
    console.error('Error in GET /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update reservation details
 * Requirements: 5.4, 10.1, 10.2
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = id;
    const updates = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current reservation for audit trail
    const { data: currentReservation, error: fetchError } = await (await supabase)
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !currentReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Map the updates to database fields
    if (updates.status) updateData.status = updates.status;
    if (updates.paymentStatus) updateData.payment_status = updates.paymentStatus;
    if (updates.specialRequests) updateData.special_requests = updates.specialRequests;
    if (updates.accessibilityNeeds) updateData.accessibility_needs = updates.accessibilityNeeds;
    if (updates.dietaryRequirements) updateData.dietary_requirements = updates.dietaryRequirements;
    if (updates.cancellationReason) updateData.cancellation_reason = updates.cancellationReason;
    if (updates.updatedBy) updateData.updated_by = updates.updatedBy;

    // Handle status-specific updates
    if (updates.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = updates.updatedBy || updates.cancelledBy;
    }

    // Update the reservation
    const { data: updatedReservation, error: updateError } = await (await supabase)
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      );
    }

    // Log the update for audit trail
    await (await supabase)
      .from('reservation_audit_log')
      .insert({
        reservation_id: reservationId,
        action: 'updated',
        old_values: currentReservation,
        new_values: updatedReservation,
        changed_fields: Object.keys(updates),
        user_id: updates.updatedBy,
        user_type: 'customer',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        notes: `Reservation updated: ${Object.keys(updates).join(', ')}`
      });

    return NextResponse.json({
      success: true,
      reservation: updatedReservation
    });

  } catch (error) {
    console.error('Error in PUT /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Cancel reservation
 * Requirements: 5.4, 10.1, 10.2
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = id;
    const { cancellationReason, userId } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current reservation
    const { data: reservation, error: fetchError } = await (await supabase)
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if reservation can be cancelled
    if (reservation.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Reservation is already cancelled' },
        { status: 400 }
      );
    }

    if (reservation.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed reservation' },
        { status: 400 }
      );
    }

    // Update reservation to cancelled status
    const { data: cancelledReservation, error: updateError } = await (await supabase)
      .from('reservations')
      .update({
        status: 'cancelled',
        payment_status: 'refunded', // Assuming automatic refund processing
        cancellation_reason: cancellationReason || 'Cancelled by customer',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling reservation:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel reservation' },
        { status: 500 }
      );
    }

    // Log the cancellation for audit trail
    await (await supabase)
      .from('reservation_audit_log')
      .insert({
        reservation_id: reservationId,
        action: 'cancelled',
        old_values: reservation,
        new_values: cancelledReservation,
        changed_fields: ['status', 'payment_status', 'cancellation_reason', 'cancelled_at', 'cancelled_by'],
        user_id: userId,
        user_type: 'customer',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        notes: `Reservation cancelled: ${cancellationReason || 'No reason provided'}`
      });

    // TODO: Send cancellation email notification
    // This would integrate with the email notification service

    return NextResponse.json({
      success: true,
      reservation: cancelledReservation,
      message: 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}