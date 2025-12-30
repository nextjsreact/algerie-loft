'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { clientBookingIntegration, type BookingRequest, type AvailabilityCheck } from '@/lib/services/booking-integration'
import { useUserSession } from './use-homepage-data'

export interface UseBookingIntegrationReturn {
  // Availability checking
  checkAvailability: (request: AvailabilityCheck) => Promise<any>
  availabilityLoading: boolean
  
  // Booking creation
  createBooking: (request: BookingRequest) => Promise<{ success: boolean; bookingId?: string; error?: string }>
  bookingLoading: boolean
  
  // User bookings
  userBookings: any[]
  loadUserBookings: (options?: { page?: number; limit?: number; status?: string }) => Promise<void>
  bookingsLoading: boolean
  
  // Auth integration
  requireAuth: (returnUrl?: string) => void
  
  // State
  error: string | null
  clearError: () => void
}

export function useBookingIntegration(): UseBookingIntegrationReturn {
  const { session } = useUserSession()
  const router = useRouter()
  
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async (request: AvailabilityCheck) => {
    setAvailabilityLoading(true)
    setError(null)

    try {
      const result = await clientBookingIntegration.checkAvailability(request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      throw err
    } finally {
      setAvailabilityLoading(false)
    }
  }, [])

  const createBooking = useCallback(async (request: BookingRequest) => {
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    setBookingLoading(true)
    setError(null)

    try {
      const result = await clientBookingIntegration.createBooking(request, session)
      
      if (result.success && result.booking) {
        return {
          success: true,
          bookingId: result.booking.id
        }
      } else {
        setError(result.error || 'Booking failed')
        return {
          success: false,
          error: result.error
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Booking failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setBookingLoading(false)
    }
  }, [session])

  const loadUserBookings = useCallback(async (options: { page?: number; limit?: number; status?: string } = {}) => {
    if (!session) {
      setError('Authentication required')
      return
    }

    setBookingsLoading(true)
    setError(null)

    try {
      const result = await clientBookingIntegration.getUserBookings(session, options)
      setUserBookings(result.bookings)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings'
      setError(errorMessage)
    } finally {
      setBookingsLoading(false)
    }
  }, [session])

  const requireAuth = useCallback((returnUrl?: string) => {
    const currentUrl = returnUrl || window.location.pathname + window.location.search
    const encodedReturnUrl = encodeURIComponent(currentUrl)
    router.push(`/fr/login?return_to=${encodedReturnUrl}`)
  }, [router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    checkAvailability,
    availabilityLoading,
    createBooking,
    bookingLoading,
    userBookings,
    loadUserBookings,
    bookingsLoading,
    requireAuth,
    error,
    clearError
  }
}

// Hook specifically for availability checking
export function useAvailabilityCheck() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async (request: AvailabilityCheck) => {
    setLoading(true)
    setError(null)

    try {
      const result = await clientBookingIntegration.checkAvailability(request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      return {
        available: false,
        blocked_reason: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    checkAvailability,
    loading,
    error,
    clearError: () => setError(null)
  }
}

// Hook for quick booking flow
export function useQuickBooking() {
  const { session } = useUserSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickBook = useCallback(async (
    loftId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    totalPrice: number,
    locale: string = 'fr'
  ) => {
    if (!session) {
      // Redirect to login with booking context
      const returnUrl = encodeURIComponent(
        `/${locale}/lofts/${loftId}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}&quick_book=true`
      )
      router.push(`/${locale}/login?return_to=${returnUrl}`)
      return { success: false, requiresAuth: true }
    }

    setLoading(true)
    setError(null)

    try {
      const bookingRequest: BookingRequest = {
        loft_id: loftId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_price: totalPrice
      }

      const result = await clientBookingIntegration.createBooking(bookingRequest, session)
      
      if (result.success && result.booking) {
        // Redirect to booking confirmation
        router.push(`/${locale}/bookings/${result.booking.id}`)
        return { success: true, bookingId: result.booking.id }
      } else {
        setError(result.error || 'Booking failed')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Booking failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [session, router])

  return {
    quickBook,
    loading,
    error,
    clearError: () => setError(null)
  }
}