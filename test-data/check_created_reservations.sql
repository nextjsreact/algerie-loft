-- Vérifier les réservations créées par l'import Airbnb
SELECT 
    r.id,
    r.airbnb_confirmation_code,
    l.name as loft_name,
    r.guest_name,
    r.check_in_date,
    r.check_out_date,
    r.nights,  -- Devrait être calculé automatiquement
    r.guest_count,
    r.total_amount,
    r.currency_code,
    r.status,
    r.source,
    r.synced_at,
    r.created_at
FROM reservations r
LEFT JOIN lofts l ON r.loft_id = l.id
WHERE r.source = 'airbnb_scraper'
ORDER BY r.created_at DESC
LIMIT 10;

-- Vérifier les données dans la table staging
SELECT 
    id,
    airbnb_id,
    listing_id,
    guest_name,
    check_in_date,
    check_out_date,
    nights,
    mapping_status,
    validation_status,
    reconciliation_status,
    reconciliation_action,
    processed_at,
    sync_batch_id
FROM airbnb_reservations_staging
ORDER BY created_at DESC
LIMIT 10;
