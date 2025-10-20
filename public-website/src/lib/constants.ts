// Site configuration constants
export const SITE_CONFIG = {
  name: 'Loft Algérie',
  description: 'Services professionnels de gestion de lofts et hébergements en Algérie',
  url: 'https://loft-algerie.com',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/loftalgerie',
    facebook: 'https://facebook.com/loftalgerie',
    instagram: 'https://instagram.com/loftalgerie',
    linkedin: 'https://linkedin.com/company/loftalgerie',
  },
} as const;

// Contact information
export const CONTACT_INFO = {
  email: 'contact@loft-algerie.com',
  phone: '+213 XXX XX XX XX',
  address: {
    street: 'Adresse à définir',
    city: 'Alger',
    country: 'Algérie',
    postalCode: '16000',
  },
  businessHours: {
    weekdays: '09:00 - 18:00',
    saturday: '09:00 - 14:00',
    sunday: 'Fermé',
  },
} as const;

// Supported locales
export const LOCALES = ['fr', 'en', 'ar'] as const;
export const DEFAULT_LOCALE = 'fr' as const;

// Navigation menu items
export const NAVIGATION_ITEMS = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/services', labelKey: 'nav.services' },
  { href: '/portfolio', labelKey: 'nav.portfolio' },
  { href: '/about', labelKey: 'nav.about' },
  { href: '/blog', labelKey: 'nav.blog' },
  { href: '/contact', labelKey: 'nav.contact' },
] as const;

// Property types
export const PROPERTY_TYPES = [
  'apartment',
  'loft',
  'studio',
  'house',
  'villa',
] as const;

// Service categories
export const SERVICE_CATEGORIES = [
  'property-management',
  'reservation-management',
  'maintenance',
  'marketing',
  'financial-management',
] as const;

// Form validation constants
export const VALIDATION = {
  name: {
    minLength: 2,
    maxLength: 50,
  },
  email: {
    maxLength: 100,
  },
  phone: {
    minLength: 8,
    maxLength: 15,
  },
  message: {
    minLength: 10,
    maxLength: 1000,
  },
} as const;