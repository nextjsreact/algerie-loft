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
    'reservations.calendar.title': 'Reservations Calendar'
  }
};

export function getReservationTranslation(key: string, lang: string = 'fr'): string {
  const translations = reservationsTranslations[lang as keyof typeof reservationsTranslations] || reservationsTranslations.fr;
  return translations[key as keyof typeof translations] || key;
}