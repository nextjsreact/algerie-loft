# Requirements Document - Système de Synchronisation de Réservations Airbnb

## Introduction

Ce document définit les exigences pour un système de synchronisation automatique de réservations Airbnb destiné à remplacer Beds24 pour la gestion de 85 propriétés existantes. Le système utilise une architecture hybride à 3 niveaux (iCal automatique, Playwright CSV automatique, CSV manuel) pour synchroniser les calendriers, détecter les conflits de réservation, et fournir un calendrier unifié tout en s'intégrant dans l'infrastructure existante (Next.js 14, Supabase, Vercel).

## Glossary

- **Sync_Engine**: Le moteur de synchronisation qui orchestre la récupération des données depuis Airbnb
- **iCal_Fetcher**: Le composant qui récupère et parse les flux iCal Airbnb toutes les 30 minutes
- **Playwright_CSV_Exporter**: Le service basé sur Playwright qui se connecte à Airbnb, exporte le CSV des réservations, et le parse automatiquement
- **CSV_Parser**: Le composant qui parse les fichiers CSV Airbnb et extrait les détails complets des réservations
- **Reservation_Matcher**: Le système de matching intelligent qui associe les réservations iCal (dates uniquement) avec les lignes CSV (détails complets)
- **Conflict_Detector**: Le système de détection automatique des chevauchements de dates entre réservations
- **Property_Store**: Le référentiel en lecture seule des 85 propriétés existantes avec leurs iCal URLs
- **Booking_Repository**: Le référentiel centralisé des réservations dans Supabase
- **Alert_Service**: Le service d'envoi d'alertes email via Resend
- **Unified_Calendar**: Le calendrier consolidé affichant toutes les réservations Airbnb
- **Manual_Import_Service**: Le service d'import manuel de fichiers CSV via l'interface admin
- **Sync_Logger**: Le système de logging et monitoring des synchronisations
- **Cron_Scheduler**: Le planificateur de tâches automatiques via Vercel Cron Jobs (iCal toutes les 30 minutes)
- **GitHub_Actions_Runner**: L'environnement d'exécution du Playwright CSV export sur GitHub Actions (1x/jour à 3h)
- **Rate_Limiter**: Le composant qui gère les délais entre requêtes pour respecter les limites des APIs
- **Batch_Processor**: Le processeur qui divise les opérations longues en lots pour respecter le timeout Vercel de 30 secondes
- **RLS_Policy**: Les politiques de sécurité Row Level Security de Supabase
- **Sync_Now_Trigger**: Le bouton admin qui force une synchronisation iCal immédiate
- **Playwright_Toggle**: Le flag de configuration qui active/désactive le Playwright CSV export automatique
- **Valid_Reservation**: Une réservation avec dates de début et fin valides (début < fin, dates futures ou présentes)
- **Overlapping_Reservations**: Deux réservations pour la même propriété dont les périodes se chevauchent
- **Partial_Reservation**: Une réservation créée par iCal contenant uniquement les dates bloquées (sans détails clients)
- **Complete_Reservation**: Une réservation enrichie par CSV contenant les détails clients (nom, email, téléphone, montant)
- **Sync_Cycle**: Une exécution complète du processus de synchronisation
- **Critical_Conflict**: Un chevauchement de dates détecté entre deux réservations confirmées

## Requirements

### Requirement 1: Synchronisation iCal Airbnb Automatique (Niveau 1 - CRITIQUE)

**User Story:** En tant que gestionnaire de propriétés, je veux synchroniser automatiquement les calendriers Airbnb via iCal toutes les 30 minutes, afin de maintenir les dates bloquées à jour sans intervention manuelle et sans risque.

#### Acceptance Criteria

1. THE Cron_Scheduler SHALL trigger iCal synchronization every 30 minutes via Vercel Cron Jobs
2. WHEN a Sync_Cycle is triggered, THE Batch_Processor SHALL divide the 85 properties into batches of 20 properties, processing each batch within 25 seconds
3. WHEN an iCal feed is retrieved, THE iCal_Fetcher SHALL parse the VEVENT entries and extract check-in date, check-out date, and booking UID
4. WHEN parsing completes, THE Booking_Repository SHALL create Partial_Reservation records with source set to "airbnb_ical" and status set to "confirmed"
5. WHEN a synchronization fails for a property, THE Sync_Logger SHALL log the error with property ID and error details
6. FOR ALL valid iCal feeds, parsing then storing then retrieving SHALL produce reservations with identical date ranges (round-trip property)

