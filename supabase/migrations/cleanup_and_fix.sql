-- ============================================================================
-- Script de Nettoyage et Résolution des Problèmes Airbnb
-- ============================================================================
-- Ce script résout tous les problèmes identifiés dans l'analyse
-- Date: 2026-05-19
-- Exécuter dans Supabase SQL Editor

-- ============================================================================
-- PARTIE 1 : RÉSOUDRE LE CONFLIT CRITIQUE
-- ============================================================================

SELECT '=== PARTIE 1 : RÉSOLUTION DU CONFLIT ===' as action;

-- 1.1 Voir la réservation manuelle en conflit
SELECT 
  '1.1 - Réservation manuelle en conflit:' as info;

SELECT 
  id,
  loft_id,
  guest_name,
  guest_phone,
  check_in_date,
  check_out_date,
  status,
  source,
  total_amount,
  created_at
FROM reservations
WHERE loft_id = '5372ab62-3a1e-46f6-bed4-3dc025ebdbfd'
  AND check_in_date <= '2026-06-05'
  AND check_out_date >= '2026-06-01'
  AND source = 'manual'
  AND status = 'pending';

-- 1.2 Annuler la réservation manuelle (elle est en conflit avec Airbnb confirmée)
SELECT 
  '1.2 - Annulation de la réservation manuelle...' as info;

UPDATE reservations 
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE loft_id = '5372ab62-3a1e-46f6-bed4-3dc025ebdbfd'
  AND check_in_date <= '2026-06-05'
  AND check_out_date >= '2026-06-01'
  AND source = 'manual'
  AND status = 'pending';

-- 1.3 Marquer le conflit comme résolu
SELECT 
  '1.3 - Marquage du conflit comme résolu...' as info;

UPDATE airbnb_conflicts 
SET 
  status = 'resolved',
  resolved_at = NOW(),
  resolution_notes = 'Réservation manuelle annulée automatiquement - Priorité à la réservation Airbnb confirmée (HMTEST001 - Ahmed Benali)'
WHERE id = '692952bd-8aef-4b57-afd6-ceda55a48ece';

-- 1.4 Vérifier la résolution
SELECT 
  '1.4 - Vérification de la résolution:' as info;

SELECT 
  id,
  loft_id,
  status,
  resolved_at,
  resolution_notes
FROM airbnb_conflicts
WHERE id = '692952bd-8aef-4b57-afd6-ceda55a48ece';

-- ============================================================================
-- PARTIE 2 : NETTOYER LES DOUBLONS EN STAGING
-- ============================================================================

SELECT '=== PARTIE 2 : NETTOYAGE DES DOUBLONS ===' as action;

-- 2.1 Voir les doublons avant suppression
SELECT 
  '2.1 - Doublons à supprimer:' as info;

SELECT 
  airbnb_id,
  listing_id,
  guest_name,
  reconciliation_status,
  created_at
FROM airbnb_reservations_staging
WHERE reconciliation_status = 'pending'
  AND airbnb_id IN ('HMTEST001', 'HMTEST002')
ORDER BY airbnb_id, created_at;

-- 2.2 Supprimer les doublons (garder seulement les entrées avec reconciliation_status = 'created')
SELECT 
  '2.2 - Suppression des doublons...' as info;

DELETE FROM airbnb_reservations_staging
WHERE reconciliation_status = 'pending'
  AND airbnb_id IN ('HMTEST001', 'HMTEST002');

-- 2.3 Vérifier qu'il ne reste plus de doublons
SELECT 
  '2.3 - Vérification des doublons restants:' as info;

SELECT 
  airbnb_id,
  COUNT(*) as count,
  STRING_AGG(reconciliation_status::text, ', ') as statuses
FROM airbnb_reservations_staging
GROUP BY airbnb_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- PARTIE 3 : GÉRER LE LISTING ID 99999999 (HMTEST003)
-- ============================================================================

