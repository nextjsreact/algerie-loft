
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Types for better type safety
interface ActionResult<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
  details?: any;
}

import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError
const createReservationSchema = z.object({
  loft_id: z.string().uuid(),
  guest_name: z.string().min(1).max(255),
  guest_email: z.string().email(),
  guest_phone: z.string().min(1).max(50),
  guest_nationality: z.string().min(1).max(100),
  guest_count: z.coerce.number().int().min(1),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  special_requests: z.string().optional(),
  customer_id: z.string().uuid().optional(), // New optional customer_id
  base_price: z.coerce.number().optional(),
  cleaning_fee: z.coerce.number().optional(),
  service_fee: z.coerce.number().optional(),
  taxes: z.coerce.number().optional(),
  total_amount: z.coerce.number().optional(),
});

export async function createReservation(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    // Validate form data
    const validatedData = createReservationSchema.parse({
      loft_id: formData.get('loft_id'),
      guest_name: formData.get('guest_name'),
      guest_email: formData.get('guest_email'),
      guest_phone: formData.get('guest_phone'),
      guest_nationality: formData.get('guest_nationality'),
      guest_count: formData.get('guest_count'),
      check_in_date: formData.get('check_in_date'),
      check_out_date: formData.get('check_out_date'),
      special_requests: formData.get('special_requests') || '',
      customer_id: formData.get('customer_id') || undefined, // Get customer_id from form
      base_price: formData.get('base_price'),
      cleaning_fee: formData.get('cleaning_fee'),
      service_fee: formData.get('service_fee'),
      taxes: formData.get('taxes'),
      total_amount: formData.get('total_amount'),
    });

    // Check if dates are valid
    const checkIn = new Date(validatedData.check_in_date);
    const checkOut = new Date(validatedData.check_out_date);
    
    if (checkOut <= checkIn) {
      return { error: 'Check-out date must be after check-in date' };
    }
    
    // Compare check-in date with the start of today to allow same-day check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the very beginning of today
    if (checkIn < today) {
      return { error: 'Check-in date cannot be in the past' };
    }

    // Check availability
    const { data: availabilityCheck, error: availabilityError } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: validatedData.loft_id,
        p_check_in: validatedData.check_in_date,
        p_check_out: validatedData.check_out_date,
      });

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      return { error: 'Failed to check availability' };
    }

    if (!availabilityCheck) {
      return { error: 'Selected dates are not available' };
    }

    let priceData = {
      base_price: validatedData.base_price,
      cleaning_fee: validatedData.cleaning_fee,
      service_fee: validatedData.service_fee,
      taxes: validatedData.taxes,
      total_amount: validatedData.total_amount,
    };

    // If pricing data is not provided from the form (e.g., direct API call or initial form load), calculate it
    if (priceData.base_price === undefined || priceData.cleaning_fee === undefined || priceData.service_fee === undefined || priceData.taxes === undefined || priceData.total_amount === undefined) {
      const { data: rpcPricing, error: pricingError } = await supabase
        .rpc('calculate_reservation_price', {
          p_loft_id: validatedData.loft_id,
          p_check_in: validatedData.check_in_date,
          p_check_out: validatedData.check_out_date,
          p_guest_count: validatedData.guest_count,
        });

      if (pricingError) {
        console.error('Error calculating pricing:', pricingError);
        return { error: 'Failed to calculate pricing: Database error' };
      }
      
      if (!rpcPricing || rpcPricing.length === 0 || !rpcPricing[0]) {
        console.error('Pricing data is empty or malformed:', rpcPricing);
        return { error: 'Failed to calculate pricing: No data returned' };
      }
      priceData = rpcPricing[0];
    }

    let customerId = validatedData.customer_id;

    // If no customer_id is provided (new guest), create or find customer
    if (!customerId) {
      // Try to find an existing customer by email or phone
      let existingCustomer: { id: string; first_name: string; last_name: string; email: string; phone: string; nationality: string; } | null = null;
      if (validatedData.guest_email) {
        const { data, error } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email, phone, nationality')
          .eq('email', validatedData.guest_email)
          .single();
        if (data) existingCustomer = data;
      }
      if (!existingCustomer && validatedData.guest_phone) {
        const { data, error } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email, phone, nationality')
          .eq('phone', validatedData.guest_phone)
          .single();
        if (data) existingCustomer = data;
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        
        const updatedCustomerData: { [key: string]: any } = {};
        const newFirstName = validatedData.guest_name.split(' ')[0] || '';
        const newLastName = validatedData.guest_name.split(' ').slice(1).join(' ') || '';

        if (existingCustomer.first_name !== newFirstName) updatedCustomerData.first_name = newFirstName;
        if (existingCustomer.last_name !== newLastName) updatedCustomerData.last_name = newLastName;
        if (existingCustomer.email !== validatedData.guest_email) updatedCustomerData.email = validatedData.guest_email;
        if (existingCustomer.phone !== validatedData.guest_phone) updatedCustomerData.phone = validatedData.guest_phone;
        if (existingCustomer.nationality !== validatedData.guest_nationality) updatedCustomerData.nationality = validatedData.guest_nationality;

        if (Object.keys(updatedCustomerData).length > 0) {
          const { error: updateCustomerError } = await supabase
            .from('customers')
            .update(updatedCustomerData)
            .eq('id', customerId);

          if (updateCustomerError) {
            console.error('Error updating existing customer:', updateCustomerError);
            return { error: 'Failed to update existing customer' };
          }
        }

      } else {
        // Create new customer
        const { data: newCustomer, error: createCustomerError } = await supabase
          .from('customers')
          .insert({
            first_name: validatedData.guest_name.split(' ')[0] || '',
            last_name: validatedData.guest_name.split(' ').slice(1).join(' ') || '',
            email: validatedData.guest_email,
            phone: validatedData.guest_phone,
            status: 'active', // Default status for new customers
            notes: `Created from reservation for loft ${validatedData.loft_id}`,
            nationality: validatedData.guest_nationality,
          })
          .select('id')
          .single();

        if (createCustomerError) {
          console.error('Error creating new customer:', createCustomerError);
          return { error: 'Failed to create new customer' };
        }
        customerId = newCustomer.id;
      }
    }

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        loft_id: validatedData.loft_id,
        guest_id: customerId, // Link reservation to customer
        guest_name: validatedData.guest_name, // Keep for display/denormalization if needed
        guest_email: validatedData.guest_email,
        guest_phone: validatedData.guest_phone,
        guest_nationality: validatedData.guest_nationality,
        guest_count: validatedData.guest_count,
        check_in_date: validatedData.check_in_date,
        check_out_date: validatedData.check_out_date,
        special_requests: validatedData.special_requests,
        base_price: priceData.base_price || 0,
        cleaning_fee: priceData.cleaning_fee || 0,
        service_fee: priceData.service_fee || 0,
        taxes: priceData.taxes || 0,
        total_amount: priceData.total_amount || 0,
        status: 'pending',
        payment_status: 'pending',
      })
      .select(`
        *,
        lofts:loft_id (
          id,
          name,
          address,
          price_per_night
        )
      `)
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      return { error: 'Failed to create reservation' };
    }

    // Revalidate the reservations page
    revalidatePath('/reservations');
    
    return { success: true, data: reservation };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data', 
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    
    console.error('Error in createReservation:', error);
    return { error: 'Internal server error' };
  }
}