### Requirement 2: Export CSV Playwright Automatique (Niveau 2 - AUTOMATIQUE)

**User Story:** En tant que gestionnaire de propriétés, je veux extraire automatiquement les détails complets des réservations Airbnb via export CSV quotidien, afin d'avoir toutes les informations clients nécessaires sans intervention manuelle.

#### Acceptance Criteria

1. THE GitHub_Actions_Runner SHALL execute the Playwright_CSV_Exporter daily at 3:00 AM UTC
2. WHEN the Playwright_CSV_Exporter executes, THE Playwright_CSV_Exporter SHALL authenticate to Airbnb using stored credentials
3. WHEN authentication succeeds, THE Playwright_CSV_Exporter SHALL navigate to the reservations export page and trigger CSV download
4. WHEN CSV download completes, THE CSV_Parser SHALL parse the file and extract guest name, email, phone, amount, currency, check-in date, check-out date, and property ID
5. WHEN parsing completes, THE Reservation_Matcher SHALL match CSV entries with existing Partial_Reservation records
6. WHEN a match is found, THE Booking_Repository SHALL update the reservation with complete guest details to create a Complete_Reservation
7. WHEN authentication fails after 3 retry attempts, THE Playwright_CSV_Exporter SHALL send an alert via the Alert_Service
8. WHEN the Playwright_Toggle is set to false, THE GitHub_Actions_Runner SHALL skip the Playwright_CSV_Exporter execution
9. THE Sync_Logger SHALL record the number of CSV entries processed, matched, and unmatched

### Requirement 3: Matching Automatique iCal ↔ CSV (CRITIQUE)

**User Story:** En tant que système, je veux matcher automatiquement les réservations iCal avec les lignes CSV, afin de fusionner les dates bloquées avec les détails clients et éviter les doublons.

#### Acceptance Criteria

1. WHEN a CSV entry is parsed, THE Reservation_Matcher SHALL search for existing Partial_Reservation records matching property_id, check_in_date, and check_out_date
2. WHEN a match is found with exact date match (check_in and check_out identical), THE Reservation_Matcher SHALL update the existing reservation with CSV details
3. WHEN a match is found where check_in differs by ≤1 day AND check_out differs by ≤1 day, THE Reservation_Matcher SHALL flag the match as "fuzzy" and log it for manual review
4. WHEN no match is found, THE Reservation_Matcher SHALL create a new Complete_Reservation from the CSV data with source "airbnb_csv" and flag "csv_only"
5. WHEN multiple iCal reservations match a single CSV entry, THE Reservation_Matcher SHALL flag a conflict and alert via the Alert_Service
6. FOR ALL CSV entries, the number of created reservations plus updated reservations SHALL equal the total number of CSV entries (invariant property)

### Requirement 4: Gestion des Propriétés Existantes (Lecture Seule)

**User Story:** En tant qu'administrateur, je veux configurer les iCal URLs pour les 85 propriétés existantes, afin de permettre la synchronisation automatique sans modifier les données des propriétés.

#### Acceptance Criteria

1. THE Property_Store SHALL read property records from the existing properties table with unique ID and name
2. THE Property_Store SHALL store iCal URLs for Airbnb in a separate configuration table (property_sync_config)
3. WHEN an iCal URL is added or updated, THE Property_Store SHALL validate that the URL is a valid HTTPS URL
4. WHEN a property has no iCal URL configured, THE Sync_Engine SHALL skip it during synchronization
5. THE Property_Store SHALL provide a read-only list view displaying all 85 properties with their sync configuration status
6. THE Property_Store SHALL NOT allow creation, deletion, or modification of property core data (name, address, etc.)

### Requirement 5: Stockage Centralisé des Réservations

**User Story:** En tant que système, je veux stocker toutes les réservations dans une base de données centralisée, afin de permettre l'analyse et la détection de conflits.

#### Acceptance Criteria

