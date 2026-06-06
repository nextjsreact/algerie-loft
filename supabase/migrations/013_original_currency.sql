-- ============================================================================
-- Migration 013: Trace de la devise source avant conversion en DA
-- ============================================================================
-- Ajoute 2 colonnes à reservations pour préserver la devise d'origine
-- (ex: "GBP 100" même après conversion en DA "27 000 DA")
-- Utile pour audit, transparence utilisateur, et conversion manuelle ultérieure
-- ============================================================================

-- 1. Colonnes de traçabilité devise source
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS original_currency_code VARCHAR(3),
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10,2);

COMMENT ON COLUMN reservations.original_currency_code IS
  'Devise source avant conversion en DZD (GBP, EUR, USD, CAD...). NULL si réservation manuelle en DA ou devise déjà DZD.';
COMMENT ON COLUMN reservations.original_amount IS
  'Montant original dans original_currency_code (avant conversion en DA). NULL si N/A.';

-- Index partiel pour les requêtes d'audit (devises étrangères uniquement)
CREATE INDEX IF NOT EXISTS idx_reservations_original_currency
  ON reservations(original_currency_code)
  WHERE original_currency_code IS NOT NULL AND original_currency_code != 'DZD';

-- 2. Backfill best-effort depuis airbnb_reservations_staging
--    (uniquement pour les réservations Airbnb qui ont une correspondance dans le staging)
UPDATE reservations r
SET
  original_currency_code = s.currency_code,
  original_amount = s.total_amount
FROM airbnb_reservations_staging s
WHERE s.airbnb_id = r.airbnb_confirmation_code
  AND r.original_currency_code IS NULL
  AND s.currency_code IS NOT NULL
  AND s.total_amount IS NOT NULL
  AND s.currency_code != 'DZD';

-- 3. Vérification
DO $$
DECLARE
  v_total INTEGER;
  v_backfilled INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM reservations WHERE airbnb_confirmation_code IS NOT NULL;
  SELECT COUNT(*) INTO v_backfilled FROM reservations WHERE original_currency_code IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Migration 013 appliquée';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '📊 Total réservations Airbnb : %', v_total;
  RAISE NOTICE '💱 Avec devise source préservée : %', v_backfilled;
  RAISE NOTICE '⚠️  Sans devise source (NULL) : %', v_total - v_backfilled;
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END $$;
