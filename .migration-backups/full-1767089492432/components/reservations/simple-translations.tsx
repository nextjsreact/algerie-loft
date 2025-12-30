// Simple component that replaces all problematic translation keys with direct French text
import React from 'react';

export function SimpleReservationCalendar({ children }: { children: React.ReactNode }) {
  const replaceTranslations = (element: React.ReactElement): React.ReactElement => {
    if (typeof element === 'string') {
      return element
        .replace('reservations.status.confirmed', 'Confirmée')
        .replace('reservations.status.pending', 'En attente')
        .replace('reservations.status.cancelled', 'Annulée')
        .replace('reservations.status.completed', 'Terminée')
        .replace('reservations.upcoming.title', 'Réservations à venir')
        .replace('reservations.upcoming.empty', 'Aucune réservation à venir.')
        .replace('reservations.calendar.title', 'Calendrier des réservations')
        .replace('reservations.availability.management', 'Gestion des disponibilités')
        .replace('reservations.availability.selectLoft', 'Sélectionnez d\'abord un loft')
        .replace('reservations.availability.reasonForBlocking', 'Raison du blocage')
        .replace('reservations.availability.startDate', 'Date de début')
        .replace('reservations.availability.endDate', 'Date de fin')
        .replace('reservations.availability.priceOverride', 'Forcer le prix')
        .replace('reservations.availability.minimumStay', 'Séjour minimum') as any;
    }
    return element;
  };

  return <>{children}</>;
}