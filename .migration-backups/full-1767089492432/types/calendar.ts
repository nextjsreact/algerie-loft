/**
 * Calendar-related type definitions for the reservation system
 */

export interface Reservation {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  lofts: {
    name: string;
  };
}

export interface AvailabilityResource {
  date: string;
  is_available: boolean;
  blocked_reason: string;
  price_override: number | null;
  minimum_stay: number;
  loft_name?: string;
  reservation: {
    status: string;
    guest_name: string;
    loft_name: string;
  } | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Reservation | AvailabilityResource;
  status: string;
  loftName?: string;
}

export interface ReservationCalendarProps {
  loftId?: string;
  onReservationSelect?: (reservation: Reservation) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  defaultCurrencySymbol?: string;
}

/**
 * Type guard to check if a resource is a Reservation
 */
export function isReservation(resource: Reservation | AvailabilityResource): resource is Reservation {
  return 'guest_name' in resource && 'guest_email' in resource;
}

/**
 * Type guard to check if a resource is an AvailabilityResource
 */
export function isAvailabilityResource(resource: Reservation | AvailabilityResource): resource is AvailabilityResource {
  return 'date' in resource && 'is_available' in resource;
}

/**
 * Blocked reason types for better type safety
 */
export type BlockedReasonType = 'maintenance' | 'renovation' | 'blocked' | 'other';

/**
 * Event status types for calendar events
 */
export type EventStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'blocked' | 'maintenance' | 'renovation';