1. THE Booking_Repository SHALL store reservations with property ID, source (airbnb_ical, airbnb_csv, manual), status (confirmed, cancelled, pending), check-in date, check-out date, guest details (nullable), amount (nullable), and currency (nullable)
2. WHEN a reservation is created, THE Booking_Repository SHALL validate that check-in date is before check-out date
3. WHEN a reservation is created, THE Booking_Repository SHALL validate that check-in date is not in the past by more than 30 days
4. THE Booking_Repository SHALL enforce unique constraint on (property_id, check_in_date, check_out_date) to prevent duplicate reservations regardless of source
5. WHEN a reservation is updated from Partial_Reservation to Complete_Reservation, THE Booking_Repository SHALL preserve the original creation timestamp and update the source to "airbnb_csv"
6. FOR ALL stored reservations, check_in_date SHALL be less than check_out_date (invariant property)

### Requirement 6: Détection Automatique des Conflits (CRITIQUE)

**User Story:** En tant que gestionnaire de propriétés, je veux détecter automatiquement les chevauchements de dates entre réservations, afin d'éviter les doubles réservations.

#### Acceptance Criteria

1. WHEN a new reservation is created or updated, THE Conflict_Detector SHALL check for overlapping date ranges with existing confirmed reservations for the same property
2. WHEN overlapping reservations are detected, THE Conflict_Detector SHALL create a conflict record with severity "critical" if both reservations are confirmed
3. WHEN a Critical_Conflict is detected, THE Alert_Service SHALL send an email notification within 60 seconds
4. THE Conflict_Detector SHALL identify overlaps using the logic: (new_checkin < existing_checkout) AND (new_checkout > existing_checkin)
5. WHEN a reservation is cancelled, THE Conflict_Detector SHALL re-evaluate all conflicts involving that reservation and mark them as resolved
6. FOR ALL pairs of non-overlapping reservations for the same property, applying the overlap detection logic SHALL return false (model-based testing against known non-overlapping cases)

### Requirement 7: Système d'Alertes Email

**User Story:** En tant que gestionnaire de propriétés, je veux recevoir des alertes email pour les conflits critiques et les échecs de synchronisation, afin de pouvoir intervenir rapidement.

#### Acceptance Criteria

1. WHEN a Critical_Conflict is detected, THE Alert_Service SHALL send an email via Resend API to the configured admin email
2. THE Alert_Service SHALL include in the email: property name, conflicting reservation details, dates, and sources
3. WHEN the Playwright_CSV_Exporter fails for 3 consecutive days, THE Alert_Service SHALL send an alert email
4. WHEN the Resend API returns an error, THE Alert_Service SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
5. WHEN all retry attempts fail, THE Sync_Logger SHALL log the alert failure with severity "error"
6. WHEN multiple conflicts are detected in the same Sync_Cycle, THE Alert_Service SHALL batch them into a single email

### Requirement 8: Calendrier Unifié Simplifié

**User Story:** En tant que gestionnaire de propriétés, je veux visualiser toutes les réservations Airbnb dans un calendrier mensuel simple, afin d'avoir une vue d'ensemble de l'occupation.

#### Acceptance Criteria

1. THE Unified_Calendar SHALL display all confirmed reservations from Airbnb in a monthly view
2. THE Unified_Calendar SHALL color-code reservations by completeness: blue for Complete_Reservation, light blue for Partial_Reservation
3. WHEN a user selects a property filter, THE Unified_Calendar SHALL display only reservations for the selected properties
4. THE Unified_Calendar SHALL display conflict indicators on dates with Overlapping_Reservations
5. WHEN a reservation is clicked, THE Unified_Calendar SHALL display a modal with full reservation details including guest information if available
6. THE Unified_Calendar SHALL allow navigation between months using previous/next buttons

### Requirement 9: Import CSV Manuel (Niveau 3 - BACKUP)

**User Story:** En tant qu'administrateur, je veux importer manuellement des réservations depuis des fichiers CSV Airbnb, afin d'avoir une solution de secours si le Playwright automatique est désactivé ou échoue.

#### Acceptance Criteria

