-- Migration: 011_cleanup_bad_guest_phones.sql
-- Description: Nettoie les guest_phone corrompus (non-phones, non-vides)
--              qui se sont accumules avant la validation cote scraper (migration 010)
-- Date: 2026-06-03
-- ⚠️  A EXECUTER APRES LA MIGRATION 010 (qui cree airbnb_sync_log_reservations)

-- ============================================================================
-- 1) AVANT nettoyage : statistiques (executer d'abord pour verifier l'etendue)
-- ============================================================================
SELECT
  'AVANT nettoyage' AS etape,
  COUNT(*) FILTER (WHERE guest_phone = 'true')        AS val_true,
  COUNT(*) FILTER (WHERE guest_phone = 'false')       AS val_false,
  COUNT(*) FILTER (WHERE guest_phone = 'N/A')         AS val_na,
  COUNT(*) FILTER (WHERE LENGTH(REGEXP_REPLACE(COALESCE(guest_phone,''), '\D', '', 'g')) < 5
                    AND guest_phone IS NOT NULL AND guest_phone <> '') AS val_no_digits
FROM reservations;

-- ============================================================================
-- 2) NETTOYAGE
--    Regle : on supprime (NULL) tout guest_phone qui ne contient aucun chiffre
--            SAUF la valeur sentinelle 'N/A' qu'on garde (legitime : "tente de
--            recuperer, pas de numero trouve")
-- ============================================================================
UPDATE reservations
SET guest_phone = NULL
WHERE guest_phone IS NOT NULL
  AND guest_phone <> ''
  AND guest_phone <> 'N/A'
  AND LENGTH(REGEXP_REPLACE(guest_phone, '\D', '', 'g')) < 5;

-- ============================================================================
-- 3) APRES nettoyage : verification
-- ============================================================================
SELECT
  'APRES nettoyage' AS etape,
  COUNT(*) FILTER (WHERE guest_phone = 'true')        AS val_true,
  COUNT(*) FILTER (WHERE guest_phone = 'false')       AS val_false,
  COUNT(*) FILTER (WHERE guest_phone = 'N/A')         AS val_na,
  COUNT(*) FILTER (WHERE LENGTH(REGEXP_REPLACE(COALESCE(guest_phone,''), '\D', '', 'g')) < 5
                    AND guest_phone IS NOT NULL AND guest_phone <> '') AS val_no_digits
FROM reservations;

-- ============================================================================
-- 4) Bonus : si tu veux aussi normaliser 'N/A' -> NULL pour avoir un etat propre
--    (decommente si souhaite, mais cela supprime l'info "on a cherche mais pas trouve")
-- ============================================================================
-- UPDATE reservations
-- SET guest_phone = NULL
-- WHERE guest_phone = 'N/A';
