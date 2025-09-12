CREATE OR REPLACE FUNCTION check_loft_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $BODY$
DECLARE
    manual_block_count INTEGER;
    reservation_count INTEGER;
BEGIN
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

    SELECT COUNT(*)
    INTO reservation_count
    FROM reservations
    WHERE loft_id = p_loft_id
      AND status IN ('confirmed', 'pending')
      AND check_in_date < p_check_out
      AND check_out_date > p_check_in;

    RETURN reservation_count = 0;
END;
$BODY$ LANGUAGE plpgsql;
