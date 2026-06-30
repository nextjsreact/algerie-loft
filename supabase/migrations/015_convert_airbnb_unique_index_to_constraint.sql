-- Migration: 015_convert_airbnb_unique_index_to_constraint.sql
-- Description: Convertit l'UNIQUE INDEX partiel en vraie UNIQUE CONSTRAINT
--              pour que PostgREST supporte ON CONFLICT dans les upserts
-- Date: 2026-06-30
-- Raison: PostgREST ne peut pas utiliser un UNIQUE INDEX pour ON CONFLICT.
--         Il a besoin d'une vraie UNIQUE CONSTRAINT (dans pg_constraint).
--         Cela cause l'erreur:
--           "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Supprimer l'ancien UNIQUE INDEX partiel
DROP INDEX IF EXISTS idx_reservations_airbnb_code_unique;

-- Créer une vraie UNIQUE CONSTRAINT
-- PostgreSQL traite les NULLs comme distincts dans une UNIQUE CONSTRAINT,
-- donc plusieurs NULLs sont autorisés (même comportement que l'ancien index partiel)
ALTER TABLE reservations
  ADD CONSTRAINT uq_reservations_airbnb_confirmation_code
  UNIQUE (airbnb_confirmation_code);

-- Note: La migration est sûre car:
--   1. L'ancien index partiel empêchait déjà les doublons sur les non-NULLs
--   2. PostgreSQL permet déjà les NULLs multiples dans une UNIQUE CONSTRAINT
--   3. Aucune donnée existante ne sera affectée

COMMENT ON CONSTRAINT uq_reservations_airbnb_confirmation_code ON reservations
  IS 'Contrainte UNIQUE sur le code de confirmation Airbnb. Permet ON CONFLICT dans PostgREST.';
