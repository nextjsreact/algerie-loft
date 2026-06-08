-- Test de connexion et vérification des tables

-- 1. Vérifier que les tables existent
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('reservations', 'airbnb_reservations_staging', 'airbnb_sync_logs', 'airbnb_conflicts', 'lofts')
ORDER BY table_name;

-- 2. Compter les enregistrements dans chaque table
SELECT 'reservations' as table_name, COUNT(*) as count FROM reservations
UNION ALL
SELECT 'airbnb_reservations_staging', COUNT(*) FROM airbnb_reservations_staging
UNION ALL
SELECT 'airbnb_sync_logs', COUNT(*) FROM airbnb_sync_logs
UNION ALL
SELECT 'airbnb_conflicts', COUNT(*) FROM airbnb_conflicts
UNION ALL
SELECT 'lofts', COUNT(*) FROM lofts;

-- 3. Vérifier les lofts avec airbnb_listing_id configuré
SELECT id, name, airbnb_listing_id, active
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

-- 4. Vérifier les 5 derniers syncs (tous)
SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_received,
  reservations_created,
  started_at,
  completed_at
FROM airbnb_sync_logs 
ORDER BY started_at DESC 
LIMIT 5;
