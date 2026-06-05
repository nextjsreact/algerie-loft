-- Migration: 012_normalize_guest_phone_na_to_null.sql
-- Description: Normalise les 'N/A' (sentinelle scraper) en NULL dans guest_phone
--              pour avoir un etat propre : NULL = pas de numero, STRING = numero reel
-- Date: 2026-06-03
-- ⚠️  A EXECUTER APRES 010 et 011

-- ============================================================================
-- 1) AVANT
-- ============================================================================
SELECT
  'AVANT' AS etape,
  COUNT(*) FILTER (WHERE guest_phone = 'N/A')   AS na,
  COUNT(*) FILTER (WHERE guest_phone IS NULL)    AS null_val,
  COUNT(*) FILTER (WHERE guest_phone IS NOT NULL
                    AND guest_phone <> 'N/A')    AS real_value
FROM reservations;

-- ============================================================================
-- 2) NORMALISATION
-- ============================================================================
UPDATE reservations
SET guest_phone = NULL
WHERE guest_phone = 'N/A';

-- ============================================================================
-- 3) APRES
-- ============================================================================
SELECT
  'APRES' AS etape,
  COUNT(*) FILTER (WHERE guest_phone = 'N/A')   AS na,
  COUNT(*) FILTER (WHERE guest_phone IS NULL)    AS null_val,
  COUNT(*) FILTER (WHERE guest_phone IS NOT NULL
                    AND guest_phone <> 'N/A')    AS real_value
FROM reservations;

-- ============================================================================
-- Note : la logique du sync service (lib/services/airbnb-sync-service-optimized.ts)
-- a deja ete mise a jour pour ne plus JAMAIS inserer 'N/A'.
-- Les futurs syncs utiliseront directement NULL quand le telephone est absent.
-- ============================================================================
