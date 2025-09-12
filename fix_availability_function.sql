-- Version corrigée de la fonction de vérification de disponibilité
-- Copiez l'intégralité de ce fichier et exécutez-le dans l'éditeur SQL de Supabase.

CREATE OR REPLACE FUNCTION check_loft_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    manual_block_count INTEGER;
    reservation_count INTEGER;
BEGIN
    -- First, check for manually blocked dates in loft_availability
    SELECT COUNT(*)
    INTO manual_block_count
    FROM loft_availability
    WHERE loft_id = p_loft_id
      AND date >= p_check_in
      AND date < p_check_out
      AND is_available = false;

    IF manual_block_count > 0 THEN
        RETURN FALSE;
    END IF;

    -- Second, check for overlapping reservations
    SELECT COUNT(*)
    INTO reservation_count
    FROM reservations
    WHERE loft_id = p_loft_id
      AND status IN ('confirmed', 'pending')
      -- An existing reservation overlaps if its start date is before the new end date,
      -- AND its end date is after the new start date.
      AND check_in_date < p_check_out
      AND check_out_date > p_check_in;

    -- The loft is available only if there are no manual blocks AND no overlapping reservations.
    RETURN reservation_count = 0;
END;
$$ LANGUAGE plpgsql;
