-- Migration: 007_make_guest_fields_nullable.sql
-- Description: Rend guest_email et guest_nationality nullable dans reservations
--              car le scraper Airbnb ne peut pas récupérer ces données
-- Date: 2026-05-21
-- Dépend de: 005_extend_reservations_for_airbnb.sql

-- ============================================================================
-- PROBLÈME
-- ============================================================================
-- Le scraper Airbnb ne peut pas extraire les emails et nationalités des
-- voyageurs (Airbnb obfusque ces données). Le sync service envoie null
-- quand ces champs sont vides, mais la contrainte NOT NULL rejette l'insertion.
--
-- SOLUTION: Rendre ces colonnes nullable avec une valeur par défaut vide.
-- ============================================================================

-- Rendre guest_email nullable
ALTER TABLE reservations
  ALTER COLUMN guest_email DROP NOT NULL;

-- Rendre guest_nationality nullable
ALTER TABLE reservations
  ALTER COLUMN guest_nationality DROP NOT NULL;

-- Optionnel: mettre à jour les commentaires
COMMENT ON COLUMN reservations.guest_email IS 'Email du voyageur. NULL si non disponible (scraping Airbnb).';
COMMENT ON COLUMN reservations.guest_nationality IS 'Nationalité du voyageur (code ISO 2 lettres). NULL si non disponible.';
