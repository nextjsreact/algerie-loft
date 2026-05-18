-- Script de Vérification des Migrations Airbnb
-- Date: 2026-05-17
-- Usage: Exécuter ce script dans Supabase SQL Editor après avoir appliqué les migrations

-- ============================================================================
-- 1. VÉRIFICATION DES COLONNES DANS RESERVATIONS
-- ============================================================================

SELECT 
  '1. Colonnes Airbnb dans reservations' as verification,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ OK (3 nouvelles colonnes ajoutées)'
    ELSE '❌ ERREUR: ' || (3 - COUNT(*))::text || ' colonnes manquantes'
  END as statut
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN (
  'source', 
  'airbnb_confirmation_code',
  'synced_at'
);

-- Note: Les colonnes suivantes existaient déjà et n'ont pas été ajoutées:
-- guest_email, guest_nationality, base_price, cleaning_fee, service_fee, taxes, special_requests, currency_code

-- ============================================================================
-- 2. VÉRIFICATION DE LA COLONNE DANS LOFTS
-- ============================================================================

SELECT 
  '2. Colonne airbnb_listing_id dans lofts' as verification,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK'
    ELSE '❌ ERREUR: Colonne manquante'
  END as statut
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND column_name = 'airbnb_listing_id';

-- ============================================================================
-- 3. VÉRIFICATION DES TABLES AIRBNB
-- ============================================================================

SELECT 
  '3. Tables Airbnb créées' as verification,
  COUNT(*) as tables_trouvees,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ OK'
    ELSE '❌ ERREUR: ' || (3 - COUNT(*))::text || ' tables manquantes'
  END as statut
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'airbnb_reservations_staging',
  'airbnb_sync_logs',
  'airbnb_conflicts'
);

-- ============================================================================
-- 4. DÉTAIL DES TABLES AIRBNB
-- ============================================================================

SELECT 
  '4. Détail des tables Airbnb' as verification,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nombre_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'airbnb%'
ORDER BY table_name;

-- ============================================================================
-- 5. VÉRIFICATION DES INDEXES
-- ============================================================================

SELECT 
  '5. Indexes Airbnb créés' as verification,
  COUNT(*) as indexes_trouves,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ OK'
    ELSE '⚠️ ATTENTION: Seulement ' || COUNT(*)::text || ' indexes trouvés (attendu: ~15)'
  END as statut
FROM pg_indexes 
WHERE tablename IN (
  'reservations', 
  'lofts', 
  'airbnb_reservations_staging', 
  'airbnb_sync_logs', 
  'airbnb_conflicts'
)
AND (
  indexname LIKE '%airbnb%' 
  OR indexname LIKE '%staging%'
  OR indexname LIKE '%sync%'
  OR indexname LIKE '%conflict%'
);

-- ============================================================================
-- 6. LISTE DES INDEXES CRÉÉS
-- ============================================================================

SELECT 
  '6. Liste des indexes' as verification,
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN (
  'reservations', 
  'lofts', 
  'airbnb_reservations_staging', 
  'airbnb_sync_logs', 
  'airbnb_conflicts'
)
AND (
  indexname LIKE '%airbnb%' 
  OR indexname LIKE '%staging%'
  OR indexname LIKE '%sync%'
  OR indexname LIKE '%conflict%'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. VÉRIFICATION DES CONTRAINTES
-- ============================================================================

SELECT 
  '7. Contraintes créées' as verification,
  COUNT(*) as contraintes_trouvees,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK'
    ELSE '⚠️ ATTENTION: Seulement ' || COUNT(*)::text || ' contraintes trouvées'
  END as statut
FROM information_schema.table_constraints 
WHERE table_name IN (
  'reservations',
  'airbnb_reservations_staging',
  'airbnb_conflicts'
)
AND constraint_type IN ('UNIQUE', 'CHECK');

-- ============================================================================
-- 8. TEST D'INSERTION DANS STAGING
-- ============================================================================

-- Insérer une réservation de test
INSERT INTO airbnb_reservations_staging (
  airbnb_id,
  listing_id,
  raw_data,
  guest_name,
  guest_count,
  check_in_date,
  check_out_date,
  nights,
  total_amount,
  currency_code,
  status,
  sync_type,
  sync_batch_id
) VALUES (
  'HMVERIFY123',
  '99999999',
  '{"test": true, "verification": "migration"}'::jsonb,
  'Test User',
  2,
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '34 days',
  4,
  40000.00,
  'DZD',
  'confirmed',
  'manual',
  gen_random_uuid()
);

-- Vérifier l'insertion
SELECT 
  '8. Test d''insertion dans staging' as verification,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK - Insertion réussie'
    ELSE '❌ ERREUR - Insertion échouée'
  END as statut
FROM airbnb_reservations_staging 
WHERE airbnb_id = 'HMVERIFY123';

-- Nettoyer le test
DELETE FROM airbnb_reservations_staging WHERE airbnb_id = 'HMVERIFY123';

-- ============================================================================
-- 9. RÉSUMÉ FINAL
-- ============================================================================

SELECT 
  '9. RÉSUMÉ FINAL' as verification,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'reservations' 
    AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at')
  ) as nouvelles_colonnes_reservations,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'lofts' 
    AND column_name = 'airbnb_listing_id'
  ) as colonne_lofts,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('airbnb_reservations_staging', 'airbnb_sync_logs', 'airbnb_conflicts')
  ) as tables_airbnb,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'reservations' AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at')
    ) = 3
    AND (
      SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lofts' AND column_name = 'airbnb_listing_id'
    ) = 1
    AND (
      SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('airbnb_reservations_staging', 'airbnb_sync_logs', 'airbnb_conflicts')
    ) = 3
    THEN '✅ TOUTES LES MIGRATIONS APPLIQUÉES AVEC SUCCÈS'
    ELSE '❌ CERTAINES MIGRATIONS ONT ÉCHOUÉ - VÉRIFIER LES DÉTAILS CI-DESSUS'
  END as statut_global;

-- ============================================================================
-- FIN DE LA VÉRIFICATION
-- ============================================================================

-- Si tout est ✅ OK, vous pouvez passer à l'étape suivante:
-- Créer l'API endpoint /api/airbnb/sync
