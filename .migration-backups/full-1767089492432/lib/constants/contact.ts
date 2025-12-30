/**
 * Contact Information Constants
 * Centralized contact details for the application
 */

export const CONTACT_INFO = {
  phone: {
    display: '+213 56 03 62 543',
    link: 'tel:+213560362543',
    raw: '+213560362543'
  },
  email: {
    display: 'contact@loftalgerie.com',
    link: 'mailto:contact@loftalgerie.com'
  }
} as const;

export type ContactInfo = typeof CONTACT_INFO;
