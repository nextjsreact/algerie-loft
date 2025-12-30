// Simple translation system for reservations
export const reservationsTranslations = {
  fr: {
    'reservations.status.confirmed': 'Confirmée',
    'reservations.status.pending': 'En attente',
    'reservations.status.cancelled': 'Annulée',
    'reservations.status.completed': 'Terminée',
    'reservations.upcoming.title': 'Réservations à venir',
    'reservations.upcoming.empty': 'Aucune réservation à venir.',
    'reservations.availability.management': 'Gestion des disponibilités',
    'reservations.availability.selectLoft': 'Sélectionnez d\'abord un loft',
    'reservations.availability.reasonForBlocking': 'Raison du blocage',
    'reservations.availability.startDate': 'Date de début',
    'reservations.availability.endDate': 'Date de fin',
    'reservations.availability.priceOverride': 'Forcer le prix',
    'reservations.availability.minimumStay': 'Séjour minimum : {{count}} nuits',
    'reservations.availability.maintenance': 'Maintenance',
    'reservations.availability.renovation': 'Rénovation',
    'reservations.availability.personal': 'Usage personnel',
    'reservations.availability.blocked': 'Bloqué',
    'reservations.availability.other': 'Autre raison',
    'reservations.calendar.title': 'Calendrier des réservations'
  },
  ar: {
    'reservations.status.confirmed': 'مؤكد',
    'reservations.status.pending': 'قيد الانتظار',
    'reservations.status.cancelled': 'ملغى',
    'reservations.status.completed': 'مكتمل',
    'reservations.upcoming.title': 'الحجوزات القادمة',
    'reservations.upcoming.empty': 'لا توجد حجوزات قادمة.',
    'reservations.availability.management': 'إدارة التوافر',
    'reservations.availability.selectLoft': 'اختر شقة أولاً',
    'reservations.availability.reasonForBlocking': 'سبب الحظر',
    'reservations.availability.startDate': 'تاريخ البدء',
    'reservations.availability.endDate': 'تاريخ الانتهاء',
    'reservations.availability.priceOverride': 'تجاوز السعر',
    'reservations.availability.minimumStay': 'الحد الأدنى للإقامة: {{count}} ليالٍ',
    'reservations.availability.maintenance': 'صيانة',
    'reservations.availability.renovation': 'تجديد',
    'reservations.availability.personal': 'استخدام شخصي',
    'reservations.availability.blocked': 'محظور',
    'reservations.availability.other': 'سبب آخر',
    'reservations.calendar.title': 'تقويم الحجوزات'
  },
  en: {
    'reservations.status.confirmed': 'Confirmed',
    'reservations.status.pending': 'Pending',
    'reservations.status.cancelled': 'Cancelled',
    'reservations.status.completed': 'Completed',
    'reservations.upcoming.title': 'Upcoming Reservations',
    'reservations.upcoming.empty': 'No upcoming reservations.',
    'reservations.availability.management': 'Availability Management',
    'reservations.availability.selectLoft': 'Select a loft first',
    'reservations.availability.reasonForBlocking': 'Reason for blocking',
    'reservations.availability.startDate': 'Start Date',
    'reservations.availability.endDate': 'End Date',
    'reservations.availability.priceOverride': 'Override Price',
    'reservations.availability.minimumStay': 'Minimum stay: {{count}} nights',
    'reservations.availability.maintenance': 'Maintenance',
    'reservations.availability.renovation': 'Renovation',
    'reservations.availability.personal': 'Personal use',
    'reservations.availability.blocked': 'Blocked',
    'reservations.availability.other': 'Other reason',
    'reservations.calendar.title': 'Reservations Calendar'
  }
};

export function getReservationTranslation(key: string, lang: string = 'fr'): string {
  const translations = reservationsTranslations[lang as keyof typeof reservationsTranslations] || reservationsTranslations.fr;
  return translations[key as keyof typeof translations] || key;
}

/**
 * Maps blocked reasons to translation keys
 * @param reason - The blocked reason from the API
 * @returns The corresponding translation key
 */
export function getBlockedReasonKey(reason: string): string {
  if (!reason || !reason.trim()) return 'blocked';
  
  const normalizedReason = reason.toLowerCase().trim();
  
  switch (normalizedReason) {
    case 'maintenance':
      return 'maintenance';
    case 'renovation':
    case 'rénovation':
    case 'تجديد':
      return 'renovation';
    case 'personal':
    case 'personal_use':  // Added this - the value from the form
    case 'usage personnel':
    case 'personal use':
    case 'استخدام شخصي':
      return 'personal';
    case 'blocked':
    case 'bloqué':
    case 'محظور':
      return 'blocked';
    default:
      return 'other';
  }
}

/**
 * Formats the title for blocked events with loft name
 * @param blockedReason - The reason for blocking
 * @param loftName - The name of the loft
 * @param locale - The current locale
 * @param getTranslation - Function to get translations
 * @returns Formatted event title
 */
export function formatBlockedEventTitle(
  blockedReason: string,
  loftName: string,
  locale: string,
  getTranslation: (key: string) => string
): string {
  const reasonKey = getBlockedReasonKey(blockedReason);
  const translatedReason = getTranslation(`reservations.availability.${reasonKey}`);
  return `${translatedReason} - ${loftName}`;
}

/**
 * Safely formats event title with fallbacks for missing data
 * @param blockedReason - The reason for blocking (may be undefined)
 * @param loftName - The name of the loft (may be undefined)
 * @param loftId - The ID of the loft (fallback)
 * @param locale - The current locale
 * @param getTranslation - Function to get translations
 * @returns Safe formatted event title
 */
export function getSafeEventTitle(
  blockedReason: string | undefined,
  loftName: string | undefined,
  loftId: string,
  locale: string,
  getTranslation: (key: string) => string
): string {
  // Fallback for missing loft name - take last 4 characters after last dash
  const safeLoftName = loftName || `Loft ${loftId.split('-').pop()?.slice(-4) || loftId.slice(-4)}`;
  
  // Fallback for missing blocked reason
  const safeReason = blockedReason || 'blocked';
  
  try {
    return formatBlockedEventTitle(safeReason, safeLoftName, locale, getTranslation);
  } catch (error) {
    console.warn('Translation error for blocked event:', error);
    // Ultimate fallback - return raw values
    const reasonKey = getBlockedReasonKey(safeReason);
    const fallbackReason = getReservationTranslation(`reservations.availability.${reasonKey}`, locale);
    return `${fallbackReason} - ${safeLoftName}`;
  }
}