1. THE Manual_Import_Service SHALL provide an admin page with a file upload button labeled "Upload CSV"
2. THE Manual_Import_Service SHALL accept CSV files in Airbnb export format with columns: property_id, check_in, check_out, guest_name, guest_email, guest_phone, amount, currency, status
3. WHEN a file is uploaded, THE Manual_Import_Service SHALL validate all required fields are present
4. WHEN validation succeeds, THE CSV_Parser SHALL parse the file and THE Reservation_Matcher SHALL match entries with existing reservations
5. WHEN validation fails, THE Manual_Import_Service SHALL return a detailed error report with line numbers and field names
6. THE Manual_Import_Service SHALL support batch imports of up to 1000 reservations per file
7. FOR ALL valid CSV files, importing then exporting then importing SHALL produce the same reservation records (round-trip property)

### Requirement 10: Bouton "Sync Now" Manuel

**User Story:** En tant qu'administrateur, je veux forcer une synchronisation iCal immédiate, afin de mettre à jour les réservations sans attendre le prochain cycle automatique.

#### Acceptance Criteria

1. THE Unified_Calendar SHALL provide an admin button labeled "Synchroniser maintenant"
2. WHEN the button is clicked, THE Sync_Engine SHALL trigger an immediate iCal synchronization for all properties
3. WHEN synchronization starts, THE Unified_Calendar SHALL display a loading indicator
4. WHEN synchronization completes, THE Unified_Calendar SHALL display a success message with the number of properties synced
5. WHEN synchronization fails, THE Unified_Calendar SHALL display an error message with details
6. THE Sync_Now_Trigger SHALL enforce a minimum delay of 10 minutes between manual sync requests, OR allow immediate sync if the last sync was automatic (cron)

### Requirement 11: Export des Données

**User Story:** En tant qu'administrateur, je veux exporter toutes les réservations en CSV, afin de créer des backups et analyser les données dans des outils externes.

#### Acceptance Criteria

1. THE Manual_Import_Service SHALL provide an export function that generates CSV files with all reservation data
2. WHEN export is triggered, THE Manual_Import_Service SHALL include all reservations matching the selected filters (date range, property)
3. THE Manual_Import_Service SHALL generate exports within 30 seconds for up to 10,000 reservations
4. WHEN export completes, THE Manual_Import_Service SHALL provide a download link valid for 24 hours
5. THE Manual_Import_Service SHALL include columns: property_id, property_name, source, check_in, check_out, guest_name, guest_email, guest_phone, amount, currency, status
6. FOR ALL exported CSV files, the number of rows SHALL equal the number of reservations in the filtered dataset (invariant property)

### Requirement 12: Logging et Monitoring

**User Story:** En tant qu'administrateur, je veux consulter l'historique de toutes les synchronisations avec leurs statuts et métriques, afin de diagnostiquer les problèmes et monitorer la santé du système.

#### Acceptance Criteria

1. THE Sync_Logger SHALL record each Sync_Cycle with timestamp, type (ical_auto, csv_auto, manual), status (success, error, partial), duration, and metrics
2. THE Sync_Logger SHALL record metrics including: properties_synced, bookings_created, bookings_updated, csv_matched, csv_unmatched, conflicts_detected, errors_count
3. WHEN a sync error occurs, THE Sync_Logger SHALL store the error message, stack trace, and affected property ID
4. THE Sync_Logger SHALL provide a dashboard view displaying sync history for the last 30 days
5. THE Sync_Logger SHALL calculate and display success rate percentage for each sync type
6. WHEN the Playwright_CSV_Exporter fails for 3 consecutive days, THE Sync_Logger SHALL flag it as "needs attention"

### Requirement 13: Sécurité des Routes Cron

**User Story:** En tant qu'administrateur système, je veux protéger les routes cron avec un token secret, afin d'empêcher les exécutions non autorisées.

#### Acceptance Criteria

1. THE Cron_Scheduler SHALL validate the presence of a secret token in the Authorization header for all cron endpoints
2. WHEN the token is missing or invalid, THE Cron_Scheduler SHALL return HTTP 401 Unauthorized
3. WHEN the token is valid, THE Cron_Scheduler SHALL execute the requested synchronization
4. THE Cron_Scheduler SHALL use a token stored in Vercel environment variables
5. THE Cron_Scheduler SHALL log all authentication attempts with IP address and timestamp
6. WHEN more than 5 failed authentication attempts occur from the same IP within 1 hour, THE Cron_Scheduler SHALL temporarily block that IP

### Requirement 14: Row Level Security Supabase

