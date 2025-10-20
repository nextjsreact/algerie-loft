// Global type definitions

export type Locale = 'fr' | 'en' | 'ar';

// Authentication types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
}

export interface AuthSession {
  user: User;
  token: string;
}

export type PropertyType = 
  | 'apartment'
  | 'loft'
  | 'studio'
  | 'house'
  | 'villa';

export type ServiceCategory = 
  | 'property-management'
  | 'reservation-management'
  | 'maintenance'
  | 'marketing'
  | 'financial-management';

// Content types
export interface Page {
  id: string;
  slug: string;
  title: Record<Locale, string>;
  content: Record<Locale, any>;
  seo: SEOData;
  publishedAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  location: {
    address: string;
    city: string;
    coordinates: [number, number];
  };
  images: ImageData[];
  features: string[];
  type: PropertyType;
  status: 'active' | 'inactive';
  order: number;
}

export interface Service {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  longDescription: Record<Locale, any>;
  icon: string;
  features: Record<Locale, string[]>;
  pricing?: PricingInfo;
  category: ServiceCategory;
  order: number;
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  propertyType?: PropertyType;
  preferredContact: 'email' | 'phone';
}

export interface ContactSubmission extends ContactFormData {
  id: string;
  source: 'contact-form' | 'property-inquiry' | 'service-inquiry';
  metadata: Record<string, any>;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  submittedAt: Date;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  locale: Locale;
  source: string;
  subscribedAt: Date;
  status: 'active' | 'unsubscribed';
}

// UI types
export interface NavigationItem {
  href: string;
  labelKey: string;
  children?: NavigationItem[];
}

export interface ImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export interface SEOData {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  keywords: Record<Locale, string[]>;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export interface PricingInfo {
  currency: string;
  amount?: number;
  type: 'fixed' | 'percentage' | 'custom';
  description: Record<Locale, string>;
}

// Analytics types
export interface PageView {
  id: string;
  path: string;
  referrer?: string;
  userAgent: string;
  locale: Locale;
  timestamp: Date;
  sessionId: string;
}

// Filter types
export interface PropertyFilter {
  type?: PropertyType[];
  city?: string[];
  features?: string[];
  search?: string;
}

export interface ServiceFilter {
  category?: ServiceCategory[];
  search?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}