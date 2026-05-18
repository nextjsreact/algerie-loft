-- ============================================================================
-- Script de vérification des tables Airbnb
-- ============================================================================
-- Ce script vérifie que toutes les tables et colonnes nécessaires existent
-- pour l'intégration Airbnb Python v2.0.0

-- 1. Vérifier les tables existantes
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'reservations' THEN '✓ Table principale (étendue pour Airbnb)'
    WHEN table_name = 'airbnb_reservations_staging' THEN '✓ Table de staging'
    WHEN table_name = 'lofts' THEN '✓ Table des lofts (avec mapping)'
    WHEN table_name = 'airbnb_sync_logs' THEN '✓ Table de logs'
    WHEN table_name = 'airbnb_conflicts' THEN '✓ Table de conflits'
  END as description
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'reservations',
    'airbnb_reservations_staging',
    'lofts',
    'airbnb_sync_logs',
    'airbnb_conflicts'
  )
ORDER BY table_name;

-- 2. Vérifier les colonnes Airbnb dans la table reservations
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservations'
  AND column_name IN (
    'source',
    'airbnb_confirmation_code',
    'synced_at',
    'base_price',
    'cleaning_fee',
    'service_fee',
    'taxes',
    'guest_email',
    'guest_nationality',
    'special_requests'
  )
ORDER BY column_name;

-- 3. Vérifier la colonne airbnb_listing_id dans la table lofts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lofts'
  AND column_name = 'airbnb_listing_id';

-- 4. Vérifier les indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%airbnb%'
    OR indexname LIKE '%staging%'
    OR indexname LIKE '%sync_logs%'
    OR indexname LIKE '%conflicts%'
  )
ORDER BY tablename, indexname;

-- 5. Compter les enregistrements dans chaque table
SELECT 
  'reservations' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE source = 'airbnb_scraper') as airbnb_records
FROM reservations
UNION ALL
SELECT 
  'airbnb_reservations_staging' as table_name,
  COUNT(*) as total_records,
  0 as airbnb_records
FROM airbnb_reservations_staging
UNION ALL
SELECT 
  'airbnb_sync_logs' as table_name,
  COUNT(*) as total_records,
  0 as airbnb_records
FROM airbnb_sync_logs
UNION ALL
SELECT 
  'airbnb_conflicts' as table_name,
  COUNT(*) as total_records,
  0 as airbnb_records
FROM airbnb_conflicts
UNION ALL
SELECT 
  'lofts (with airbnb_listing_id)' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE airbnb_listing_id IS NOT NULL) as airbnb_records
FROM lofts;

-- 6. Résumé final
SELECT 
  '✓ Vérification terminée' as status,
  NOW() as checked_at;
