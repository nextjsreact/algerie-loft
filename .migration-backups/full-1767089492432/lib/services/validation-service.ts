/**
 * Validation Service for Cross-Cutting Concerns
 * 
 * Provides centralized validation logic for reservations, lofts, and related data.
 * Ensures data consistency and business rule compliance across the application.
 */

import { LoftRepository } from '@/lib/repositories/loft-repository';
import { ReservationGuestInfo } from '@/lib/types';

export interface ValidationRule<T> {
  field: keyof T;
  required: boolean;
  validator: (value: any) => boolean;
  message: string;
}

export interface DateRangeValidationResult {
  valid: boolean;
  error?: string;
  nights?: number;
}

export interface GuestInfoValidationResult {
  valid: boolean;
  errors: string[];
}

export interface LoftConsistencyValidationResult {
  valid: boolean;
  error?: string;
  loft?: any;
}

/**
 * Validation Service Class
 * 
 * Provides static methods for common validation scenarios across the application.
 * Focuses on business logic validation and data consistency checks.
 */
export class ValidationService {
  
  /**
   * Validate loft ID format and structure
   * @param id The loft ID to validate
   * @returns boolean - true if ID format is valid
   */
  static validateLoftId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Check if it's a valid UUID format (most common for loft IDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Also allow simple alphanumeric IDs for test data
    const simpleIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    
    return uuidRegex.test(id) || simpleIdRegex.test(id);
  }

  /**
   * Validate date range for reservations
   * @param checkIn Check-in date string (ISO format)
   * @param checkOut Check-out date string (ISO format)
   * @returns DateRangeValidationResult with validation details
   */
  static validateDateRange(checkIn: string, checkOut: string): DateRangeValidationResult {
    try {
      // Check if dates are provided
      if (!checkIn || !checkOut) {
        return {
          valid: false,
          error: 'Both check-in and check-out dates are required'
        };
      }

      // Parse dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      // Check if dates are valid
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return {
          valid: false,
          error: 'Invalid date format. Please use YYYY-MM-DD format'
        };
      }

      // Check if check-in is in the future (or today)
      if (checkInDate < today) {
        return {
          valid: false,
          error: 'Check-in date cannot be in the past'
        };
      }

      // Check if check-out is after check-in
      if (checkOutDate <= checkInDate) {
        return {
          valid: false,
          error: 'Check-out date must be after check-in date'
        };
      }

      // Calculate nights
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Check minimum stay (1 night)
      if (nights < 1) {
        return {
          valid: false,
          error: 'Minimum stay is 1 night'
        };
      }

      // Check maximum stay (90 days for reasonable limit)
      if (nights > 90) {
        return {
          valid: false,
          error: 'Maximum stay is 90 nights'
        };
      }

      // Check if booking is too far in advance (1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (checkInDate > oneYearFromNow) {
        return {
          valid: false,
          error: 'Bookings can only be made up to 1 year in advance'
        };
      }

      return {
        valid: true,
        nights
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Error validating dates. Please check date format'
      };
    }
  }

  /**
   * Validate guest count against loft capacity
   * @param guests Number of guests
   * @param maxGuests Maximum guests allowed for the loft
   * @returns boolean - true if guest count is valid
   */
  static validateGuestCount(guests: number, maxGuests: number): boolean {
    if (!guests || !maxGuests) {
      return false;
    }

    if (guests < 1) {
      return false;
    }

    if (guests > maxGuests) {
      return false;
    }

    // Reasonable upper limit
    if (guests > 20) {
      return false;
    }

    return true;
  }

  /**
   * Validate guest information structure and content
   * @param guestInfo Guest information object
   * @returns GuestInfoValidationResult with validation details
   */
  static validateGuestInfo(guestInfo: ReservationGuestInfo): GuestInfoValidationResult {
    const errors: string[] = [];

    try {
      // Check if guest info exists
      if (!guestInfo) {
        return {
          valid: false,
          errors: ['Guest information is required']
        };
      }

      // Validate primary guest
      if (!guestInfo.primary_guest) {
        errors.push('Primary guest information is required');
      } else {
        const { primary_guest } = guestInfo;

        // Validate required fields
        if (!primary_guest.first_name || primary_guest.first_name.trim().length < 2) {
          errors.push('Primary guest first name is required (minimum 2 characters)');
        }

        if (!primary_guest.last_name || primary_guest.last_name.trim().length < 2) {
          errors.push('Primary guest last name is required (minimum 2 characters)');
        }

        if (!primary_guest.email || !this.validateEmail(primary_guest.email)) {
          errors.push('Valid primary guest email is required');
        }

        if (!primary_guest.phone || !this.validatePhone(primary_guest.phone)) {
          errors.push('Valid primary guest phone number is required');
        }

        // Validate name lengths
        if (primary_guest.first_name && primary_guest.first_name.length > 50) {
          errors.push('Primary guest first name cannot exceed 50 characters');
        }

        if (primary_guest.last_name && primary_guest.last_name.length > 50) {
          errors.push('Primary guest last name cannot exceed 50 characters');
        }

        // Validate nationality if provided
        if (primary_guest.nationality && primary_guest.nationality.length > 50) {
          errors.push('Nationality cannot exceed 50 characters');
        }
      }

      // Validate guest counts
      if (typeof guestInfo.total_guests !== 'number' || guestInfo.total_guests < 1) {
        errors.push('Total guests must be at least 1');
      }

      if (typeof guestInfo.adults !== 'number' || guestInfo.adults < 1) {
        errors.push('At least 1 adult is required');
      }

      if (typeof guestInfo.children !== 'number' || guestInfo.children < 0) {
        errors.push('Children count cannot be negative');
      }

      if (typeof guestInfo.infants !== 'number' || guestInfo.infants < 0) {
        errors.push('Infants count cannot be negative');
      }

      // Validate guest count consistency
      const calculatedTotal = guestInfo.adults + guestInfo.children + guestInfo.infants;
      if (calculatedTotal !== guestInfo.total_guests) {
        errors.push('Total guests must equal the sum of adults, children, and infants');
      }

      // Validate additional guests if provided
      if (guestInfo.additional_guests) {
        if (!Array.isArray(guestInfo.additional_guests)) {
          errors.push('Additional guests must be an array');
        } else {
          guestInfo.additional_guests.forEach((guest, index) => {
            if (!guest.first_name || guest.first_name.trim().length < 2) {
              errors.push(`Additional guest ${index + 1}: First name is required (minimum 2 characters)`);
            }

            if (!guest.last_name || guest.last_name.trim().length < 2) {
              errors.push(`Additional guest ${index + 1}: Last name is required (minimum 2 characters)`);
            }

            if (!guest.age_group || !['adult', 'child', 'infant'].includes(guest.age_group)) {
              errors.push(`Additional guest ${index + 1}: Valid age group is required (adult, child, or infant)`);
            }

            if (guest.first_name && guest.first_name.length > 50) {
              errors.push(`Additional guest ${index + 1}: First name cannot exceed 50 characters`);
            }

            if (guest.last_name && guest.last_name.length > 50) {
              errors.push(`Additional guest ${index + 1}: Last name cannot exceed 50 characters`);
            }
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        valid: false,
        errors: ['Error validating guest information']
      };
    }
  }

  /**
   * Validate reservation consistency with loft data
   * @param loftId The loft ID to validate
   * @param loftRepository Repository instance for loft data access
   * @returns Promise<LoftConsistencyValidationResult> with validation details
   */
  static async validateReservationConsistency(
    loftId: string,
    loftRepository: LoftRepository
  ): Promise<LoftConsistencyValidationResult> {
    try {
      // Validate loft ID format first
      if (!this.validateLoftId(loftId)) {
        return {
          valid: false,
          error: 'Invalid loft ID format'
        };
      }

      // Check if loft exists
      const loftResult = await loftRepository.getLoftById(loftId);
      
      if (!loftResult.exists || !loftResult.loft) {
        return {
          valid: false,
          error: `Loft with ID ${loftId} does not exist`
        };
      }

      const loft = loftResult.loft;

      // Check if loft is published and available
      if (!loft.is_published) {
        return {
          valid: false,
          error: 'This loft is not available for booking'
        };
      }

      if (loft.status !== 'available') {
        return {
          valid: false,
          error: `This loft is currently ${loft.status} and not available for booking`
        };
      }

      return {
        valid: true,
        loft
      };

    } catch (error) {
      console.error('Error validating reservation consistency:', error);
      return {
        valid: false,
        error: 'Error validating loft availability. Please try again.'
      };
    }
  }

  /**
   * Validate email format
   * @param email Email string to validate
   * @returns boolean - true if email format is valid
   */
  private static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate phone number format
   * @param phone Phone string to validate
   * @returns boolean - true if phone format is valid
   */
  private static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it has reasonable length (7-15 digits)
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }

  /**
   * Validate pricing data structure and calculations
   * @param pricing Pricing object to validate
   * @param nights Number of nights for the reservation
   * @returns boolean - true if pricing is valid
   */
  static validatePricing(pricing: any, nights: number): boolean {
    try {
      if (!pricing || typeof pricing !== 'object') {
        return false;
      }

      // Check required fields
      const requiredFields = ['base_price', 'nights', 'nightly_rate', 'cleaning_fee', 'service_fee', 'taxes', 'total_amount', 'currency'];
      
      for (const field of requiredFields) {
        if (!(field in pricing)) {
          return false;
        }
      }

      // Validate numeric fields
      const numericFields = ['base_price', 'nights', 'nightly_rate', 'cleaning_fee', 'service_fee', 'taxes', 'total_amount'];
      
      for (const field of numericFields) {
        if (typeof pricing[field] !== 'number' || pricing[field] < 0) {
          return false;
        }
      }

      // Validate nights consistency
      if (pricing.nights !== nights) {
        return false;
      }

      // Validate base price calculation
      const expectedBasePrice = pricing.nightly_rate * nights;
      if (Math.abs(pricing.base_price - expectedBasePrice) > 0.01) {
        return false;
      }

      // Validate total amount calculation
      const expectedTotal = pricing.base_price + pricing.cleaning_fee + pricing.service_fee + pricing.taxes;
      if (Math.abs(pricing.total_amount - expectedTotal) > 0.01) {
        return false;
      }

      // Validate currency
      if (!pricing.currency || typeof pricing.currency !== 'string' || pricing.currency.length !== 3) {
        return false;
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Validate special requests and additional fields
   * @param specialRequests Special requests string
   * @returns boolean - true if special requests are valid
   */
  static validateSpecialRequests(specialRequests?: string): boolean {
    if (!specialRequests) {
      return true; // Optional field
    }

    if (typeof specialRequests !== 'string') {
      return false;
    }

    // Check length limit
    if (specialRequests.length > 1000) {
      return false;
    }

    // Check for potentially harmful content (basic check)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(specialRequests));
  }

  /**
   * Validate minimum stay requirements
   * @param nights Number of nights requested
   * @param minimumStay Minimum stay requirement for the loft
   * @returns boolean - true if stay meets minimum requirements
   */
  static validateMinimumStay(nights: number, minimumStay: number): boolean {
    if (typeof nights !== 'number' || typeof minimumStay !== 'number') {
      return false;
    }

    return nights >= minimumStay;
  }

  /**
   * Validate maximum stay requirements
   * @param nights Number of nights requested
   * @param maximumStay Maximum stay allowed for the loft (optional)
   * @returns boolean - true if stay meets maximum requirements
   */
  static validateMaximumStay(nights: number, maximumStay?: number): boolean {
    if (typeof nights !== 'number') {
      return false;
    }

    if (!maximumStay) {
      return true; // No maximum limit
    }

    if (typeof maximumStay !== 'number') {
      return false;
    }

    return nights <= maximumStay;
  }

  /**
   * Comprehensive business rule validation for reservations
   * @param reservationData Complete reservation data to validate
   * @param loft Loft data for validation
   * @returns Array of validation errors (empty if valid)
   */
  static validateBusinessRules(reservationData: any, loft: any): string[] {
    const errors: string[] = [];

    try {
      // Validate guest count against loft capacity
      if (!this.validateGuestCount(reservationData.guest_info?.total_guests, loft.max_guests)) {
        errors.push(`This loft accommodates a maximum of ${loft.max_guests} guests`);
      }

      // Validate minimum stay
      const dateValidation = this.validateDateRange(reservationData.check_in_date, reservationData.check_out_date);
      if (dateValidation.valid && dateValidation.nights) {
        if (!this.validateMinimumStay(dateValidation.nights, loft.minimum_stay)) {
          errors.push(`This loft requires a minimum stay of ${loft.minimum_stay} night(s)`);
        }

        if (loft.maximum_stay && !this.validateMaximumStay(dateValidation.nights, loft.maximum_stay)) {
          errors.push(`This loft allows a maximum stay of ${loft.maximum_stay} night(s)`);
        }
      }

      // Validate special requests
      if (!this.validateSpecialRequests(reservationData.special_requests)) {
        errors.push('Special requests contain invalid content');
      }

      // Validate terms acceptance
      if (!reservationData.terms_accepted) {
        errors.push('Terms and conditions must be accepted');
      }

      return errors;

    } catch (error) {
      console.error('Error validating business rules:', error);
      return ['Error validating reservation requirements'];
    }
  }
}

/**
 * Utility function to create a comprehensive validation result
 * @param valid Whether validation passed
 * @param errors Array of error messages
 * @param data Optional additional data
 * @returns Standardized validation result
 */
export function createValidationResult<T = any>(
  valid: boolean,
  errors: string[] = [],
  data?: T
): {
  valid: boolean;
  errors: string[];
  data?: T;
} {
  return {
    valid,
    errors,
    ...(data && { data })
  };
}

/**
 * Utility function to combine multiple validation results
 * @param results Array of validation results to combine
 * @returns Combined validation result
 */
export function combineValidationResults(
  results: Array<{ valid: boolean; errors?: string[]; error?: string }>
): { valid: boolean; errors: string[] } {
  const allErrors: string[] = [];
  let allValid = true;

  for (const result of results) {
    if (!result.valid) {
      allValid = false;
    }

    if (result.errors) {
      allErrors.push(...result.errors);
    }

    if (result.error) {
      allErrors.push(result.error);
    }
  }

  return {
    valid: allValid,
    errors: allErrors
  };
}