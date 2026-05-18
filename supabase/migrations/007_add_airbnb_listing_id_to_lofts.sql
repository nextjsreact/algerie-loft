-- Migration: 007_add_airbnb_listing_id_to_lofts.sql
-- Description: Ajoute le mapping Airbnb listing_id dans la table lofts
-- Date: 2026-05-17

-- Ajouter la colonne airbnb_listing_id
ALTER TABLE lofts 
  ADD COLUMN IF NOT EXISTS airbnb_listing_id VARCHAR(50);

-- Ajouter une contrainte UNIQUE (un listing_id ne peut être associé qu'à un seul loft)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id_unique 
  ON lofts(airbnb_listing_id) 
  WHERE airbnb_listing_id IS NOT NULL;

-- Ajouter un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id 
  ON lofts(airbnb_listing_id);

-- Commentaire
COMMENT ON COLUMN lofts.airbnb_listing_id IS 'ID de l''annonce Airbnb (numérique). Utilisé pour mapper les réservations Airbnb aux lofts.';
