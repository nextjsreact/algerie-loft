import type { AirbnbReservationStatus } from '@/lib/types/airbnb';

/**
 * Mapping des statuts français (Airbnb) vers statuts anglais (DB)
 */
const STATUS_MAP: Record<string, AirbnbReservationStatus> = {
  // Statuts confirmés (avec et sans accents)
  'Confirmée': 'confirmed',
  'Confirmé': 'confirmed',
  'Confirmee': 'confirmed',  // Sans accent
  'Confirme': 'confirmed',   // Sans accent
  'Confirmed': 'confirmed',
  'Acceptée': 'confirmed',   // Airbnb peut utiliser "Acceptée"
  'Accepte': 'confirmed',
  'Accepted': 'confirmed',
  'Réservée': 'confirmed',   // Airbnb peut utiliser "Réservée"
  'Reservee': 'confirmed',
  'Reserved': 'confirmed',
  'Booked': 'confirmed',
  
  // Statuts en attente
  'En attente': 'pending',
  'Pending': 'pending',
  'En cours': 'pending',
  'Awaiting': 'pending',
  'Demande': 'pending',      // Demande de réservation non confirmée
  'Request': 'pending',
  
  // Statuts annulés (avec et sans accents)
  'Annulée': 'cancelled',
  'Annulé': 'cancelled',
  'Annulee': 'cancelled',    // Sans accent
  'Annule': 'cancelled',     // Sans accent
  'Cancelled': 'cancelled',
  'Canceled': 'cancelled',
  
  // Statuts terminés (avec et sans accents)
  'Terminée': 'completed',
  'Terminé': 'completed',
  'Terminee': 'completed',   // Sans accent
  'Termine': 'completed',    // Sans accent
  'Completed': 'completed',
  'Finished': 'completed',
  'Passée': 'completed',     // Réservation passée
  'Passee': 'completed',
  'Past': 'completed',
  
  // ═══════════════════════════════════════════════════════════════════
  // NOUVEAUX STATUTS AIRBNB DÉTECTÉS (2026-06-08)
  // Ces statuts ont été trouvés dans airbnb_reservations_staging
  // ═══════════════════════════════════════════════════════════════════
  
  // Séjour en cours - Le client est actuellement dans le loft
  'Séjour en cours': 'confirmed',
  'Sejour en cours': 'confirmed',        // Sans accent
  'Stay in progress': 'confirmed',
  'Currently hosting': 'confirmed',
  
  // Départ aujourd'hui - Le client part aujourd'hui
  'Départ aujourd\'hui': 'confirmed',
  'Depart aujourd\'hui': 'confirmed',    // Sans accent
  'Checkout today': 'confirmed',
  'Checking out today': 'confirmed',
  
  // Séjours terminés - En attente d'avis client/hôte
  'En attente de commentaire du voyageur': 'completed',
  'Laissez un commentaire sur le voyageur': 'completed',
  'Laissez un commentaire sur le voyageur (expire bientôt)': 'completed',
  'Leave a review': 'completed',
  'Awaiting review': 'completed',
  'Write a review': 'completed',
  'Review pending': 'completed',
  
  // Anciens voyageurs - Séjours terminés il y a longtemps
  'Ancien voyageur': 'completed',
  'Past guest': 'completed',
  'Previous guest': 'completed',
  
  // Annulé par le voyageur
  'Annulée par le voyageur': 'cancelled',
  'Annule par le voyageur': 'cancelled',
  'Cancelled by guest': 'cancelled',
  
  // Modifications de voyage
  'Modification de voyage envoyée': 'confirmed',
  'Modification de voyage': 'confirmed',
  'Demande de modification de voyage': 'pending',
  'Trip modification sent': 'confirmed',
  'Trip modification requested': 'pending',
  
  // Arrivées imminentes (pour future compatibilité)
  'Arrivée aujourd\'hui': 'confirmed',
  'Arrivée demain': 'confirmed',
  'Arrivee aujourd\'hui': 'confirmed',   // Sans accent
  'Arrivee demain': 'confirmed',         // Sans accent
  'Arriving today': 'confirmed',
  'Arriving tomorrow': 'confirmed',
  'Check-in today': 'confirmed',
};

/**
 * Traduit un statut français (du script Python) en statut anglais (pour la DB)
 * 
 * @param frenchStatus - Statut en français (ex: "Confirmée", "En attente")
 * @returns Statut en anglais (ex: "confirmed", "pending")
 * 
 * @example
 * translateAirbnbStatus("Confirmée") // "confirmed"
 * translateAirbnbStatus("En attente") // "pending"
 * translateAirbnbStatus("Annulée") // "cancelled"
 * translateAirbnbStatus("Inconnu") // "confirmed" (valeur par défaut pour Airbnb car les réservations scrapées sont normalement confirmées)
 */
export function translateAirbnbStatus(frenchStatus: string): AirbnbReservationStatus {
  // Normaliser le statut (trim + première lettre en majuscule)
  const normalized = frenchStatus.trim();
  
  // Chercher dans le mapping
  const englishStatus = STATUS_MAP[normalized];
  
  if (englishStatus) {
    return englishStatus;
  }
  
  // Si statut inconnu, logger et retourner "confirmed" par défaut
  // Note: Pour Airbnb, les réservations scrapées sont normalement déjà confirmées
  // Si elles sont en attente ou annulées, Airbnb utilise des statuts spécifiques
  console.warn(`[Airbnb Status Translator] Unknown status: "${frenchStatus}". Defaulting to "confirmed" (Airbnb reservations are typically confirmed).`);
  
  return 'confirmed';
}

/**
 * Vérifie si un statut français est valide
 * 
 * @param frenchStatus - Statut en français
 * @returns true si le statut est reconnu, false sinon
 */
export function isValidAirbnbStatus(frenchStatus: string): boolean {
  const normalized = frenchStatus.trim();
  return normalized in STATUS_MAP;
}

/**
 * Retourne la liste de tous les statuts français supportés
 * 
 * @returns Liste des statuts français
 */
export function getSupportedFrenchStatuses(): string[] {
  return Object.keys(STATUS_MAP);
}

/**
 * Retourne la liste de tous les statuts anglais possibles
 * 
 * @returns Liste des statuts anglais
 */
export function getSupportedEnglishStatuses(): AirbnbReservationStatus[] {
  return ['confirmed', 'pending', 'cancelled', 'completed'];
}