export async function updateReservationStatus(
  reservationId: string, 
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed', 
  cancellationReason?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select(`
        *,
        lofts:loft_id (
          id,
          name,
          address,
          price_per_night
        )
      `)
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      return { error: 'Failed to update reservation' };
    }

    revalidatePath('/reservations');
    revalidatePath(`/reservations/${reservationId}`);
    
    return { success: true, data: reservation };
  } catch (error) {
    console.error('Error in updateReservationStatus:', error);
    return { error: 'Internal server error' };
  }
}

export async function confirmReservation(reservationId: string): Promise<ActionResult> {
  return await updateReservationStatus(reservationId, 'confirmed');
}

export async function completeReservation(reservationId: string): Promise<ActionResult> {
  return await updateReservationStatus(reservationId, 'completed');
}

export async function checkAvailability(loftId: string, checkIn: string, checkOut: string, guestCount: number = 1) {
  try {
    const supabase = await createClient();
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
      return { error: 'Check-out date must be after check-in date' };
    }

    // Check availability using the database function
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: loftId,
        p_check_in: checkIn,
        p_check_out: checkOut,
      });

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      return { error: 'Failed to check availability' };
    }

    // Get pricing if available
    let pricing = null;
    if (isAvailable) {
      const { data: pricingData, error: pricingError } = await supabase
        .rpc('calculate_reservation_price', {
          p_loft_id: loftId,
          p_check_in: checkIn,
          p_check_out: checkOut,
          p_guest_count: guestCount,
        });

      if (!pricingError && pricingData && pricingData.length > 0) {
        pricing = pricingData[0];
      }
    }

    return {
      available: isAvailable,
      loft_id: loftId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guest_count: guestCount,
      nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
      pricing
    };
  } catch (error) {
    console.error('Error in checkAvailability:', error);
    return { error: 'Internal server error' };
  }
}

