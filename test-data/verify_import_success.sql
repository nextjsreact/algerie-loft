-- ✅ VÉRIFICATION DE L'IMPORT RÉUSSI
-- Batch ID: 44d52471-5a89-4dcb-84ca-5a84d6aa39d3

-- 1. Vérifier les 2 réservations créées
SELECT 
    r.id,
    r.airbnb_confirmation_code,
    l.name as loft_name,
    l.airbnb_listing_id,
    r.guest_name,
    r.guest_phone,
    r.check_in_date,
    r.check_out_date,
    r.nights,  -- Devrait être calculé automatiquement (4 et 5)
    r.guest_count,
    r.total_amount,
    r.currency_code,
    r.status,
    r.source,
    r.synced_at,
    r.created_at
FROM reservations r
LEFT JOIN lofts l ON r.loft_id = l.id
WHERE r.airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002')
ORDER BY r.airbnb_confirmation_code;

-- 2. Vérifier les données dans la table staging
SELECT 
    id,
    airbnb_id,
    listing_id,
    guest_name,
    guest_phone,
    check_in_date,
    check_out_date,
    nights,
    total_amount,
    loft_id,
    mapping_status,
    validation_status,
    reconciliation_status,
    reconciliation_action,
    reservation_id,
    processed_at,
    sync_batch_id
FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
ORDER BY airbnb_id;

-- 3. Vérifier le conflit détecté
SELECT 
    c.id,
    l.name as loft_name,
    r1.airbnb_confirmation_code as reservation_1,
    r1.check_in_date as res1_checkin,
    r1.check_out_date as res1_checkout,
    r2.airbnb_confirmation_code as reservation_2,
    r2.check_in_date as res2_checkin,
    r2.check_out_date as res2_checkout,
    c.overlap_start,
    c.overlap_end,
    c.overlap_nights,
    c.severity,
    c.status,
    c.created_at
FROM airbnb_conflicts c
LEFT JOIN lofts l ON c.loft_id = l.id
LEFT JOIN reservations r1 ON c.reservation_1_id = r1.id
LEFT JOIN reservations r2 ON c.reservation_2_id = r2.id
WHERE c.loft_id = (SELECT id FROM lofts WHERE airbnb_listing_id = '12345678')
ORDER BY c.created_at DESC
LIMIT 5;

-- 4. Vérifier les logs de synchronisation
SELECT 
    id,
    sync_type,
    sync_batch_id,
    status,
    reservations_received,
    reservations_created,
    reservations_updated,
    reservations_skipped,
    reservations_failed,
    conflicts_detected,
    duration_ms,
    started_at,
    completed_at,
    script_version
FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';
