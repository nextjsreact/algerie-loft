/**
 * Booking Integration Service
 * Handles real-time booking operations and integrates with existing systems
 */

import { createClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import type { AuthSession } from '@/lib/types'

export interface BookingRequest {
  loft_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  special_requests?: string
  guest_info?: {
    name: string
    email: string
    phone: string
    nationality?: string
  }
}

export interface BookingResponse {
  id: string
  booking_reference: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed'
  loft_name: string
  check_in: string
  check_out: string
  total_price: number
  created_at: string
}

export interface AvailabilityCheck {
  loft_id: string
  check_in: string
  check_out: string
  guests: number
}

export interface AvailabilityResponse {
  available: boolean
  pricing?: {
    base_price: number
    total_price: number
    nights: number
    fees: {
      cleaning_fee: number
      service_fee: number
      taxes: number
    }
  }
  blocked_reason?: string
  minimum_stay?: number
}

export class BookingIntegrationService {
  private supabase: any
  private isServer: boolean

  constructor(isServer: boolean = false) {
    this.isServer = isServer
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    if (this.isServer) {
      this.supabase = await createClient()
    } else {
      this.supabase = createBrowserClient()
    }
  }

  /**
   * Check real-time availability for a loft
   */
  async checkAvailability(request: AvailabilityCheck): Promise<AvailabilityResponse> {
    await this.initializeSupabase()

    try {
      // Validate dates
      const checkIn = new Date(request.check_in)
      const checkOut = new Date(request.check_out)
      
      if (checkOut <= checkIn) {
        return {
          available: false,
          blocked_reason: 'Invalid date range'
        }
      }

      // Check availability using database function
      const { data: isAvailable, error: availabilityError } = await this.supabase
        .rpc('check_loft_availability', {
          p_loft_id: request.loft_id,
          p_check_in: request.check_in,
          p_check_out: request.check_out
        })

      if (availabilityError) {
        console.error('Availability check error:', availabilityError)
        return {
          available: false,
          blocked_reason: 'Unable to check availability'
        }
      }

      if (!isAvailable) {
        return {
          available: false,
          blocked_reason: 'Dates not available'
        }
      }

      // Calculate pricing if available
      const { data: pricingData, error: pricingError } = await this.supabase
        .rpc('calculate_reservation_price', {
          p_loft_id: request.loft_id,
          p_check_in: request.check_in,
          p_check_out: request.check_out,
          p_guest_count: request.guests
        })

      let pricing = undefined
      if (!pricingError && pricingData && pricingData.length > 0) {
        const priceData = pricingData[0]
        pricing = {
          base_price: priceData.base_price || 0,
          total_price: priceData.total_price || 0,
          nights: priceData.nights || 1,
          fees: {
            cleaning_fee: priceData.cleaning_fee || 0,
            service_fee: priceData.service_fee || 0,
            taxes: priceData.taxes || 0
          }
        }
      }

      return {
        available: true,
        pricing,
        minimum_stay: 1 // Could be fetched from loft settings
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      return {
        available: false,
        blocked_reason: 'System error'
      }
    }
  }

  /**
   * Create a new booking with integrated auth check
   */
  async createBooking(
    request: BookingRequest, 
    session: AuthSession
  ): Promise<{ success: boolean; booking?: BookingResponse; error?: string }> {
    await this.initializeSupabase()

    try {
      // Verify user is authenticated and is a client
      if (!session || session.user.role !== 'client') {
        return {
          success: false,
          error: 'Authentication required or insufficient permissions'
        }
      }

      // Double-check availability before booking
      const availability = await this.checkAvailability({
        loft_id: request.loft_id,
        check_in: request.check_in,
        check_out: request.check_out,
        guests: request.guests
      })

      if (!availability.available) {
        return {
          success: false,
          error: availability.blocked_reason || 'Loft not available'
        }
      }

      // Get loft information and partner
      const { data: loft, error: loftError } = await this.supabase
        .from('lofts')
        .select(`
          id,
          name,
          owner_id,
          partner_profiles!inner (
            user_id
          )
        `)
        .eq('id', request.loft_id)
        .single()

      if (loftError || !loft) {
        return {
          success: false,
          error: 'Loft not found'
        }
      }

      // Create the booking
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .insert({
          loft_id: request.loft_id,
          client_id: session.user.id,
          partner_id: loft.partner_profiles.user_id,
          check_in: request.check_in,
          check_out: request.check_out,
          guests: request.guests,
          total_price: request.total_price,
          special_requests: request.special_requests || null,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Booking creation error:', bookingError)
        return {
          success: false,
          error: 'Failed to create booking'
        }
      }

      // Send notifications (async, don't wait)
      this.sendBookingNotifications(booking, loft, session.user)

      return {
        success: true,
        booking: {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: booking.status,
          payment_status: booking.payment_status,
          loft_name: loft.name,
          check_in: booking.check_in,
          check_out: booking.check_out,
          total_price: booking.total_price,
          created_at: booking.created_at
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Get user bookings with integrated auth
   */
  async getUserBookings(
    session: AuthSession,
    options: {
      page?: number
      limit?: number
      status?: string
    } = {}
  ): Promise<{ bookings: BookingResponse[]; total: number }> {
    await this.initializeSupabase()

    try {
      const { page = 1, limit = 10, status } = options
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          check_in,
          check_out,
          guests,
          total_price,
          status,
          payment_status,
          special_requests,
          created_at,
          lofts (
            id,
            name,
            address
          )
        `, { count: 'exact' })
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: bookings, error, count } = await query

      if (error) {
        console.error('Error fetching user bookings:', error)
        return { bookings: [], total: 0 }
      }

      const processedBookings = (bookings || []).map(booking => ({
        id: booking.id,
        booking_reference: booking.booking_reference,
        status: booking.status,
        payment_status: booking.payment_status,
        loft_name: booking.lofts?.name || 'Unknown Loft',
        check_in: booking.check_in,
        check_out: booking.check_out,
        total_price: booking.total_price,
        created_at: booking.created_at
      }))

      return {
        bookings: processedBookings,
        total: count || 0
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error)
      return { bookings: [], total: 0 }
    }
  }

  /**
   * Send booking notifications (async)
   */
  private async sendBookingNotifications(booking: any, loft: any, user: any) {
    try {
      // Send notification to partner
      await this.supabase
        .from('notifications')
        .insert({
          user_id: loft.partner_profiles.user_id,
          type: 'booking_request',
          title: 'Nouvelle demande de réservation',
          message: `${user.full_name || user.email} a fait une demande de réservation pour ${loft.name}`,
          data: {
            booking_id: booking.id,
            loft_id: loft.id,
            client_id: user.id
          }
        })

      // Send confirmation to client
      await this.supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'booking_confirmation',
          title: 'Demande de réservation envoyée',
          message: `Votre demande de réservation pour ${loft.name} a été envoyée. Référence: ${booking.booking_reference}`,
          data: {
            booking_id: booking.id,
            loft_id: loft.id
          }
        })

      console.log('Booking notifications sent successfully')
    } catch (error) {
      console.error('Error sending booking notifications:', error)
    }
  }

  /**
   * Update booking status (for partners/admins)
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled',
    session: AuthSession
  ): Promise<{ success: boolean; error?: string }> {
    await this.initializeSupabase()

    try {
      // Check permissions
      if (!['partner', 'admin', 'manager'].includes(session.user.role)) {
        return {
          success: false,
          error: 'Insufficient permissions'
        }
      }

      // Update booking status
      const { error } = await this.supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) {
        console.error('Error updating booking status:', error)
        return {
          success: false,
          error: 'Failed to update booking'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating booking status:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }
}

// Export singleton instances
export const serverBookingIntegration = new BookingIntegrationService(true)
export const clientBookingIntegration = new BookingIntegrationService(false)