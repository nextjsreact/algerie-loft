-- ============================================================================
-- Vérification des données de test PYTEST001
-- ============================================================================

-- 1. Réservation de test avec toutes les coordonnées voyageur
SELECT 
  '=== RÉSERVATION DE TEST ===' as section,
  airbnb_confirmation_code as "Code Airbnb",
  guest_name as "Nom voyageur",
  guest_email as "Email",
  guest_phone as "Téléphone",
  guest_nationality as "Nationalité",
  check_in_date as "Arrivée",
  check_out_date as "Départ",
  nights as "Nuits",
  guest_count as "Nb voyageurs",
  total_amount as "Montant total",
  currency_code as "Devise",
  status as "Statut",
  source as "Source",
  special_requests as "Demandes spéciales",
  created_at as "Créé le"
FROM reservations 
WHERE airbnb_confirmation_code = 'PYTEST001'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Vérifier si les coordonnées sont bien remplies
SELECT 
  '=== ANALYSE DES COORDONNÉES ===' as section,
  CASE 
    WHEN guest_email IS NOT NULL AND guest_email != '' THEN '✅ Email présent'
    ELSE '❌ Email manquant'
  END as "Email",
  CASE 
    WHEN guest_phone IS NOT NULL AND guest_phone != '' THEN '✅ Téléphone présent'
    ELSE '❌ Téléphone manquant'
  END as "Téléphone",
  CASE 
    WHEN guest_nationality IS NOT NULL AND guest_nationality != '' THEN '✅ Nationalité présente'
    ELSE '❌ Nationalité manquante'
  END as "Nationalité"
FROM reservations 
WHERE airbnb_confirmation_code = 'PYTEST001'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Comparer avec les réservations Airbnb existantes (HMTEST)
SELECT 
  '=== COMPARAISON AVEC HMTEST ===' as section,
  airbnb_confirmation_code as "Code",
  guest_name as "Nom",
  CASE 
    WHEN guest_email IS NOT NULL AND guest_email != '' THEN '✅'
    ELSE '❌'
  END as "Email?",
  CASE 
    WHEN guest_phone IS NOT NULL AND guest_phone != '' THEN '✅'
    ELSE '❌'
  END as "Tél?",
  CASE 
    WHEN guest_nationality IS NOT NULL AND guest_nationality != '' THEN '✅'
    ELSE '❌'
  END as "Nat?",
  source as "Source",
  created_at as "Créé le"
FROM reservations 
WHERE airbnb_confirmation_code LIKE 'HMTEST%' 
   OR airbnb_confirmation_code = 'PYTEST001'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Statistiques globales sur les coordonnées
SELECT 
  '=== STATISTIQUES GLOBALES ===' as section,
  COUNT(*) as "Total réservations",
  COUNT(CASE WHEN guest_email IS NOT NULL AND guest_email != '' THEN 1 END) as "Avec email",
  COUNT(CASE WHEN guest_phone IS NOT NULL AND guest_phone != '' THEN 1 END) as "Avec téléphone",
  COUNT(CASE WHEN guest_nationality IS NOT NULL AND guest_nationality != '' THEN 1 END) as "Avec nationalité",
  ROUND(100.0 * COUNT(CASE WHEN guest_email IS NOT NULL AND guest_email != '' THEN 1 END) / COUNT(*), 1) as "% Email",
  ROUND(100.0 * COUNT(CASE WHEN guest_phone IS NOT NULL AND guest_phone != '' THEN 1 END) / COUNT(*), 1) as "% Téléphone",
  ROUND(100.0 * COUNT(CASE WHEN guest_nationality IS NOT NULL AND guest_nationality != '' THEN 1 END) / COUNT(*), 1) as "% Nationalité"
FROM reservations
WHERE source = 'airbnb_scraper';

-- 5. Vérifier le log de sync du test
SELECT 
  '=== LOG DE SYNCHRONISATION ===' as section,
  sync_batch_id as "Batch ID",
  sync_type as "Type",
  status as "Statut",
  reservations_received as "Reçues",
  reservations_created as "Créées",
  conflicts_detected as "Conflits",
  duration_ms as "Durée (ms)",
  started_at as "Démarré à"
FROM airbnb_sync_logs 
WHERE sync_batch_id = '347b39f8-b1fe-47f4-9d96-ad60f6453155'
   OR started_at > NOW() - INTERVAL '5 minutes'
ORDER BY started_at DESC
LIMIT 5;

-- 6. Vérifier la réservation en staging
SELECT 
  '=== STAGING ===' as section,
  airbnb_id as "ID Airbnb",
  guest_name as "Nom",
  guest_email as "Email",
  guest_phone as "Téléphone",
  guest_nationality as "Nationalité",
  mapping_status as "Mapping",
  validation_status as "Validation",
  reconciliation_status as "Réconciliation",
  created_at as "Créé le"
FROM airbnb_reservations_staging 
WHERE airbnb_id = 'PYTEST001'
ORDER BY created_at DESC
LIMIT 1;
