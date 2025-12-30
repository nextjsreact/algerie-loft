import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { emailNotificationService } from '@/lib/services/email-notification-service';

/**
 * Send reservation confirmation email
 * Requirements: 5.5, 10.1
 */
export async function POST(request: NextRequest) {
  try {
    const { reservationId, email } = await request.json();

    if (!reservationId || !email) {
      return NextResponse.json(
        { error: 'Reservation ID and email are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get reservation details with related data
    const { data: reservation, error: reservationError } = await (await supabase)
      .from('reservations')
      .select(`
        *,
        loft:lofts(
          id,
          name,
          address,
          price_per_night
        ),
        customer:customers(
          id,
          full_name,
          email
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      console.error('Reservation not found:', reservationError);
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Validate that the email matches the reservation
    if (reservation.customer?.email !== email && 
        reservation.guest_info?.primary_guest?.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match reservation' },
        { status: 403 }
      );
    }

    // Calculate nights
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare email variables
    const emailVariables = {
      customer_name: reservation.guest_info?.primary_guest?.first_name || 
                    reservation.customer?.full_name || 
                    'Valued Guest',
      loft_name: reservation.loft?.name || 'Your Loft',
      loft_address: reservation.loft?.address || '',
      check_in_date: checkIn.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      check_out_date: checkOut.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      nights: nights.toString(),
      guest_count: reservation.guest_info?.total_guests?.toString() || '1',
      total_amount: reservation.pricing?.total_amount?.toFixed(2) || '0.00',
      currency: reservation.pricing?.currency || 'EUR',
      booking_reference: reservation.booking_reference,
      confirmation_code: reservation.confirmation_code,
      check_in_time: '15:00',
      check_out_time: '11:00',
      support_email: 'support@loftalgerie.com',
      support_phone: '+213 XXX XXX XXX',
      reservation_url: `${process.env.NEXT_PUBLIC_APP_URL}/reservations/${reservationId}`,
      special_requests: reservation.special_requests || 'None',
      dietary_requirements: reservation.dietary_requirements || 'None',
      accessibility_needs: reservation.accessibility_needs || 'None'
    };

    // Send confirmation email
    const emailSent = await emailNotificationService.sendEmailNotification({
      to: email,
      template_key: 'reservation_confirmation',
      user_id: reservation.customer_id,
      booking_id: reservationId,
      variables: emailVariables
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      );
    }

    // Log the email sending activity for audit trail
    await (await supabase)
      .from('reservation_audit_log')
      .insert({
        reservation_id: reservationId,
        action: 'confirmation_email_sent',
        user_id: reservation.customer_id,
        user_type: 'customer',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        notes: `Confirmation email sent to ${email}`
      });

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Resend confirmation email for existing reservation
 * Requirements: 5.5, 10.1
 */
export async function PUT(request: NextRequest) {
  try {
    const { reservationId, newEmail } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get reservation details
    const { data: reservation, error: reservationError } = await (await supabase)
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Use provided email or fallback to reservation email
    const emailToSend = newEmail || 
                       reservation.guest_info?.primary_guest?.email ||
                       reservation.customer?.email;

    if (!emailToSend) {
      return NextResponse.json(
        { error: 'No email address available for this reservation' },
        { status: 400 }
      );
    }

    // If new email is provided, update the reservation
    if (newEmail && newEmail !== reservation.guest_info?.primary_guest?.email) {
      const updatedGuestInfo = {
        ...reservation.guest_info,
        primary_guest: {
          ...reservation.guest_info?.primary_guest,
          email: newEmail
        }
      };

      await (await supabase)
        .from('reservations')
        .update({
          guest_info: updatedGuestInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);
    }

    // Send the confirmation email using the POST logic
    const postResponse = await POST(
      new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({
          reservationId,
          email: emailToSend
        })
      })
    );

    return postResponse;

  } catch (error) {
    console.error('Error resending confirmation email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}