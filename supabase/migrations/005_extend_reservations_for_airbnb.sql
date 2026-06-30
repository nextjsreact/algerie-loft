-- Migration: 005_extend_reservations_for_airbnb.sql
-- Description: Étend la table reservations pour supporter les données Airbnb
-- Date: 2026-05-17
-- Note: Plusieurs champs existent déjà (guest_email, guest_nationality, base_price, 
--       cleaning_fee, service_fee, taxes, special_requests)
--       Cette migration ajoute SEULEMENT les 3 champs manquants

-- ============================================================================
-- ANALYSE DES CHAMPS EXISTANTS
-- ============================================================================
-- ✅ Champs déjà présents (pas besoin d'ajouter):
--    - guest_email VARCHAR(255) NOT NULL
--    - guest_nationality VARCHAR(100) NOT NULL
--    - base_price NUMERIC(10,2) NOT NULL
--    - cleaning_fee NUMERIC(10,2) DEFAULT 0
--    - service_fee NUMERIC(10,2) DEFAULT 0
--    - taxes NUMERIC(10,2) DEFAULT 0
--    - special_requests TEXT
--
-- ➕ Champs à ajouter:
--    - source VARCHAR(50) DEFAULT 'manual'
--    - airbnb_confirmation_code VARCHAR(50)
--    - synced_at TIMESTAMP
-- ============================================================================

-- Ajouter les 3 colonnes manquantes
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS airbnb_confirmation_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;

-- Ajouter une contrainte UNIQUE sur airbnb_confirmation_code
-- NOTE: On utilise UNIQUE CONSTRAINT (pas UNIQUE INDEX) pour que PostgREST
--       puisse utiliser ON CONFLICT dans les upserts du sync service.
--       PostgreSQL permet les NULLs multiples dans une UNIQUE CONSTRAINT.
ALTER TABLE reservations
  ADD CONSTRAINT uq_reservations_airbnb_confirmation_code
  UNIQUE (airbnb_confirmation_code);

-- Ajouter les indexes pour performance
CREATE INDEX IF NOT EXISTS idx_reservations_source 
  ON reservations(source);

CREATE INDEX IF NOT EXISTS idx_reservations_synced_at 
  ON reservations(synced_at);

-- Note: La contrainte check_total_amount_consistency existe déjà via positive_amounts
-- Pas besoin de l'ajouter

-- Commentaires pour documentation (nouveaux champs uniquement)
COMMENT ON COLUMN reservations.source IS 'Source de la réservation: manual, airbnb_scraper, booking_com, etc.';
COMMENT ON COLUMN reservations.airbnb_confirmation_code IS 'Code de confirmation Airbnb (ex: HMABCD123). UNIQUE pour éviter les doublons.';
COMMENT ON COLUMN reservations.synced_at IS 'Date de dernière synchronisation avec Airbnb. NULL pour les réservations manuelles.';

-- Mettre à jour les réservations existantes avec source='manual'
-- (déjà fait par DEFAULT 'manual', mais on s'assure que les anciennes lignes sont mises à jour)
UPDATE reservations 
SET source = 'manual' 
WHERE source IS NULL;