**User Story:** En tant qu'administrateur système, je veux appliquer des politiques RLS sur toutes les tables, afin de garantir que les utilisateurs ne peuvent accéder qu'à leurs données autorisées.

#### Acceptance Criteria

1. THE RLS_Policy SHALL enforce that users can only read reservations for properties they have access to
2. THE RLS_Policy SHALL enforce that only authenticated users can view reservations
3. THE RLS_Policy SHALL enforce that only admin users can manually import or delete reservations
4. THE RLS_Policy SHALL enforce that system service accounts can bypass RLS for sync operations
5. WHEN an unauthorized access attempt occurs, THE RLS_Policy SHALL deny the operation and log the attempt
6. THE RLS_Policy SHALL be enabled on all tables: properties, reservations, conflicts, sync_logs, property_sync_config

### Requirement 15: Gestion du Rate Limiting

**User Story:** En tant que système, je veux respecter les limites de taux des APIs externes, afin d'éviter les blocages et bans.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a minimum delay of 5 seconds between Playwright_CSV_Exporter page navigations
2. THE Rate_Limiter SHALL enforce a maximum of 100 iCal fetches per minute
3. WHEN a rate limit is reached, THE Rate_Limiter SHALL queue pending requests and process them after the cooldown period
4. THE Rate_Limiter SHALL track request counts per API endpoint using a sliding window of 60 seconds
5. WHEN rate limiting is active, THE Sync_Logger SHALL log the number of queued requests
6. THE Rate_Limiter SHALL introduce random delays between 5 and 15 seconds during Playwright operations

### Requirement 16: Batch Processing pour Timeout Vercel

**User Story:** En tant que système, je veux diviser les opérations longues en lots, afin de respecter la limite de timeout de 30 secondes de Vercel.

#### Acceptance Criteria

1. WHEN synchronizing more than 20 properties, THE Batch_Processor SHALL divide the operation into batches of 20 properties
2. THE Batch_Processor SHALL process each batch within 25 seconds to maintain a safety margin
3. WHEN a batch completes, THE Batch_Processor SHALL commit the results to the Booking_Repository before starting the next batch
4. WHEN a batch fails, THE Batch_Processor SHALL continue processing remaining batches
5. THE Batch_Processor SHALL track progress across batches and report cumulative metrics
6. FOR ALL batch operations, the total number of processed items SHALL equal the sum of items in each batch (invariant property)

### Requirement 17: Stratégie de Mitigation pour Playwright CSV Export

**User Story:** En tant qu'administrateur système, je veux minimiser le risque de ban lors de l'export CSV Airbnb, afin de maintenir l'accès aux données.

#### Acceptance Criteria

1. THE Playwright_CSV_Exporter SHALL execute only once per day at 3:00 AM UTC (low-traffic hours)
2. THE Playwright_CSV_Exporter SHALL use the real user account credentials (not a bot account)
3. THE Playwright_CSV_Exporter SHALL randomize user agent strings for each session
4. THE Playwright_CSV_Exporter SHALL introduce random delays between 5 and 15 seconds between page navigations
5. THE Playwright_CSV_Exporter SHALL execute from GitHub Actions (different IP from main application)
6. WHEN a CAPTCHA is detected, THE Playwright_CSV_Exporter SHALL pause execution and send an alert via the Alert_Service
7. THE Playwright_Toggle SHALL allow administrators to disable Playwright execution if issues arise

### Requirement 18: Gestion du Flag Playwright Toggle

**User Story:** En tant qu'administrateur, je veux activer ou désactiver le Playwright CSV export automatique, afin de contrôler le risque et utiliser le fallback manuel si nécessaire.

#### Acceptance Criteria

1. THE Playwright_Toggle SHALL be stored in the system settings table with default value true
2. THE Playwright_Toggle SHALL be editable via the admin settings page
3. WHEN the Playwright_Toggle is set to false, THE GitHub_Actions_Runner SHALL call the API endpoint /api/settings/playwright-toggle to check the state and skip execution if disabled
4. WHEN the Playwright_Toggle is set to false, THE Unified_Calendar SHALL display a warning message indicating manual CSV import is required
5. WHEN the Playwright_Toggle changes state, THE Sync_Logger SHALL log the change with timestamp and user ID
6. THE GitHub_Actions_Runner SHALL authenticate to the API endpoint using a secret token stored in GitHub Secrets

