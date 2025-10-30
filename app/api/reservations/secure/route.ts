/**
 * Secure reservations endpoint demonstrating security middleware for booking operations
 * This endpoint showcases security features for reservation/booking functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurity, SecurityPresets } from '@/lib/security/security-middleware';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/services/audit';

// Validation schema for reservation creation
const createReservationSchema = z.object({
  loft_id: z.string().uuid('Invalid loft ID'),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-in date format'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-out date format'),
  guest_count: z.number().int().min(1, 'At least 1 guest required').max(20, 'Too many guests'),
  guest_email: z.string().email('Invalid guest email'),
  guest_name: z.string().min(2, 'Guest name too short').max(100, 'Guest name too long'),
  guest_phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number'),
  special_requests: z.string().max(1000, 'Special requests too long').optional(),
  total_amount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3, 'Invalid currency code').default('EUR'),
  payment_method: z.enum(['card', 'bank_transfer', 'paypal']).optional(),
  terms_accepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
});

// Validation schema for reservation search/listing
const searchReservationsSchema = z.object({
  loft_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  guest_email: z.string().email().optional(),
  check_in_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_in_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

type CreateReservationRequest = z.infer<typeof createReservationSchema>;
type SearchReservationsRequest = z.infer<typeof searchReservationsSchema>;

/**
 * GET - Search and list reservations with security
 */
