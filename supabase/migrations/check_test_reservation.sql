-- Vérifier où se trouve la réservation de test HMTEST3207

-- 1. Dans la table principale reservations
SELECT 'reservations' as table_name, id, guest_name, check_in_date, check_out_date, status, source, airbnb_confirmation_code
FROM reservations 
WHERE airbnb_confirmation_code LIKE 'HMTEST%'
ORDER BY created_at DESC;

-- 2. Dans la table de staging
SELECT 'staging' as table_name, airbnb_id, guest_name, check_in_date, check_out_date, status, 
       mapping_status, validation_status, reconciliation_status, loft_id
FROM airbnb_reservations_staging 
WHERE airbnb_id LIKE 'HMTEST%'
ORDER BY created_at DESC;

-- 3. Dans les logs de sync
SELECT sync_batch_id, sync_type, status, reservations_received, reservations_created, 
       reservations_updated, reservations_failed, conflicts_detected, errors
FROM airbnb_sync_logs 
ORDER BY started_at DESC 
LIMIT 5;

-- 4. Dans les conflits
SELECT id, loft_id, reservation_1_id, reservation_2_id, overlap_start, overlap_end, 
       overlap_nights, severity, status, created_at
FROM airbnb_conflicts 
ORDER BY created_at DESC 
LIMIT 10;
