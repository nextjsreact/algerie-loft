import { z } from 'zod';

// Cookie consent schema
export const cookieConsentSchema = z.object({
  necessary: z.boolean().default(true), // Always true, cannot be disabled
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false),
  preferences: z.boolean().default(false),
  functional: z.boolean().default(false),
  timestamp: z.string().datetime().optional(),
  version: z.string().default('1.0'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

// GDPR data request schema
export const gdprDataRequestSchema = z.object({
  requestType: z.enum(['export', 'deletion', 'rectification', 'portability']),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  reason: z.string().min(10, "Please provide a reason for your request").max(500, "Reason is too long"),
  dataCategories: z.array(z.enum([
    'personal_info',
    'booking_history', 
    'payment_data',
    'communication_logs',
    'preferences',
    'analytics_data'
  ])).optional(),
  verificationMethod: z.enum(['email', 'phone', 'document']),
  consentToProcess: z.boolean().refine(val => val === true, {
    message: "You must consent to process this request"
  }),
  website: z.string().optional() // Honeypot
});

// Privacy settings schema
export const privacySettingsSchema = z.object({
  dataProcessing: z.object({
    essential: z.boolean().default(true),
    analytics: z.boolean().default(false),
    marketing: z.boolean().default(false),
    profiling: z.boolean().default(false)
  }),
  communications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(false),
    phone: z.boolean().default(false)
  }),
  dataRetention: z.object({
    bookingHistory: z.enum(['1year', '3years', '5years', 'indefinite']).default('3years'),
    communicationLogs: z.enum(['6months', '1year', '2years']).default('1year'),
    analyticsData: z.enum(['3months', '6months', '1year']).default('6months')
  }),
  dataSharing: z.object({
    partners: z.boolean().default(false),
    analytics: z.boolean().default(false),
    marketing: z.boolean().default(false)
  })
});

// Secure payment data schema
export const securePaymentSchema = z.object({
  // Card payment
  cardToken: z.string().optional(), // Tokenized card data
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.enum(['visa', 'mastercard', 'amex', 'cib']).optional(),
  
  // Mobile payment
  mobileProvider: z.enum(['mobilis', 'djezzy', 'ooredoo']).optional(),
  mobileNumber: z.string().regex(/^\+213\d{9}$/).optional(),
  
  // Bank transfer
  bankCode: z.string().optional(),
  accountMask: z.string().optional(), // Masked account number
  
  // Digital wallet
  walletProvider: z.enum(['baridimob', 'satimpay', 'paypal']).optional(),
  walletId: z.string().optional(),
  
  // Common fields
  amount: z.number().positive(),
  currency: z.enum(['DZD', 'EUR', 'USD']),
  description: z.string().max(200),
  
  // Security fields
  clientIp: z.string().ip().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  
  // Compliance
  consentToCharge: z.boolean().refine(val => val === true, {
    message: "You must consent to the charge"
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  
  website: z.string().optional() // Honeypot
});

// Data breach notification schema
export const dataBreachSchema = z.object({
  incidentId: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedDataTypes: z.array(z.enum([
    'personal_identifiers',
    'financial_data', 
    'authentication_data',
    'communication_data',
    'location_data',
    'behavioral_data'
  ])),
  affectedUsers: z.number().min(0),
  discoveredAt: z.string().datetime(),
  containedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  description: z.string().max(1000),
  mitigationSteps: z.array(z.string()),
  notificationRequired: z.boolean(),
  regulatoryReported: z.boolean().default(false)
});

// Type exports
export type CookieConsentData = z.infer<typeof cookieConsentSchema>;
export type GDPRDataRequestData = z.infer<typeof gdprDataRequestSchema>;
export type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;
export type SecurePaymentData = z.infer<typeof securePaymentSchema>;
export type DataBreachData = z.infer<typeof dataBreachSchema>;

// Cookie categories with descriptions
export const COOKIE_CATEGORIES = {
  necessary: {
    name: 'Necessary',
    description: 'Essential cookies required for the website to function properly',
    required: true,
    examples: ['Authentication', 'Security', 'Language preferences']
  },
  analytics: {
    name: 'Analytics',
    description: 'Help us understand how visitors interact with our website',
    required: false,
    examples: ['Google Analytics', 'Performance monitoring', 'Error tracking']
  },
  marketing: {
    name: 'Marketing',
    description: 'Used to track visitors and display relevant advertisements',
    required: false,
    examples: ['Facebook Pixel', 'Google Ads', 'Retargeting']
  },
  preferences: {
    name: 'Preferences',
    description: 'Remember your choices and provide enhanced features',
    required: false,
    examples: ['Theme settings', 'Layout preferences', 'Saved searches']
  },
  functional: {
    name: 'Functional',
    description: 'Enable enhanced functionality and personalization',
    required: false,
    examples: ['Chat widgets', 'Social media integration', 'Maps']
  }
} as const;

// GDPR legal bases
export const GDPR_LEGAL_BASES = {
  consent: 'Consent - You have given clear consent for us to process your personal data',
  contract: 'Contract - Processing is necessary for a contract you have with us',
  legal_obligation: 'Legal obligation - Processing is necessary for us to comply with the law',
  vital_interests: 'Vital interests - Processing is necessary to protect someone\'s life',
  public_task: 'Public task - Processing is necessary for us to perform a task in the public interest',
  legitimate_interests: 'Legitimate interests - Processing is necessary for our legitimate interests'
} as const;