// Main reservation flow components
export { ReservationEntry } from './reservation-entry'
export { ReservationPage } from './reservation-page'
export { MobileReservationWrapper } from './mobile-reservation-wrapper'

// Error handling and feedback
export { ReservationErrorBoundary } from './reservation-error-boundary'
export { 
  UserFeedbackSystem, 
  useReservationFeedback, 
  usePerformanceFeedback, 
  useAccessibilityFeedback,
  feedbackSystem 
} from './user-feedback-system'

// Existing components (re-exported for convenience)
export { BookingForm } from './booking-form'
export { ConfirmationPage } from './confirmation-page'

// Types
export type { ReservationRequest, PricingBreakdown } from '@/lib/schemas/booking'
export type { SearchCriteria, LoftSearchResult } from '@/lib/services/loft'
export type { ClientAuthSession } from '@/lib/types/client-auth'