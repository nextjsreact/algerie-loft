// Types pour l'intégration Airbnb Scraper Python v2.0.0

/**
 * Statuts de réservation Airbnb (traduits en anglais)
 */
export type AirbnbReservationStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

/**
 * Types de synchronisation
 */
export type AirbnbSyncType = 'ical_watcher' | 'targeted' | 'full' | 'manual';

/**
 * Statuts de mapping listing_id → loft_id
 */
export type MappingStatus = 'pending' | 'mapped' | 'failed';

/**
 * Statuts de validation des données
 */
export type ValidationStatus = 'pending' | 'valid' | 'invalid';

/**
 * Statuts de réconciliation avec la table reservations
 */
export type ReconciliationStatus = 'pending' | 'created' | 'updated' | 'skipped' | 'failed';

/**
 * Actions de réconciliation
 */
export type ReconciliationAction = 'create' | 'update' | 'skip';

/**
 * Réservation Airbnb reçue du script Python (format français)
 */
export interface AirbnbReservationInput {
  id: string;                    // Code confirmation Airbnb (ex: HMABCD123)
  listing_id: string;            // ID numérique Airbnb
  statut: string;                // FR: "Confirmée", "En attente", "Annulée", etc.
  voyageur: string;              // Nom du voyageur
  nb_voyageurs: number;          // Nombre de voyageurs
  date_arrivee: string;          // ISO 8601 (ex: "2026-05-20")
  date_depart: string;           // ISO 8601 (ex: "2026-05-25")
  nb_nuits: number;              // Nombre de nuits
  montant_total: number;         // Montant total
  devise: string;                // Code devise (ex: "DZD", "EUR")
  base_price?: number;           // Prix de base (optionnel)
  cleaning_fee?: number;         // Frais de ménage (optionnel)
  service_fee?: number;          // Frais de service (optionnel)
  taxes?: number;                // Taxes (optionnel)
  guest_email?: string;          // Email du voyageur (optionnel)
  guest_phone?: string;          // Téléphone du voyageur (optionnel)
  guest_nationality?: string;    // Nationalité (code pays, ex: "FR")
  special_requests?: string;     // Demandes spéciales (optionnel)
}

/**
 * Métadonnées de synchronisation
 */
export interface AirbnbSyncMetadata {
  sync_type: AirbnbSyncType;
  timestamp: string;             // ISO 8601
  script_version: string;        // Version du script Python (ex: "2.0.0")
}

/**
 * Requête de synchronisation reçue du script Python
 */
export interface AirbnbSyncRequest {
  reservations: AirbnbReservationInput[];
  sync_metadata: AirbnbSyncMetadata;
}

/**
 * Réservation Airbnb après parsing et validation
 */
export interface AirbnbReservationParsed {
  airbnb_id: string;
  listing_id: string;
  guest_name: string;
  guest_count: number;
  check_in_date: string;         // Date ISO (YYYY-MM-DD)
  check_out_date: string;        // Date ISO (YYYY-MM-DD)
  nights: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_amount: number;
  currency_code: string;
  status: AirbnbReservationStatus;
  guest_email?: string;
  guest_phone?: string;
  guest_nationality?: string;
  special_requests?: string;
}

/**
 * Entrée dans la table airbnb_reservations_staging
 */
export interface AirbnbReservationStaging extends AirbnbReservationParsed {
  id: string;                    // UUID
  raw_data: Record<string, any>; // Données JSON brutes
  loft_id?: string;              // UUID du loft (après mapping)
  mapping_status: MappingStatus;
  validation_status: ValidationStatus;
  validation_errors?: Record<string, any>;
  reservation_id?: string;       // UUID de la réservation (après réconciliation)
  reconciliation_status: ReconciliationStatus;
  reconciliation_action?: ReconciliationAction;
  reconciliation_error?: string;
  sync_type: AirbnbSyncType;
  sync_batch_id: string;         // UUID du batch
  created_at: string;
  processed_at?: string;
}

/**
 * Erreur de synchronisation
 */
export interface AirbnbSyncError {
  reservation_id: string;        // airbnb_id
  error: string;
  details?: any;
}

/**
 * Avertissement de synchronisation
 */
export interface AirbnbSyncWarning {
  reservation_id: string;        // airbnb_id
  warning: string;
  details?: any;
}

/**
 * Métriques de synchronisation
 */
export interface AirbnbSyncMetrics {
  processed: number;             // Nombre de réservations traitées
  created: number;               // Nombre de réservations créées
  updated: number;               // Nombre de réservations mises à jour
  skipped: number;               // Nombre de réservations ignorées
  failed: number;                // Nombre de réservations échouées
  conflicts: number;             // Nombre de conflits détectés
}

/**
 * Réponse de synchronisation
 */
export interface AirbnbSyncResponse {
  success: boolean;
  sync_batch_id: string;
  metrics: AirbnbSyncMetrics;
  errors: AirbnbSyncError[];
  warnings: AirbnbSyncWarning[];
}

/**
 * Log de synchronisation (table airbnb_sync_logs)
 */
export interface AirbnbSyncLog {
  id: string;                    // UUID
  sync_type: AirbnbSyncType;
  sync_batch_id: string;         // UUID
  status: 'started' | 'success' | 'partial' | 'failed';
  lofts_processed: number;
  reservations_received: number;
  reservations_created: number;
  reservations_updated: number;
  reservations_skipped: number;
  reservations_failed: number;
  conflicts_detected: number;
  errors?: Record<string, any>;
  warnings?: Record<string, any>;
  duration_ms?: number;
  started_at: string;
  completed_at?: string;
  script_version?: string;
  triggered_by?: string;         // 'cron', 'manual', 'api'
  created_at: string;
}

/**
 * Conflit de réservation (table airbnb_conflicts)
 */
export interface AirbnbConflict {
  id: string;                    // UUID
  loft_id: string;               // UUID
  reservation_1_id: string;      // UUID
  reservation_2_id: string;      // UUID
  overlap_start: string;         // Date ISO
  overlap_end: string;           // Date ISO
  overlap_nights: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  resolved_at?: string;
  resolved_by?: string;          // UUID
  resolution_notes?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Erreurs de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
