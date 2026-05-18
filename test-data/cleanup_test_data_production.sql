-- =====================================================
-- NETTOYAGE DES DONNÉES DE TEST EN PRODUCTION
-- =====================================================
-- ⚠️ À exécuter dans Supabase PRODUCTION (mhngbluefyucoesgcjoy)
-- ⚠️ IMPORTANT: Exécuter AVANT de créer le backup pour la copie vers DEV
-- =====================================================

-- =====================================================
-- ÉTAPE 1: VÉRIFICATION DES DONNÉES À SUPPRIMER
-- =====================================================

-- 1.1 Réservations de test à supprimer
SELECT 
    '=== RÉSERVATIONS DE TEST ===' as section,
    COUNT(*) as total_a_supprimer
FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');

SELECT 
    id,
    airbnb_confirmation_code,
    guest_name,
    check_in_date,
    check_out_date,
    total_amount,
    created_at
FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
ORDER BY created_at DESC;

-- 1.2 Entrées staging de test à supprimer
SELECT 
    '=== STAGING DE TEST ===' as section,
    COUNT(*) as total_a_supprimer
FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%';

SELECT 
    id,
    airbnb_id,
    guest_name,
    sync_batch_id,
    mapping_status,
    reconciliation_status,
    created_at
FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%'
ORDER BY created_at DESC;

-- 1.3 Conflits de test à supprimer
SELECT 
    '=== CONFLITS DE TEST ===' as section,
    COUNT(*) as total_a_supprimer
FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '3 hours';

SELECT 
    id,
    loft_id,
    overlap_start,
    overlap_end,
    overlap_nights,
    severity,
    status,
    created_at
FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '3 hours'
ORDER BY created_at DESC;

-- 1.4 Logs de test à supprimer
SELECT 
    '=== LOGS DE TEST ===' as section,
    COUNT(*) as total_a_supprimer
FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

SELECT 
    id,
    sync_batch_id,
    sync_type,
    status,
    reservations_received,
    reservations_created,
    reservations_failed,
    started_at,
    completed_at
FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
ORDER BY started_at DESC;

-- =====================================================
-- ÉTAPE 2: SUPPRESSION (À EXÉCUTER SÉPARÉMENT)
-- =====================================================
-- ⚠️ ATTENTION: Vérifiez d'abord les résultats de l'ÉTAPE 1
-- ⚠️ Puis exécutez les commandes ci-dessous UNE PAR UNE
-- =====================================================

-- 2.1 Supprimer les conflits de test (COMMENCER PAR LÀ - pas de FK)
DELETE FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '3 hours';

-- Vérifier
SELECT 'Conflits supprimés' as status, COUNT(*) as remaining
FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '3 hours';

-- 2.2 Supprimer les logs de test (pas de FK)
DELETE FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- Vérifier
SELECT 'Logs supprimés' as status, COUNT(*) as remaining
FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- 2.3 Supprimer les entrées staging de test (a des FK vers reservations)
DELETE FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%';

-- Vérifier
SELECT 'Staging supprimé' as status, COUNT(*) as remaining
FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%';

-- 2.4 Supprimer les réservations de test (EN DERNIER - référencé par staging)
DELETE FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');

-- Vérifier
SELECT 'Réservations supprimées' as status, COUNT(*) as remaining
FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');

-- =====================================================
-- ÉTAPE 3: VÉRIFICATION FINALE
-- =====================================================

-- 3.1 Vérifier qu'il ne reste aucune donnée de test
SELECT 
    '=== VÉRIFICATION FINALE ===' as section,
    (SELECT COUNT(*) FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%') as reservations_test,
    (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE airbnb_id LIKE 'HMTEST%') as staging_test,
    (SELECT COUNT(*) FROM airbnb_conflicts WHERE created_at > NOW() - INTERVAL '3 hours') as conflits_recents,
    (SELECT COUNT(*) FROM airbnb_sync_logs WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3') as logs_test;

-- 3.2 Vérifier les données réelles (ne doivent PAS être affectées)
SELECT 
    '=== DONNÉES RÉELLES (NE DOIVENT PAS ÊTRE AFFECTÉES) ===' as section,
    (SELECT COUNT(*) FROM lofts) as total_lofts,
    (SELECT COUNT(*) FROM reservations) as total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper') as reservations_airbnb_reelles;

-- 3.3 Vérifier le loft Star avec listing_id (doit être présent)
SELECT 
    '=== LOFT STAR (DOIT ÊTRE PRÉSENT) ===' as section,
    id,
    name,
    address,
    airbnb_listing_id,
    status
FROM lofts
WHERE airbnb_listing_id = '12345678';

-- =====================================================
-- RÉSUMÉ DE LA PROCÉDURE
-- =====================================================
-- 1. Exécuter ÉTAPE 1 pour voir ce qui sera supprimé
-- 2. Vérifier que seules les données de test sont listées
-- 3. Exécuter ÉTAPE 2 commande par commande (dans l'ordre)
-- 4. Exécuter ÉTAPE 3 pour vérifier le nettoyage
-- 5. Si tout est OK, créer le backup de production
-- 6. Restaurer le backup dans DEV
-- =====================================================