### Requirement 19: Gestion des Devises Multiples

**User Story:** En tant que gestionnaire de propriétés international, je veux stocker les montants dans leur devise d'origine, afin de maintenir la précision financière.

#### Acceptance Criteria

1. THE Booking_Repository SHALL store reservation amounts with their original currency code (EUR, USD, DZD, etc.)
2. WHEN displaying amounts in the Unified_Calendar, THE Unified_Calendar SHALL show the original currency
3. THE Booking_Repository SHALL support all ISO 4217 currency codes
4. WHEN exporting data, THE Manual_Import_Service SHALL include currency codes in the export
5. THE Booking_Repository SHALL store amounts as decimal values with 2 decimal places precision
6. FOR ALL stored amounts, the precision SHALL be maintained at 2 decimal places (invariant property)

### Requirement 20: Gestion des Statuts de Réservation

**User Story:** En tant que gestionnaire de propriétés, je veux suivre les changements de statut des réservations (confirmée, annulée, en attente), afin de maintenir un calendrier précis.

#### Acceptance Criteria

1. THE Booking_Repository SHALL support statuses: confirmed, cancelled, pending, checked_in, checked_out
2. WHEN a reservation status changes from confirmed to cancelled, THE Conflict_Detector SHALL re-evaluate conflicts
3. WHEN a reservation is cancelled, THE Unified_Calendar SHALL display it with a strikethrough style
4. THE Booking_Repository SHALL record status change history with timestamp and previous status
5. WHEN filtering reservations, THE Unified_Calendar SHALL allow filtering by status
6. THE Conflict_Detector SHALL only consider confirmed and checked_in reservations for conflict detection

### Requirement 21: Gestion des Credentials Sécurisés

**User Story:** En tant qu'administrateur système, je veux stocker tous les credentials de manière sécurisée, afin de protéger les accès au compte Airbnb.

#### Acceptance Criteria

1. THE Sync_Engine SHALL retrieve Airbnb credentials from GitHub Secrets for the Playwright_CSV_Exporter
2. THE Sync_Engine SHALL retrieve API keys and tokens from Vercel environment variables
3. THE Sync_Engine SHALL retrieve database credentials from Supabase environment variables
4. THE Sync_Engine SHALL never log credentials in plain text
5. WHEN credentials are invalid, THE Sync_Engine SHALL send an alert without exposing the credential values
6. THE Sync_Engine SHALL support credential rotation without code changes

### Requirement 22: Parsing iCal avec Pretty Printer

**User Story:** En tant que développeur, je veux parser et formater les flux iCal correctement, afin de garantir l'interopérabilité avec Airbnb.

#### Acceptance Criteria

1. WHEN an iCal feed is received, THE iCal_Fetcher SHALL parse VCALENDAR, VEVENT, DTSTART, DTEND, SUMMARY, and UID properties
2. THE iCal_Fetcher SHALL handle timezone information in DTSTART and DTEND
3. THE iCal_Fetcher SHALL provide a pretty printer that formats reservation data back into valid iCal format
4. FOR ALL valid iCal feeds, parsing then pretty-printing then parsing SHALL produce equivalent reservation data (round-trip property)
5. WHEN an iCal feed contains invalid syntax, THE iCal_Fetcher SHALL log the error with the problematic line
6. THE iCal_Fetcher SHALL support iCal version 2.0 as defined in RFC 5545

### Requirement 23: Parsing CSV Airbnb avec Pretty Printer

**User Story:** En tant que développeur, je veux parser et formater les fichiers CSV Airbnb correctement, afin de garantir l'import/export fiable des données.

#### Acceptance Criteria

1. WHEN a CSV file is received, THE CSV_Parser SHALL parse all columns in Airbnb export format
2. THE CSV_Parser SHALL handle quoted fields, escaped commas, and multi-line values
3. THE CSV_Parser SHALL provide a pretty printer that formats reservation data back into valid CSV format
4. FOR ALL valid CSV files, parsing then pretty-printing then parsing SHALL produce equivalent reservation data (round-trip property)
5. WHEN a CSV file contains invalid syntax, THE CSV_Parser SHALL log the error with the problematic line number
6. THE CSV_Parser SHALL support UTF-8 encoding for international characters
7. THE CSV_Parser SHALL map "Listing Name" from Airbnb CSV to property_id by matching against the properties table name field

