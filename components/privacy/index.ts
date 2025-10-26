// Privacy and Security Components
export { CookieConsentBanner } from './cookie-consent-banner'
export { GDPRRequestForm } from './gdpr-request-form'
export { PrivacySettingsPanel } from './privacy-settings-panel'
export { SecurePaymentForm } from './secure-payment-form'

// Re-export types and schemas
export type {
  CookieConsentData,
  GDPRDataRequestData,
  PrivacySettingsData,
  SecurePaymentData,
  DataBreachData
} from '@/lib/schemas/privacy'

export {
  cookieConsentSchema,
  gdprDataRequestSchema,
  privacySettingsSchema,
  securePaymentSchema,
  dataBreachSchema,
  COOKIE_CATEGORIES,
  GDPR_LEGAL_BASES
} from '@/lib/schemas/privacy'

// Re-export services
export { PrivacyService } from '@/lib/services/privacy-service'
export { SecurePaymentService } from '@/lib/services/secure-payment-service'