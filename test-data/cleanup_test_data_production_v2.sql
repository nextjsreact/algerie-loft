-- =====================================================
-- NETTOYAGE DES DONNÉES DE TEST EN PRODUCTION - V2
-- =====================================================
-- ⚠️ À exécuter dans Supabase PRODUCTION (mhngbluefyucoesgcjoy)
-- ⚠️ Version corrigée pour gérer les contraintes FK
-- =====================================================

-- =====================================================
-- ÉTAPE 1: IDENTIFIER LES IDs DES RÉSERVATIONS DE TEST
-- =====================================================

-- 1.1 Trouver les IDs des réservations de test
SELECT 
    '=== IDs DES RÉSERVATIONS DE TEST ===' as section,
    id,
    airbnb_confirmation_code,
    guest_name,
    check_in_date,
    check_out_date,
    created_at
FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
ORDER BY created_at DESC;

-- 1.2 Trouver les conflits liés à ces réservations
SELECT 
    '=== CONFLITS LIÉS AUX RÉSERVATIONS DE TEST ===' as section,
    c.id as conflict_id,
    c.reservation_1_id,
    c.reservation_2_id,
    r1.airbnb_confirmation_code as res1_code,
    r2.airbnb_confirmation_code as res2_code,
    c.overlap_start,
    c.overlap_end,
    c.created_at
FROM airbnb_conflicts c
LEFT JOIN reservations r1 ON c.reservation_1_id = r1.id
LEFT JOIN reservations r2 ON c.reservation_2_id = r2.id
WHERE c.reservation_1_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
)
OR c.reservation_2_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
)
ORDER BY c.created_at DESC;

-- 1.3 Trouver les entrées staging liées
SELECT 
    '=== STAGING LIÉS AUX RÉSERVATIONS DE TEST ===' as section,
    s.id as staging_id,
    s.airbnb_id,
    s.guest_name,
    s.reservation_id,
    s.sync_batch_id,
    s.created_at
FROM airbnb_reservations_staging s
WHERE s.sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR s.airbnb_id LIKE 'HMTEST%'
OR s.reservation_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
)
ORDER BY s.created_at DESC;

-- =====================================================
-- ÉTAPE 2: SUPPRESSION DANS LE BON ORDRE
-- =====================================================
-- ⚠️ IMPORTANT: Exécuter ces commandes UNE PAR UNE
-- ⚠️ Ordre: conflits → logs → staging → réservations
-- =====================================================

-- 2.1 Supprimer les conflits liés aux réservations de test
DELETE FROM airbnb_conflicts
WHERE reservation_1_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
)
OR reservation_2_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
);

-- Vérifier
SELECT 'Conflits liés aux réservations de test supprimés' as status, COUNT(*) as remaining
FROM airbnb_conflicts
WHERE reservation_1_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
)
OR reservation_2_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
);

-- 2.2 Supprimer les logs de test
DELETE FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- Vérifier
SELECT 'Logs de test supprimés' as status, COUNT(*) as remaining
FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- 2.3 Supprimer les entrées staging de test
DELETE FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%'
OR reservation_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
);

-- Vérifier
SELECT 'Staging de test supprimé' as status, COUNT(*) as remaining
FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%';

-- 2.4 Supprimer les réservations de test (EN DERNIER)
DELETE FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');

-- Vérifier
SELECT 'Réservations de test supprimées' as status, COUNT(*) as remaining
FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');

-- =====================================================
-- ÉTAPE 3: VÉRIFICATION FINALE COMPLÈTE
-- =====================================================

-- 3.1 Vérifier qu'il ne reste aucune donnée de test
SELECT 
    '=== VÉRIFICATION FINALE ===' as section,
    (SELECT COUNT(*) FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%') as reservations_test,
    (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE airbnb_id LIKE 'HMTEST%') as staging_test,
    (SELECT COUNT(*) FROM airbnb_sync_logs WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3') as logs_test,
    (SELECT COUNT(*) FROM airbnb_conflicts WHERE reservation_1_id IN (
        SELECT id FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%'
    )) as conflits_test;

-- Résultat attendu: Tous les compteurs à 0

-- 3.2 Vérifier les données réelles (ne doivent PAS être affectées)
SELECT 
    '=== DONNÉES RÉELLES (NE DOIVENT PAS ÊTRE AFFECTÉES) ===' as section,
    (SELECT COUNT(*) FROM lofts) as total_lofts,
    (SELECT COUNT(*) FROM reservations) as total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND airbnb_confirmation_code NOT LIKE 'HMTEST%') as reservations_airbnb_reelles,
    (SELECT COUNT(*) FROM airbnb_conflicts) as total_conflits,
    (SELECT COUNT(*) FROM airbnb_sync_logs) as total_logs;

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

-- Résultat attendu: 1 ligne (Star loft)

-- 3.4 Vérifier qu'il n'y a pas de conflits orphelins
SELECT 
    '=== VÉRIFICATION DES CONFLITS (NE DOIT PAS Y AVOIR D''ORPHELINS) ===' as section,
    c.id,
    c.reservation_1_id,
    c.reservation_2_id,
    r1.airbnb_confirmation_code as res1_code,
    r2.airbnb_confirmation_code as res2_code
FROM airbnb_conflicts c
LEFT JOIN reservations r1 ON c.reservation_1_id = r1.id
LEFT JOIN reservations r2 ON c.reservation_2_id = r2.id
WHERE r1.id IS NULL OR r2.id IS NULL;

-- Résultat attendu: 0 ligne (pas de conflits orphelins)

-- =====================================================
-- RÉSUMÉ DE LA PROCÉDURE
-- =====================================================
-- 1. Exécuter ÉTAPE 1 pour identifier les données à supprimer
-- 2. Vérifier que seules les données de test sont listées
-- 3. Exécuter ÉTAPE 2 commande par commande (dans l'ordre)
--    a. Conflits liés aux réservations de test
--    b. Logs de test
--    c. Staging de test
--    d. Réservations de test
-- 4. Exécuter ÉTAPE 3 pour vérifier le nettoyage complet
-- 5. Si tout est OK (tous les compteurs à 0), créer le backup
-- =====================================================

-- =====================================================
-- COMMANDE RAPIDE: TOUT SUPPRIMER EN UNE FOIS
-- =====================================================
-- ⚠️ ATTENTION: Utilisez cette commande UNIQUEMENT si vous êtes sûr
-- ⚠️ Elle supprime tout d'un coup dans le bon ordre
-- =====================================================

/*
BEGIN;

-- 1. Conflits
DELETE FROM airbnb_conflicts
WHERE reservation_1_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
)
OR reservation_2_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
);

-- 2. Logs
DELETE FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- 3. Staging
DELETE FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%'
OR reservation_id IN (
    SELECT id FROM reservations 
    WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
    OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe')
);

-- 4. Réservations
DELETE FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');

COMMIT;
*/
