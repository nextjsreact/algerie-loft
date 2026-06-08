-- ================================================================
-- CORRECTION: Fonction check_loft_availability pour inclure TOUTES les réservations actives
-- ================================================================
-- 
-- PROBLÈME IDENTIFIÉ:
-- La fonction check_loft_availability ne vérifie que les statuts 'confirmed' et 'pending'
-- Elle ignore les réservations avec statut 'completed' même si elles sont en cours ou futures
-- 
-- SOLUTION:
-- Modifier la fonction pour vérifier TOUTES les réservations NON ANNULÉES
-- Une réservation bloque la disponibilité si:
-- - Son statut n'est PAS 'cancelled'
-- - Ses dates se chevauchent avec la période demandée
-- 
-- IMPACT:
-- - Les réservations Airbnb avec statut 'completed' bloqueront désormais la disponibilité
-- - Les réservations manuelles avec tout statut sauf 'cancelled' bloqueront la disponibilité
-- - Plus de risque de double réservation
-- 
-- ================================================================

CREATE OR REPLACE FUNCTION check_loft_availability(
    p_loft_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $BODY$
DECLARE
    manual_block_count INTEGER;
    reservation_count INTEGER;
BEGIN
    -- 1. Vérifier les blocages manuels dans loft_availability
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

    -- 2. Vérifier les réservations existantes
    -- CHANGEMENT IMPORTANT: On vérifie TOUTES les réservations NON ANNULÉES
    -- Au lieu de seulement 'confirmed' et 'pending'
    SELECT COUNT(*)
    INTO reservation_count
    FROM reservations
    WHERE loft_id = p_loft_id
      AND status != 'cancelled'  -- ✅ Changé: Toutes les réservations sauf annulées
      AND check_in_date < p_check_out
      AND check_out_date > p_check_in;

    -- Si au moins une réservation active se chevauche, le loft n'est pas disponible
    RETURN reservation_count = 0;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VÉRIFICATION: Tester la nouvelle fonction
-- ================================================================

-- Test 1: Vérifier qu'une réservation 'completed' bloque maintenant la disponibilité
DO $$
DECLARE
  test_loft_id UUID;
  test_check_in DATE;
  test_check_out DATE;
  is_available BOOLEAN;
  resa_status TEXT;
BEGIN
  -- Prendre une réservation Airbnb future (peu importe le statut)
  SELECT loft_id, check_in_date, check_out_date, status
  INTO test_loft_id, test_check_in, test_check_out, resa_status
  FROM reservations
  WHERE source = 'airbnb_scraper'
    AND check_in_date >= CURRENT_DATE
  LIMIT 1;

  IF test_loft_id IS NOT NULL THEN
    -- Tester la disponibilité pendant cette période
    is_available := check_loft_availability(test_loft_id, test_check_in, test_check_out);
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'TEST: Vérification disponibilité avec réservation existante';
    RAISE NOTICE 'Loft ID: %', test_loft_id;
    RAISE NOTICE 'Dates: % à %', test_check_in, test_check_out;
    RAISE NOTICE 'Statut réservation: %', resa_status;
    RAISE NOTICE 'Disponible: % (devrait être FALSE)', is_available;
    
    IF is_available THEN
      RAISE WARNING '❌ ÉCHEC: La période devrait être INDISPONIBLE!';
    ELSE
      RAISE NOTICE '✅ SUCCÈS: La fonction détecte correctement l''indisponibilité';
    END IF;
    RAISE NOTICE '======================================';
  ELSE
    RAISE NOTICE 'Aucune réservation Airbnb future trouvée pour le test';
  END IF;
END $$;

-- Test 2: Vérifier qu'une période sans réservation est disponible
DO $$
DECLARE
  test_loft_id UUID;
  far_future_date DATE := CURRENT_DATE + INTERVAL '5 years';
  is_available BOOLEAN;
BEGIN
  -- Prendre n'importe quel loft
  SELECT id INTO test_loft_id FROM lofts LIMIT 1;

  IF test_loft_id IS NOT NULL THEN
    -- Tester une période très lointaine (normalement disponible)
    is_available := check_loft_availability(test_loft_id, far_future_date, far_future_date + 1);
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'TEST: Vérification disponibilité sans réservation';
    RAISE NOTICE 'Loft ID: %', test_loft_id;
    RAISE NOTICE 'Dates: % à %', far_future_date, far_future_date + 1;
    RAISE NOTICE 'Disponible: % (devrait être TRUE)', is_available;
    
    IF NOT is_available THEN
      RAISE WARNING '❌ ÉCHEC: La période devrait être DISPONIBLE!';
    ELSE
      RAISE NOTICE '✅ SUCCÈS: La fonction détecte correctement la disponibilité';
    END IF;
    RAISE NOTICE '======================================';
  END IF;
END $$;

-- ================================================================
-- COMMENTAIRES FINAUX
-- ================================================================

COMMENT ON FUNCTION check_loft_availability IS 
'Vérifie la disponibilité d''un loft pour une période donnée.
Retourne FALSE si:
- Des dates sont bloquées manuellement dans loft_availability
- Une ou plusieurs réservations NON ANNULÉES se chevauchent avec la période

CHANGEMENT (2026-06-08): Modifié pour vérifier TOUTES les réservations non annulées,
au lieu de seulement ''confirmed'' et ''pending''. Cela inclut les réservations Airbnb
avec statut ''completed'' qui doivent également bloquer la disponibilité.';
