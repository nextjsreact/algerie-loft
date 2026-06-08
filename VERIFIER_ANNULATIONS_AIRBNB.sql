-- ================================================================
-- VÉRIFIER SI LES ANNULATIONS AIRBNB SONT SYNCHRONISÉES
-- ================================================================

-- 1. Voir toutes les réservations Airbnb annulées
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  r.check_out_date,
  r.status,
  r.total_amount,
  l.name as loft_name,
  r.synced_at as derniere_sync,
  r.cancelled_at,
  r.cancellation_reason
FROM reservations r
LEFT JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'cancelled'
ORDER BY r.synced_at DESC;

-- 2. Compter les réservations Airbnb par statut
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY nombre DESC;

-- 3. Voir les réservations Airbnb annulées récemment (dernières 30 jours)
SELECT 
  r.id,
  r.guest_name,
  r.airbnb_confirmation_code,
  r.check_in_date,
  l.name as loft_name,
  r.synced_at as date_annulation,
  EXTRACT(DAY FROM NOW() - r.synced_at) as jours_depuis_annulation
FROM reservations r
LEFT JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'cancelled'
  AND r.synced_at >= NOW() - INTERVAL '30 days'
ORDER BY r.synced_at DESC;

-- 4. Vérifier dans staging s'il y a des annulations en attente de sync
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.listing_id,
  s.check_in_date,
  s.check_out_date,
  s.raw_data->>'statut' as statut_brut,
  s.validation_status,
  s.mapping_status,
  s.created_at
FROM airbnb_reservations_staging s
WHERE s.raw_data->>'statut' ILIKE '%annul%'
ORDER BY s.created_at DESC
LIMIT 20;

-- 5. Vérifier l'historique de synchronisation (dernières syncs)
SELECT 
  sync_batch_id,
  sync_type,
  started_at,
  completed_at,
  status,
  reservations_received,
  reservations_created,
  reservations_updated,
  reservations_skipped,
  reservations_failed,
  conflicts_detected,
  duration_ms,
  errors,
  warnings
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 10;

-- 5b. Vérifier s'il y a eu des erreurs lors des dernières syncs
SELECT 
  sync_batch_id,
  sync_type,
  started_at,
  status,
  reservations_failed,
  jsonb_array_length(COALESCE(errors, '[]'::jsonb)) as nombre_erreurs,
  jsonb_array_length(COALESCE(warnings, '[]'::jsonb)) as nombre_warnings
FROM airbnb_sync_logs
WHERE status != 'success' OR reservations_failed > 0
ORDER BY started_at DESC
LIMIT 5;

-- 5c. Détail des erreurs (si présentes)
SELECT 
  sync_batch_id,
  started_at,
  jsonb_array_elements(errors) as erreur_detail
FROM airbnb_sync_logs
WHERE errors IS NOT NULL 
  AND jsonb_array_length(errors) > 0
ORDER BY started_at DESC
LIMIT 20;

-- 6. Tester si une réservation annulée bloque la disponibilité (ne devrait PAS bloquer)
DO $$
DECLARE
  cancelled_resa_id UUID;
  cancelled_loft_id UUID;
  cancelled_check_in DATE;
  cancelled_check_out DATE;
  is_available BOOLEAN;
BEGIN
  -- Prendre une réservation Airbnb annulée
  SELECT id, loft_id, check_in_date, check_out_date
  INTO cancelled_resa_id, cancelled_loft_id, cancelled_check_in, cancelled_check_out
  FROM reservations
  WHERE source = 'airbnb_scraper'
    AND status = 'cancelled'
  LIMIT 1;

  IF cancelled_resa_id IS NOT NULL THEN
    -- Vérifier la disponibilité pour cette période
    is_available := check_loft_availability(cancelled_loft_id, cancelled_check_in, cancelled_check_out);
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'TEST: Réservation annulée ne bloque PAS la disponibilité';
    RAISE NOTICE 'Réservation ID: %', cancelled_resa_id;
    RAISE NOTICE 'Loft ID: %', cancelled_loft_id;
    RAISE NOTICE 'Dates: % à %', cancelled_check_in, cancelled_check_out;
    RAISE NOTICE 'Disponible: % (devrait être TRUE)', is_available;
    
    IF NOT is_available THEN
      RAISE WARNING '❌ PROBLÈME: Une réservation annulée bloque encore la disponibilité!';
    ELSE
      RAISE NOTICE '✅ CORRECT: La réservation annulée ne bloque pas la disponibilité';
    END IF;
    RAISE NOTICE '======================================';
  ELSE
    RAISE NOTICE 'Aucune réservation Airbnb annulée trouvée pour le test';
  END IF;
END $$;

-- 7. Voir les réservations qui sont passées de 'confirmed' à 'cancelled'
-- (nécessite une table d'audit si disponible)
-- Cette requête est à titre informatif seulement
SELECT 
  'Pour voir l''historique des changements de statut, consulter la table audit_logs si elle existe' as note;

-- ================================================================
-- RÉSUMÉ ATTENDU
-- ================================================================

/*
COMPORTEMENT ATTENDU:

1. ✅ Les annulations Airbnb SONT synchronisées vers Supabase
2. ✅ Le statut 'cancelled' est correctement traduit depuis le français
3. ✅ Les réservations annulées n'affectent PAS les statistiques
4. ✅ Les réservations annulées NE BLOQUENT PAS la disponibilité
5. ✅ Les réservations annulées restent VISIBLES dans l'historique

Si vous ne voyez AUCUNE réservation annulée:
- Soit aucune réservation n'a été annulée sur Airbnb
- Soit le scraper Python ne capte pas le bon champ de statut
- Soit la synchronisation n'a pas été exécutée depuis l'annulation
*/
