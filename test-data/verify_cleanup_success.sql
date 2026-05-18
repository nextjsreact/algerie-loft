-- =====================================================
-- VÉRIFICATION DU NETTOYAGE RÉUSSI
-- =====================================================
-- À exécuter dans Supabase PRODUCTION (mhngbluefyucoesgcjoy)
-- =====================================================

-- 1. Vérifier qu'il ne reste AUCUNE donnée de test
SELECT 
    '=== VÉRIFICATION: AUCUNE DONNÉE DE TEST ===' as section,
    (SELECT COUNT(*) FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%') as reservations_test,
    (SELECT COUNT(*) FROM reservations WHERE guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')) as reservations_test_by_name,
    (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE airbnb_id LIKE 'HMTEST%') as staging_test,
    (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3') as staging_test_by_batch,
    (SELECT COUNT(*) FROM airbnb_sync_logs WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3') as logs_test,
    (SELECT COUNT(*) FROM airbnb_conflicts WHERE reservation_1_id IN (
        SELECT id FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%'
    )) as conflits_test;

-- ✅ Résultat attendu: TOUS les compteurs à 0

-- 2. Vérifier les données RÉELLES (ne doivent PAS être affectées)
SELECT 
    '=== DONNÉES RÉELLES (DOIVENT ÊTRE INTACTES) ===' as section,
    (SELECT COUNT(*) FROM lofts) as total_lofts,
    (SELECT COUNT(*) FROM reservations) as total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND airbnb_confirmation_code NOT LIKE 'HMTEST%') as reservations_airbnb_reelles,
    (SELECT COUNT(*) FROM airbnb_reservations_staging) as total_staging,
    (SELECT COUNT(*) FROM airbnb_conflicts) as total_conflits,
    (SELECT COUNT(*) FROM airbnb_sync_logs) as total_logs;

-- 3. Vérifier le loft Star avec listing_id (DOIT être présent)
SELECT 
    '=== LOFT STAR (DOIT ÊTRE PRÉSENT) ===' as section,
    id,
    name,
    address,
    airbnb_listing_id,
    status,
    created_at
FROM lofts
WHERE airbnb_listing_id = '12345678';

-- ✅ Résultat attendu: 1 ligne (Star loft)

-- 4. Vérifier qu'il n'y a pas de conflits orphelins
SELECT 
    '=== CONFLITS ORPHELINS (NE DOIT PAS Y EN AVOIR) ===' as section,
    COUNT(*) as conflits_orphelins
FROM airbnb_conflicts c
LEFT JOIN reservations r1 ON c.reservation_1_id = r1.id
LEFT JOIN reservations r2 ON c.reservation_2_id = r2.id
WHERE r1.id IS NULL OR r2.id IS NULL;

-- ✅ Résultat attendu: 0

-- 5. Vérifier la structure des tables Airbnb
SELECT 
    '=== STRUCTURE DES TABLES AIRBNB ===' as section,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'lofts',
    'reservations',
    'airbnb_reservations_staging',
    'airbnb_sync_logs',
    'airbnb_conflicts'
)
ORDER BY table_name;

-- ✅ Résultat attendu: 5 tables

-- =====================================================
-- RÉSUMÉ DU STATUT
-- =====================================================

SELECT 
    '=== RÉSUMÉ: PRÊT POUR LE BACKUP ===' as section,
    CASE 
        WHEN (SELECT COUNT(*) FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%') = 0
        AND (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE airbnb_id LIKE 'HMTEST%') = 0
        AND (SELECT COUNT(*) FROM airbnb_sync_logs WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3') = 0
        THEN '✅ PRODUCTION PROPRE - PRÊT POUR LE BACKUP'
        ELSE '❌ IL RESTE DES DONNÉES DE TEST - VÉRIFIER'
    END as statut;
