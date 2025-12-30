import { z } from 'zod';

// Base contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
  preferredContact: z.enum(["email", "phone"]).default("email"),
  // GDPR compliance
  consentToContact: z.boolean().refine(val => val === true, {
    message: "You must consent to being contacted"
  }),
  // Honeypot field for spam protection
  website: z.string().optional()
});

// Property inquiry form schema
export const propertyInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  propertyId: z.string().min(1, "Property selection is required"),
  propertyName: z.string().optional(), // For display purposes
  inquiryType: z.enum(["viewing", "information", "rental", "purchase", "management"]),
  message: z.string().min(10, "Please provide more details about your inquiry").max(2000, "Message is too long"),
  preferredContactTime: z.enum(["morning", "afternoon", "evening", "anytime"]).optional(),
  budget: z.string().optional(),
  moveInDate: z.string().optional(),
  consentToContact: z.boolean().refine(val => val === true, {
    message: "You must consent to being contacted"
  }),
  website: z.string().optional() // Honeypot
});

// Service inquiry form schema
export const serviceInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  serviceType: z.enum(["property_management", "rental_services", "maintenance", "consultation", "other"]),
  propertyType: z.enum(["apartment", "house", "commercial", "multiple", "other"]).optional(),
  propertyCount: z.number().min(1).max(100).optional(),
  location: z.string().optional(),
  currentSituation: z.enum(["new_owner", "current_owner", "looking_to_buy", "property_manager", "other"]).optional(),
  timeline: z.enum(["immediate", "within_month", "within_3months", "within_6months", "planning"]).optional(),
  message: z.string().min(10, "Please provide more details about your needs").max(2000, "Message is too long"),
  budget: z.string().optional(),
  consentToContact: z.boolean().refine(val => val === true, {
    message: "You must consent to being contacted"
  }),
  website: z.string().optional() // Honeypot
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  interests: z.array(z.enum(["property_tips", "market_updates", "new_properties", "company_news"])).optional(),
  consentToMarketing: z.boolean().refine(val => val === true, {
    message: "You must consent to receive marketing communications"
  }),
  website: z.string().optional() // Honeypot
});

// Quick callback request schema
export const callbackRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  preferredTime: z.enum(["morning", "afternoon", "evening"]),
  topic: z.enum(["property_management", "rental_inquiry", "general_inquiry", "other"]).optional(),
  consentToContact: z.boolean().refine(val => val === true, {
    message: "You must consent to being contacted"
  }),
  website: z.string().optional() // Honeypot
});

// Type exports
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type PropertyInquiryData = z.infer<typeof propertyInquirySchema>;
export type ServiceInquiryData = z.infer<typeof serviceInquirySchema>;
export type NewsletterData = z.infer<typeof newsletterSchema>;
export type CallbackRequestData = z.infer<typeof callbackRequestSchema>;

// Form submission response type
export interface FormSubmissionResponse {
  success: boolean;
  message: string;
  submissionId?: string;
}