SELECT '=== PARTIE 3 : GESTION DU LISTING ID 99999999 ===' as action;

-- 3.1 Voir les réservations avec listing_id 99999999
SELECT 
  '3.1 - Réservations avec listing_id 99999999:' as info;

SELECT 
  id,
  airbnb_id,
  listing_id,
  guest_name,
  check_in_date,
  check_out_date,
  mapping_status,
  created_at
FROM airbnb_reservations_staging
WHERE listing_id = '99999999';

-- 3.2 Supprimer les entrées de test (HMTEST003 avec listing_id 99999999)
SELECT 
  '3.2 - Suppression des réservations de test...' as info;

DELETE FROM airbnb_reservations_staging
WHERE listing_id = '99999999'
  AND airbnb_id = 'HMTEST003';

-- 3.3 Vérifier la suppression
SELECT 
  '3.3 - Vérification de la suppression:' as info;

SELECT 
  COUNT(*) as remaining_test_reservations
FROM airbnb_reservations_staging
WHERE listing_id = '99999999';

-- ============================================================================
-- PARTIE 4 : VÉRIFICATION FINALE
-- ============================================================================

SELECT '=== PARTIE 4 : VÉRIFICATION FINALE ===' as action;

-- 4.1 État de la table staging
SELECT 
  '4.1 - État de la table staging:' as info;

SELECT 
  airbnb_id,
  listing_id,
  guest_name,
  mapping_status,
  validation_status,
  reconciliation_status,
  created_at
FROM airbnb_reservations_staging
ORDER BY created_at DESC;

-- 4.2 Conflits restants
SELECT 
  '4.2 - Conflits restants:' as info;

SELECT 
  COUNT(*) as open_conflicts
FROM airbnb_conflicts
WHERE status = 'open';

-- 4.3 Réservations Airbnb actives
SELECT 
  '4.3 - Réservations Airbnb actives:' as info;

SELECT 
  id,
  guest_name,
  check_in_date,
  check_out_date,
  status,
  airbnb_confirmation_code,
  total_amount
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status IN ('confirmed', 'pending')
ORDER BY check_in_date;

-- 4.4 Statistiques finales
SELECT 
  '4.4 - Statistiques finales:' as info;

SELECT 
  'Total Réservations' as metric,
  COUNT(*) as count
FROM reservations
UNION ALL
SELECT 
  'Réservations Airbnb' as metric,
  COUNT(*) as count
FROM reservations
WHERE source = 'airbnb_scraper'
UNION ALL
SELECT 
  'Réservations en Staging' as metric,
  COUNT(*) as count
FROM airbnb_reservations_staging
UNION ALL
SELECT 
  'Conflits Ouverts' as metric,
  COUNT(*) as count
FROM airbnb_conflicts
WHERE status = 'open'
UNION ALL
SELECT 
  'Conflits Résolus' as metric,
  COUNT(*) as count
FROM airbnb_conflicts
WHERE status = 'resolved';

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

SELECT '=== RÉSUMÉ FINAL ===' as action;

SELECT 
  '✓ Nettoyage terminé avec succès' as status,
  NOW() as completed_at;

SELECT 
  'Actions effectuées:' as summary,
  '1. Conflit résolu (réservation manuelle annulée)' as action_1,
  '2. Doublons supprimés (HMTEST001, HMTEST002)' as action_2,
  '3. Réservations de test supprimées (HMTEST003)' as action_3,
  '4. Base de données nettoyée et prête' as action_4;

-- ============================================================================
-- PROCHAINES ÉTAPES
-- ============================================================================

SELECT '=== PROCHAINES ÉTAPES ===' as action;

SELECT 
  'Étape 1: Tester l''API avec le script test-airbnb-sync.ps1' as next_step_1,
  'Étape 2: Mapper plus de lofts (52 lofts restants)' as next_step_2,
  'Étape 3: Modifier le script Python pour synchronisation automatique' as next_step_3;
