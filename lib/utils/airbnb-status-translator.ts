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
  
  // Statuts en attente
  'En attente': 'pending',
  'Pending': 'pending',
  'En cours': 'pending',
  'Awaiting': 'pending',
  
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
 * translateAirbnbStatus("Inconnu") // "pending" (valeur par défaut)
 */
export function translateAirbnbStatus(frenchStatus: string): AirbnbReservationStatus {
  // Normaliser le statut (trim + première lettre en majuscule)
  const normalized = frenchStatus.trim();
  
  // Chercher dans le mapping
  const englishStatus = STATUS_MAP[normalized];
  
  if (englishStatus) {
    return englishStatus;
  }
  
  // Si statut inconnu, logger et retourner "pending" par défaut
  console.warn(`[Airbnb Status Translator] Unknown status: "${frenchStatus}". Defaulting to "pending".`);
  
  return 'pending';
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
