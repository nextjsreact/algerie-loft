/**
 * Partner Dashboard Data Fetching Utilities
 * Provides efficient data fetching with retry logic, timeout handling, and parallel requests
 */

export interface FetchOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  signal?: AbortSignal
}

export interface FetchResult<T> {
  data: T | null
  error: Error | null
  status: number | null
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    signal,
  } = options

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      // Check if request was cancelled
      if (signal?.aborted) {
        throw new Error('Request cancelled')
      }

      const response = await fetchWithTimeout(url, {
        timeout,
        signal,
      })

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 429
      ) {
        const errorData = await response.json().catch(() => ({}))
        return {
          data: null,
          error: new Error(errorData.message || `HTTP ${response.status}`),
          status: response.status,
        }
      }

      // Retry on server errors (5xx) or specific client errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        data,
        error: null,
        status: response.status,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      attempt++

      // Don't retry if it's the last attempt or request was cancelled
      if (attempt > retries || signal?.aborted) {
        break
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
      )
    }
  }

  return {
    data: null,
    error: lastError || new Error('Unknown error'),
    status: null,
  }
}

/**
 * Fetch multiple endpoints in parallel
 */
export async function fetchParallel<T extends Record<string, any>>(
  requests: Record<keyof T, string>,
  options: FetchOptions = {}
): Promise<Record<keyof T, FetchResult<any>>> {
  const entries = Object.entries(requests) as [keyof T, string][]

  const results = await Promise.all(
    entries.map(async ([key, url]) => {
      const result = await fetchWithRetry(url, options)
      return [key, result] as const
    })
  )

  return Object.fromEntries(results) as Record<keyof T, FetchResult<any>>
}

/**
 * Partner Dashboard Data Types
 */
export interface PartnerStats {
  total_properties: number
  active_properties: number
  total_bookings: number
  upcoming_bookings: number
  monthly_earnings: number
  yearly_earnings: number
  occupancy_rate: number
  average_rating: number
  total_reviews: number
  pending_requests: number
  unread_messages: number
}

export interface PropertySummary {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance'
  price_per_night: number
  bookings_count: number
  earnings_this_month: number
  occupancy_rate: number
  average_rating: number
  images?: string[]
  next_booking?: {
    check_in: string
    check_out: string
    client_name: string
  }
}

export interface RecentBooking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  client_name: string
  loft_name: string
  loft_id: string
}

export interface DashboardData {
  stats: PartnerStats
  properties: PropertySummary[]
  bookings: RecentBooking[]
}

/**
 * Fetch all dashboard data in parallel
 */
export async function fetchDashboardData(
  options: FetchOptions = {}
): Promise<{
  stats: FetchResult<PartnerStats>
  properties: FetchResult<{ properties: PropertySummary[] }>
  bookings: FetchResult<{ bookings: RecentBooking[] }>
}> {
  return fetchParallel(
    {
      stats: '/api/partner/dashboard/stats',
      properties: '/api/partner/properties?summary=true',
      bookings: '/api/bookings?limit=5',
    },
    options
  )
}

/**
 * Error type detection
 */
export function getErrorType(error: unknown): 'network' | 'timeout' | 'unauthorized' | 'server' | 'unknown' {
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return 'timeout'
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'network'
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      return 'unauthorized'
    }
    if (error.message.includes('5')) {
      return 'server'
    }
  }
  return 'unknown'
}