### Requirement 24: Ordre d'Exécution et Orchestration des Composants (CRITIQUE)

**User Story:** En tant que système, je veux exécuter les composants de synchronisation dans un ordre déterministe, afin de garantir la cohérence des données et éviter les conditions de course.

#### Acceptance Criteria

1. WHEN the iCal_Fetcher completes parsing, THE Booking_Repository SHALL commit all Partial_Reservation records before any other component accesses them
2. WHEN the Playwright_CSV_Exporter completes CSV download, THE CSV_Parser SHALL execute immediately and atomically
3. WHEN the CSV_Parser completes, THE Reservation_Matcher SHALL execute AFTER all CSV entries are parsed
4. WHEN the Reservation_Matcher completes updates, THE Conflict_Detector SHALL execute AFTER all reservation updates are committed
5. WHEN the Conflict_Detector identifies conflicts, THE Alert_Service SHALL execute AFTER all conflict records are created
6. THE Sync_Engine SHALL ensure that iCal sync and CSV sync do NOT execute concurrently for the same property to prevent race conditions
7. WHEN a component fails, THE Sync_Engine SHALL rollback all changes made in the current Sync_Cycle and log the failure
8. FOR ALL Sync_Cycles, the execution order SHALL be: iCal_Fetcher → Booking_Repository → CSV_Parser → Reservation_Matcher → Conflict_Detector → Alert_Service (pipeline invariant)

### Requirement 25: Gestion des Cas Limites et Erreurs

**User Story:** En tant que système, je veux gérer correctement les cas limites et erreurs, afin de maintenir la cohérence des données même en cas de problèmes.

#### Acceptance Criteria

1. WHEN the Playwright_CSV_Exporter downloads a CSV with 0 reservations, THE Sync_Logger SHALL log it as "success" with a warning flag "empty_csv"
2. WHEN a CSV with 0 reservations is processed, THE Booking_Repository SHALL NOT delete existing reservations
3. WHEN the iCal_Fetcher receives an HTTP 404 for a property's iCal URL, THE Sync_Logger SHALL log it as "property_ical_not_found" and continue with other properties
4. WHEN the Reservation_Matcher finds a CSV entry that creates a new reservation (no iCal match), THE Booking_Repository SHALL mark it with source "airbnb_csv" and flag "csv_only" for future iCal matching
5. WHEN network errors occur during iCal fetch, THE Sync_Engine SHALL retry up to 3 times with exponential backoff (2s, 4s, 8s) before marking the property as failed
6. WHEN the Booking_Repository detects a duplicate reservation attempt, THE Sync_Engine SHALL log it as "duplicate_skipped" and continue processing
7. WHEN the Conflict_Detector runs AFTER Reservation_Matcher completes, THE Conflict_Detector SHALL use the most up-to-date reservation data including CSV enrichments

## Notes Techniques

### Architecture Hybride à 3 Niveaux

**Niveau 1 - iCal Automatique (CRITIQUE, SAFE):**
- Sync toutes les 30 minutes via Vercel Cron
- Récupère dates bloquées uniquement
- Crée réservations "partielles" (sans détails clients)
- Zéro risque, toujours actif
- Fallback fiable si autres niveaux échouent

**Niveau 2 - Playwright CSV Automatique (AUTOMATIQUE, RISQUE CONTRÔLÉ):**
- GitHub Actions 1x/jour à 3h du matin
- Login Airbnb → Export CSV → Parse → Push Supabase
- Récupère détails complets (nom, email, téléphone, montant)
- Matche automatiquement avec réservations iCal existantes
- Complète les détails clients
- Désactivable via Playwright_Toggle si problème

**Niveau 3 - CSV Manuel (BACKUP, ZÉRO RISQUE):**
- Page admin avec bouton "Upload CSV"
- Import manuel si Playwright désactivé
- Toujours disponible comme fallback
- Utilise le même CSV_Parser et Reservation_Matcher

### Priorités d'Implémentation

