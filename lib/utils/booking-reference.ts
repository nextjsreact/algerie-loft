/**
 * Booking Reference Generation Utility
 * Requirements: 5.5, 10.1
 * 
 * Generates unique booking references and confirmation codes for reservations
 */

import { createClient } from '@/utils/supabase/server';

/**
 * Generate a unique booking reference
 * Format: LA-YYYYMMDD-XXXX (LA = Loft Algerie, YYYYMMDD = date, XXXX = random)
 */
export function generateBookingReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate 4-digit random number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `LA-${dateStr}-${randomNum}`;
}

/**
 * Generate a unique confirmation code
 * Format: 6-character alphanumeric code (uppercase)
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate a unique session ID for reservation locks
 * Format: UUID-like string for session tracking
 */
export function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Ensure booking reference is unique by checking database
 * Requirements: 5.5, 10.1
 */
export async function generateUniqueBookingReference(): Promise<string> {
  const supabase = createClient();
  let reference: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    reference = generateBookingReference();
    
    try {
      const { data, error } = await (await supabase)
        .from('reservations')
        .select('id')
        .eq('booking_reference', reference)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found, reference is unique
        isUnique = true;
        return reference;
      } else if (error) {
        console.error('Error checking booking reference uniqueness:', error);
        throw new Error('Failed to generate unique booking reference');
      } else {
        // Reference exists, try again
        attempts++;
      }
    } catch (error) {
      console.error('Error generating unique booking reference:', error);
      throw new Error('Failed to generate unique booking reference');
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique booking reference after maximum attempts');
  }

  return reference!;
}

/**
 * Ensure confirmation code is unique by checking database
 * Requirements: 5.5, 10.1
 */
export async function generateUniqueConfirmationCode(): Promise<string> {
  const supabase = createClient();
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateConfirmationCode();
    
    try {
      const { data, error } = await (await supabase)
        .from('reservations')
        .select('id')
        .eq('confirmation_code', code)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found, code is unique
        isUnique = true;
        return code;
      } else if (error) {
        console.error('Error checking confirmation code uniqueness:', error);
        throw new Error('Failed to generate unique confirmation code');
      } else {
        // Code exists, try again
        attempts++;
      }
    } catch (error) {
      console.error('Error generating unique confirmation code:', error);
      throw new Error('Failed to generate unique confirmation code');
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique confirmation code after maximum attempts');
  }

  return code!;
}

/**
 * Validate booking reference format
 */
export function validateBookingReference(reference: string): boolean {
  const pattern = /^LA-\d{8}-\d{4}$/;
  return pattern.test(reference);
}

/**
 * Validate confirmation code format
 */
export function validateConfirmationCode(code: string): boolean {
  const pattern = /^[A-Z0-9]{6}$/;
  return pattern.test(code);
}

/**
 * Parse booking reference to extract date information
 */
export function parseBookingReference(reference: string): {
  prefix: string;
  date: string;
  sequence: string;
  isValid: boolean;
} {
  if (!validateBookingReference(reference)) {
    return {
      prefix: '',
      date: '',
      sequence: '',
      isValid: false
    };
  }

  const parts = reference.split('-');
  return {
    prefix: parts[0], // 'LA'
    date: parts[1],   // 'YYYYMMDD'
    sequence: parts[2], // 'XXXX'
    isValid: true
  };
}

/**
 * Generate a complete reservation identifier set
 * Requirements: 5.5, 10.1
 */
export async function generateReservationIdentifiers(): Promise<{
  bookingReference: string;
  confirmationCode: string;
  sessionId: string;
}> {
  try {
    const [bookingReference, confirmationCode] = await Promise.all([
      generateUniqueBookingReference(),
      generateUniqueConfirmationCode()
    ]);

    const sessionId = generateSessionId();

    return {
      bookingReference,
      confirmationCode,
      sessionId
    };
  } catch (error) {
    console.error('Error generating reservation identifiers:', error);
    throw new Error('Failed to generate reservation identifiers');
  }
}

/**
 * Format booking reference for display (with spaces for readability)
 */
export function formatBookingReferenceForDisplay(reference: string): string {
  if (!validateBookingReference(reference)) {
    return reference;
  }

  const parts = reference.split('-');
  return `${parts[0]} - ${parts[1]} - ${parts[2]}`;
}

/**
 * Generate QR code data for booking reference
 * This can be used to generate QR codes for easy check-in
 */
export function generateBookingQRData(reference: string, confirmationCode: string): string {
  return JSON.stringify({
    type: 'loft_algerie_booking',
    reference,
    code: confirmationCode,
    timestamp: new Date().toISOString()
  });
}

/**
 * Booking reference statistics for analytics
 * Requirements: 10.4
 */
export interface BookingReferenceStats {
  totalGenerated: number;
  generatedToday: number;
  generatedThisMonth: number;
  averageGenerationTime: number;
}

/**
 * Get booking reference generation statistics
 * Requirements: 10.4
 */
export async function getBookingReferenceStats(): Promise<BookingReferenceStats> {
  const supabase = createClient();
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalResult, todayResult, monthResult] = await Promise.all([
      (await supabase)
        .from('reservations')
        .select('id', { count: 'exact', head: true }),
      
      (await supabase)
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString()),
      
      (await supabase)
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
    ]);

    return {
      totalGenerated: totalResult.count || 0,
      generatedToday: todayResult.count || 0,
      generatedThisMonth: monthResult.count || 0,
      averageGenerationTime: 50 // Placeholder - would need to track actual generation times
    };
  } catch (error) {
    console.error('Error getting booking reference stats:', error);
    return {
      totalGenerated: 0,
      generatedToday: 0,
      generatedThisMonth: 0,
      averageGenerationTime: 0
    };
  }
}