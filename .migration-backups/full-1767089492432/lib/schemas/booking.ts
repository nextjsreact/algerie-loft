import { z } from 'zod';

// Guest information schema
export const guestInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  nationality: z.string().min(2, "Please select your nationality"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  idNumber: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(2, "Emergency contact name is required"),
    phone: z.string().min(10, "Emergency contact phone is required"),
    relationship: z.string().min(1, "Relationship is required")
  }).optional()
});

// Additional guests schema
export const additionalGuestSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  age: z.number().min(0).max(120, "Please enter a valid age")
});

// Booking preferences schema
export const bookingPreferencesSchema = z.object({
  arrivalTime: z.string().optional(),
  specialRequests: z.string().max(500, "Special requests must be less than 500 characters").optional(),
  accessibilityNeeds: z.string().max(300, "Accessibility needs must be less than 300 characters").optional(),
  dietaryRestrictions: z.string().max(300, "Dietary restrictions must be less than 300 characters").optional()
});

// Main booking form schema
export const bookingFormSchema = z.object({
  // Loft and dates (passed as props, validated here)
  loftId: z.string().min(1, "Loft selection is required"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1, "At least 1 guest is required").max(20, "Maximum 20 guests allowed"),
  
  // Primary guest information
  primaryGuest: guestInfoSchema,
  
  // Additional guests
  additionalGuests: z.array(additionalGuestSchema).optional(),
  
  // Booking preferences
  preferences: bookingPreferencesSchema.optional(),
  
  // Terms and conditions
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  
  // Privacy policy
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the privacy policy"
  }),
  
  // Marketing consent (optional)
  marketingConsent: z.boolean().optional(),
  
  // Honeypot field for spam protection
  website: z.string().optional()
});

// Pricing breakdown schema
export const pricingBreakdownSchema = z.object({
  nightlyRate: z.number().min(0),
  nights: z.number().min(1),
  subtotal: z.number().min(0),
  cleaningFee: z.number().min(0),
  serviceFee: z.number().min(0),
  taxes: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().default("EUR")
});

// Reservation request schema
export const reservationRequestSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  loftId: z.string().min(1, "Loft ID is required"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1),
  guestInfo: z.object({
    primaryGuest: guestInfoSchema,
    additionalGuests: z.array(additionalGuestSchema).optional()
  }),
  pricing: pricingBreakdownSchema,
  preferences: bookingPreferencesSchema.optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
  createdAt: z.string().optional()
});

// Type exports
export type GuestInfo = z.infer<typeof guestInfoSchema>;
export type AdditionalGuest = z.infer<typeof additionalGuestSchema>;
export type BookingPreferences = z.infer<typeof bookingPreferencesSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type PricingBreakdown = z.infer<typeof pricingBreakdownSchema>;
export type ReservationRequest = z.infer<typeof reservationRequestSchema>;

// Form step type
export type BookingFormStep = 'guest-info' | 'additional-guests' | 'preferences' | 'review' | 'confirmation';

// Form validation response
export interface BookingFormValidationResponse {
  success: boolean;
  errors?: Record<string, string[]>;
  data?: BookingFormData;
}