1. **CRITIQUE**: 
   - Synchronisation iCal (Requirement 1) - Safe, automatique, base du système
   - Détection de conflits (Requirement 6) - Évite les doubles réservations
   - Matching iCal ↔ CSV (Requirement 3) - Fusion intelligente des données
   - Ordre d'exécution (Requirement 24) - Garantit la cohérence des données

2. **HAUTE**: 
   - Playwright CSV export (Requirement 2) - Automatise l'obtention des détails clients
   - Import CSV manuel (Requirement 9) - Solution de secours
   - Calendrier unifié (Requirement 8) - Interface principale
   - Bouton Sync Now (Requirement 10) - Contrôle manuel
   - Gestion cas limites (Requirement 25) - Robustesse du système

3. **MOYENNE**: 
   - Logging (Requirement 12) - Monitoring et diagnostics
   - Gestion Playwright Toggle (Requirement 18) - Contrôle du risque
   - Alertes email (Requirement 7) - Notifications critiques

4. **BASSE**: 
   - Export données (Requirement 11) - Backup et analyse
   - Parsing avec pretty printers (Requirements 22, 23) - Qualité du code

### Contraintes Techniques

- **Vercel Serverless**: Timeout 30 secondes → Batch processing obligatoire (Requirement 16)
- **Playwright sur GitHub Actions**: Pas d'exécution locale → Configuration CI/CD (Requirement 2)
- **Rate Limiting**: Respecter les limites APIs → Rate limiter (Requirement 15)
- **Scraping Airbnb**: Risque de ban → Stratégies de mitigation (Requirement 17)
- **85 Propriétés Existantes**: Mode lecture seule, pas de CRUD (Requirement 4)

### Fréquences de Synchronisation

- **iCal**: Toutes les 30 minutes (Vercel Cron) - Automatique, toujours actif
- **Playwright CSV**: 1x/jour à 3h du matin (GitHub Actions) - Automatique, désactivable
- **CSV Manuel**: À la demande (bouton admin) - Manuel, toujours disponible
- **Sync Now**: À la demande (bouton admin) - Manuel, minimum 5 minutes entre requêtes

### Mitigation Risque Playwright

- 1x/jour seulement (pas agressif)
- 3h du matin (heure creuse)
- Compte réel utilisateur (pas bot account)
- Délais aléatoires 5-15 secondes
- User-agent réaliste
- GitHub Actions (IP différente de l'application)
- Fallback iCal si problème
- Désactivable via Playwright_Toggle
- Alerte si échec 3 jours consécutifs

### ROI Business

- **Économies**: €3,060-5,100/an (coût Beds24 évité)
- **Contrôle**: Données propriétaires, personnalisation complète
- **Scalabilité**: Infrastructure existante (Supabase, Vercel) déjà payée
- **Risque**: Faible, essai Beds24 non encore payé
- **Focus**: Airbnb uniquement (85 propriétés)

### Property-Based Testing Focus

Les requirements suivants incluent des propriétés de correctness testables:

- **Round-trip properties**: Requirements 1, 9, 22, 23 (parsing/serialization iCal et CSV)
- **Invariant properties**: Requirements 3, 5, 6, 11, 16, 19, 24 (contraintes préservées)
- **Model-based testing**: Requirement 6 (détection de conflits vs cas connus)
- **Pipeline invariant**: Requirement 24 (ordre d'exécution déterministe)

Ces propriétés doivent être implémentées comme tests automatisés pour garantir la correctness du système.

### Simplifications par Rapport à la Version Initiale

**Retiré:**
- Booking.com (iCal et XML API)
- Webhooks (Airbnb n'a pas d'API)
- Dashboard métriques complexe (trop pour MVP)
- Notification fin essai Beds24 (pas pertinent)
- Vues multiples calendrier (garde vue mensuelle uniquement)
- Alertes SMS/Slack (email uniquement)

**Ajouté:**
- Architecture hybride à 3 niveaux
- Matching automatique iCal ↔ CSV
- Bouton "Sync Now" manuel
- Gestion Playwright Toggle
- Alerte échec Playwright 3 jours consécutifs
- Propriétés en lecture seule (85 existantes)

**Simplifié:**
- Calendrier: Vue mensuelle simple uniquement
- Alertes: Email uniquement via Resend
- Propriétés: Lecture seule, pas de CRUD
- Focus: Airbnb uniquement