async function getReservationsHandler(request: NextRequest, context: any): Promise<NextResponse> {
  const { clientIp, userAgent, requestId } = context;

  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate search parameters
    const searchData: SearchReservationsRequest = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20
    };

    const validation = searchReservationsSchema.safeParse(searchData);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid search parameters',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Build query with security considerations
    let query = supabase
      .from('reservations')
      .select(`
        *,
        lofts:loft_id (
          id,
          name,
          address,
          price_per_night
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (validatedData.loft_id) query = query.eq('loft_id', validatedData.loft_id);
    if (validatedData.status) query = query.eq('status', validatedData.status);
    if (validatedData.guest_email) query = query.eq('guest_email', validatedData.guest_email);
    if (validatedData.check_in_from) query = query.gte('check_in_date', validatedData.check_in_from);
    if (validatedData.check_in_to) query = query.lte('check_in_date', validatedData.check_in_to);

    // Apply pagination
    const from = (validatedData.page - 1) * validatedData.limit;
    const to = from + validatedData.limit - 1;
    query = query.range(from, to);

    const { data: reservations, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch reservations', error, {
        userId: user.id,
        requestId,
        filters: validatedData
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }

    // Log successful access
    await createAuditLog(
      user.id,
      'view',
      'reservations',
      'list',
      undefined,
      {
        filters: validatedData,
        resultCount: reservations?.length || 0,
        clientIp,
        requestId
      }
    );

    return NextResponse.json({
      reservations: reservations || [],
      pagination: {
        page: validatedData.page,
        limit: validatedData.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedData.limit)
      }
    });

  } catch (error) {
    logger.error('Get reservations handler error', error, {
      clientIp,
      requestId
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new reservation with comprehensive security
 */
async function createReservationHandler(request: NextRequest, context: any): Promise<NextResponse> {
  const { sanitizedData, clientIp, userAgent, requestId, securityViolations } = context;
  const reservationData = sanitizedData as CreateReservationRequest;

  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Additional business logic validations
    const validationResult = await validateReservationBusinessRules(reservationData, supabase);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Reservation validation failed',
          details: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Check for availability conflicts
    const availabilityCheck = await checkAvailabilityConflicts(
      reservationData.loft_id,
      reservationData.check_in_date,
      reservationData.check_out_date,
      supabase
    );

    if (!availabilityCheck.available) {
      logger.warn('Reservation conflict detected', {
        loftId: reservationData.loft_id,
        checkIn: reservationData.check_in_date,
        checkOut: reservationData.check_out_date,
        userId: user.id,
        requestId
      });

      return NextResponse.json(
        { 
          error: 'Dates not available',
          details: availabilityCheck.conflicts
        },
        { status: 409 }
      );
    }

    // Create reservation with transaction
    const { data: reservation, error: createError } = await supabase
      .from('reservations')
      .insert({
        ...reservationData,
        user_id: user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        booking_reference: generateBookingReference()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create reservation', createError, {
        userId: user.id,
        reservationData,
        requestId
      });

      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }

    // Create audit log for reservation creation
    await createAuditLog(
      user.id,
      'create',
      'reservation',
      reservation.id,
      undefined,
      {
        loftId: reservationData.loft_id,
        checkIn: reservationData.check_in_date,
        checkOut: reservationData.check_out_date,
        guestCount: reservationData.guest_count,
        totalAmount: reservationData.total_amount,
        clientIp,
        userAgent,
        requestId,
        securityViolations: securityViolations.length > 0 ? securityViolations : undefined
      }
    );

    // Send confirmation email (async)
    sendReservationConfirmationEmail(reservation).catch(error => {
      logger.error('Failed to send confirmation email', error, {
        reservationId: reservation.id,
        requestId
      });
    });

    logger.info('Reservation created successfully', {
      reservationId: reservation.id,
      userId: user.id,
      loftId: reservationData.loft_id,
      bookingReference: reservation.booking_reference,
      requestId
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        booking_reference: reservation.booking_reference,
        status: reservation.status,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        total_amount: reservation.total_amount,
        created_at: reservation.created_at
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Create reservation handler error', error, {
      clientIp,
      requestId,
      reservationData
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate business rules for reservation
 */
async function validateReservationBusinessRules(
  data: CreateReservationRequest,
  supabase: any
): Promise<{ isValid: boolean; errors?: string[] }> {
  const errors: string[] = [];

  // Check if loft exists and is available
  const { data: loft, error: loftError } = await supabase
    .from('lofts')
    .select('id, name, status, price_per_night')
    .eq('id', data.loft_id)
    .single();

  if (loftError || !loft) {
    errors.push('Loft not found');
  } else if (loft.status !== 'available') {
    errors.push('Loft is not available for booking');
  }

  // Validate dates
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    errors.push('Check-in date cannot be in the past');
  }

  if (checkOut <= checkIn) {
    errors.push('Check-out date must be after check-in date');
  }

  const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) {
    errors.push('Maximum stay is 30 days');
  }

  // Validate pricing (basic check)
  if (loft && loft.price_per_night) {
    const expectedMinAmount = loft.price_per_night * daysDiff;
    if (data.total_amount < expectedMinAmount * 0.8) { // Allow 20% discount
      errors.push('Total amount seems too low for the selected dates');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Check for availability conflicts
 */
async function checkAvailabilityConflicts(
  loftId: string,
  checkIn: string,
  checkOut: string,
  supabase: any
): Promise<{ available: boolean; conflicts?: any[] }> {
  const { data: conflicts, error } = await supabase
    .from('reservations')
    .select('id, check_in_date, check_out_date, status')
    .eq('loft_id', loftId)
    .in('status', ['confirmed', 'pending'])
    .or(`and(check_in_date.lte.${checkOut},check_out_date.gt.${checkIn})`);

  if (error) {
    logger.error('Failed to check availability conflicts', error);
    return { available: false };
  }

  return {
    available: !conflicts || conflicts.length === 0,
    conflicts: conflicts || []
  };
}

/**
 * Generate unique booking reference
 */
function generateBookingReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK${timestamp}${random}`.toUpperCase();
}

/**
 * Send reservation confirmation email (placeholder)
 */
async function sendReservationConfirmationEmail(reservation: any): Promise<void> {
  // Implementation would depend on your email service
  logger.info('Sending confirmation email', {
    reservationId: reservation.id,
    guestEmail: reservation.guest_email
  });
}

// Export secured endpoints
export const GET = withSecurity(
  getReservationsHandler,
  SecurityPresets.booking()
);

export const POST = withSecurity(
  createReservationHandler,
  SecurityPresets.booking(createReservationSchema)
);