// Availability Management Server Actions
const blockDatesSchema = z.object({
  loft_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocked_reason: z.string().min(1).max(100),
  price_override: z.coerce.number().optional(),
  minimum_stay: z.coerce.number().int().min(1).optional(),
});

export async function blockDates(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const validatedData = blockDatesSchema.parse({
      loft_id: formData.get('loft_id'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      blocked_reason: formData.get('blocked_reason'),
      price_override: formData.get('price_override'),
      minimum_stay: formData.get('minimum_stay'),
    });

    // Debug logging
    console.log('🔧 Server Action - blockDates called with:', {
      loft_id: validatedData.loft_id,
      start_date: validatedData.start_date,
      end_date: validatedData.end_date,
      blocked_reason: validatedData.blocked_reason,
      blocked_reason_type: typeof validatedData.blocked_reason,
      raw_form_data: {
        blocked_reason: formData.get('blocked_reason')
      }
    });

    // Validate dates
    const startDateObj = new Date(validatedData.start_date);
    const endDateObj = new Date(validatedData.end_date);
    
    if (endDateObj <= startDateObj) {
      return { error: 'End date must be after start date' };
    }

    // Check if the loft is available for the selected date range
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: validatedData.loft_id,
        p_check_in: validatedData.start_date,
        p_check_out: validatedData.end_date,
      });

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      return { error: 'Erreur lors de la vérification de la disponibilité' };
    }

    if (!isAvailable) {
      return { error: 'Le loft n\'est pas disponible pour cette période. Il y a déjà des réservations ou des blocages.' };
    }

    // Generate array of dates to block
    const datesToBlock: Array<{
      loft_id: string;
      date: string;
      is_available: boolean;
      blocked_reason: string;
      price_override?: number;
      minimum_stay: number;
    }> = [];
    const currentDate = new Date(validatedData.start_date);
    
    while (currentDate < endDateObj) {
      datesToBlock.push({
        loft_id: validatedData.loft_id,
        date: currentDate.toISOString().split('T')[0],
        is_available: false,
        blocked_reason: validatedData.blocked_reason,
        price_override: validatedData.price_override,
        minimum_stay: validatedData.minimum_stay || 1,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert or update availability records
    const { data, error } = await supabase
      .from('loft_availability')
      .upsert(datesToBlock, { 
        onConflict: 'loft_id,date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error blocking dates:', error);
      return { error: 'Failed to block dates' };
    }

    console.log('✅ Server Action - blockDates success:', {
      blocked_reason: validatedData.blocked_reason,
      blocked_dates_count: data?.length || 0,
      sample_record: data?.[0]
    });

    revalidatePath('/reservations');
    revalidatePath('/availability');
    
    return { 
      success: true, 
      data: {
        blocked_dates: data?.length || 0,
        blocked_reason: validatedData.blocked_reason, // Include for debugging
        start_date: validatedData.start_date,
        end_date: validatedData.end_date
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data', 
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    
    console.error('Error in blockDates:', error);
    return { error: 'Internal server error' };
  }
}

export async function unblockDates(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const loft_id = formData.get('loft_id') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;

    if (!loft_id || !start_date || !end_date) {
      return { error: 'Loft ID, start date, and end date are required' };
    }

    // Delete availability records (which will make dates available by default)
    const { error } = await supabase
      .from('loft_availability')
      .delete()
      .eq('loft_id', loft_id)
      .gte('date', start_date)
      .lt('date', end_date)
      .neq('blocked_reason', 'booked'); // Don't unblock booked dates

    if (error) {
      console.error('Error unblocking dates:', error);
      return { error: 'Failed to unblock dates' };
    }

    revalidatePath('/reservations');
    revalidatePath('/availability');
    
    return { 
      success: true, 
      data: { start_date, end_date }
    };
  } catch (error) {
    console.error('Error in unblockDates:', error);
    return { error: 'Internal server error' };
  }
}

// Guest Communication Server Actions
const sendMessageSchema = z.object({
  reservation_id: z.string().uuid(),
  message_type: z.enum(['booking_confirmation', 'check_in_instructions', 'general_inquiry', 'support_request', 'review_request']),
  subject: z.string().min(1).max(255).optional(),
  message: z.string().min(1),
});

export async function sendGuestMessage(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const validatedData = sendMessageSchema.parse({
      reservation_id: formData.get('reservation_id'),
      message_type: formData.get('message_type'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    });

    // Get current user (would need proper auth implementation)
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: communication, error } = await supabase
      .from('guest_communications')
      .insert({
        ...validatedData,
        sender_type: 'owner', // or 'system' based on context
        sender_id: user?.id,
        is_automated: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }

    revalidatePath(`/reservations/${validatedData.reservation_id}`);
    
    return { success: true, data: communication };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data', 
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    
    console.error('Error in sendGuestMessage:', error);
    return { error: 'Internal server error' };
  }
}

export async function getRecentReservations(): Promise<ActionResult<any[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      guest_name,
      check_in_date,
      check_out_date,
      status,
      created_at,
      lofts (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching recent reservations:', error);
    return { error: 'Failed to fetch recent reservations' };
  }

  return { success: true, data: data };
}

export async function getReservationStats(): Promise<ActionResult<{
  totalReservations: number;
  monthlyRevenue: number;
  occupancyRate: number;
  guestSatisfaction: number;
  totalReservationsLastMonth: number;
  monthlyRevenueLastMonth: number;
  occupancyRateLastMonth: number;
}>> {
  const supabase = await createClient();
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

  // Fetch reservations for current month
  const { data: currentMonthReservations, error: currentMonthError } = await supabase
    .from('reservations')
    .select('check_in_date, check_out_date, total_amount')
    .gte('check_in_date', currentMonthStart)
    .lte('check_in_date', currentMonthEnd);

  if (currentMonthError) {
    console.error('Error fetching current month reservations:', currentMonthError);
    return { error: 'Failed to fetch current month reservations' };
  }

  // Fetch reservations for last month
  const { data: lastMonthReservations, error: lastMonthError } = await supabase
    .from('reservations')
    .select('check_in_date, check_out_date, total_amount')
    .gte('check_in_date', lastMonthStart)
    .lte('check_in_date', lastMonthEnd);

  if (lastMonthError) {
    console.error('Error fetching last month reservations:', lastMonthError);
    return { error: 'Failed to fetch last month reservations' };
  }

  // Calculate Total Reservations and Monthly Revenue
  const totalReservations = currentMonthReservations.length;
  const monthlyRevenue = currentMonthReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const totalReservationsLastMonth = lastMonthReservations.length;
  const monthlyRevenueLastMonth = lastMonthReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);

  // Calculate Occupancy Rate
  // This is a simplified calculation. A more accurate one would involve loft availability.
  const { data: lofts, error: loftsError } = await supabase
    .from('lofts')
    .select('id');

  if (loftsError) {
    console.error('Error fetching lofts:', loftsError);
    return { error: 'Failed to fetch lofts' };
  }

  const numberOfLofts = lofts.length;
  let totalNightsBooked = 0;
  currentMonthReservations.forEach(reservation => {
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    totalNightsBooked += nights;
  });

  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const totalAvailableNights = numberOfLofts * daysInCurrentMonth;
  const occupancyRate = totalAvailableNights > 0 ? (totalNightsBooked / totalAvailableNights) * 100 : 0;

  // Occupancy rate last month
  let totalNightsBookedLastMonth = 0;
  lastMonthReservations.forEach(reservation => {
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    totalNightsBookedLastMonth += nights;
  });
  const daysInLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  const totalAvailableNightsLastMonth = numberOfLofts * daysInLastMonth;
  const occupancyRateLastMonth = totalAvailableNightsLastMonth > 0 ? (totalNightsBookedLastMonth / totalAvailableNightsLastMonth) * 100 : 0;

  // Guest Satisfaction (placeholder for now, as there's no rating system implemented)
  const guestSatisfaction = 0.0;

  return {
    success: true,
    data: {
      totalReservations,
      monthlyRevenue,
      occupancyRate,
      guestSatisfaction,
      totalReservationsLastMonth,
      monthlyRevenueLastMonth,
      occupancyRateLastMonth,
    }
  };
}
e
xport async function getReservation(id: string): Promise<any> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      lofts (
        id,
        name,
        address
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching reservation:', error);
    return null;
  }

  return data;
}