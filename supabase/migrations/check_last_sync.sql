-- Vérifier le dernier sync (batch ID: 60bfc9f9-41a9-4980-b7e6-99f26bb81b20)

SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_received,
  reservations_created,
  reservations_updated,
  reservations_skipped,
  reservations_failed,
  conflicts_detected,
  errors,
  warnings,
  started_at,
  completed_at,
  duration_ms
FROM airbnb_sync_logs 
WHERE sync_batch_id = '60bfc9f9-41a9-4980-b7e6-99f26bb81b20'
   OR started_at > NOW() - INTERVAL '10 minutes'
ORDER BY started_at DESC;

-- Vérifier toutes les réservations HMTEST récentes
SELECT 
  airbnb_id,
  guest_name,
  check_in_date,
  check_out_date,
  status,
  mapping_status,
  validation_status,
  reconciliation_status,
  reconciliation_error,
  sync_batch_id,
  created_at
FROM airbnb_reservations_staging 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Vérifier les réservations dans la table principale créées récemment
SELECT 
  id,
  guest_name,
  check_in_date,
  check_out_date,
  status,
  source,
  airbnb_confirmation_code,
  created_at
FROM reservations 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
