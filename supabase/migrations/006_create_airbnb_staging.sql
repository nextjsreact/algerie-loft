-- Migration: 006_create_airbnb_staging.sql
-- Description: Crée la table de staging pour validation et réconciliation des réservations Airbnb
-- Date: 2026-05-17

-- Créer la table de staging
CREATE TABLE IF NOT EXISTS airbnb_reservations_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiants Airbnb
  airbnb_id VARCHAR(50) NOT NULL,
  listing_id VARCHAR(50) NOT NULL,
  
  -- Données brutes (pour debugging et replay)
  raw_data JSONB NOT NULL,
  
  -- Données parsées
  guest_name VARCHAR(255),
  guest_count INTEGER,
  check_in_date DATE,
  check_out_date DATE,
  nights INTEGER,
  base_price DECIMAL(10,2),
  cleaning_fee DECIMAL(10,2),
  service_fee DECIMAL(10,2),
  taxes DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency_code VARCHAR(10),
  status VARCHAR(50),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  guest_nationality VARCHAR(10),
  special_requests TEXT,
  
  -- Mapping et validation
  loft_id UUID REFERENCES lofts(id),
  mapping_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'mapped', 'failed'
  validation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'valid', 'invalid'
  validation_errors JSONB,
  
  -- Réconciliation avec reservations
  reservation_id UUID REFERENCES reservations(id),
  reconciliation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'created', 'updated', 'skipped', 'failed'
  reconciliation_action VARCHAR(50), -- 'create', 'update', 'skip'
  reconciliation_error TEXT,
  
  -- Métadonnées de synchronisation
  sync_type VARCHAR(50), -- 'ical_watcher', 'targeted', 'full', 'manual'
  sync_batch_id UUID, -- Pour grouper les syncs
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  -- Contrainte d'unicité (même réservation peut être reçue plusieurs fois)
  UNIQUE(airbnb_id, created_at)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_staging_airbnb_id ON airbnb_reservations_staging(airbnb_id);
CREATE INDEX IF NOT EXISTS idx_staging_listing_id ON airbnb_reservations_staging(listing_id);
CREATE INDEX IF NOT EXISTS idx_staging_loft_id ON airbnb_reservations_staging(loft_id);
CREATE INDEX IF NOT EXISTS idx_staging_reconciliation_status ON airbnb_reservations_staging(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_staging_created_at ON airbnb_reservations_staging(created_at);
CREATE INDEX IF NOT EXISTS idx_staging_sync_batch ON airbnb_reservations_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_mapping_status ON airbnb_reservations_staging(mapping_status);
CREATE INDEX IF NOT EXISTS idx_staging_validation_status ON airbnb_reservations_staging(validation_status);

-- Commentaires
COMMENT ON TABLE airbnb_reservations_staging IS 'Table de staging pour validation et réconciliation des réservations Airbnb';
COMMENT ON COLUMN airbnb_reservations_staging.raw_data IS 'Données JSON brutes du scraper (pour debugging et replay)';
COMMENT ON COLUMN airbnb_reservations_staging.mapping_status IS 'Statut du mapping listing_id → loft_id';
COMMENT ON COLUMN airbnb_reservations_staging.validation_status IS 'Statut de la validation des données';
COMMENT ON COLUMN airbnb_reservations_staging.reconciliation_status IS 'Statut de la réconciliation avec la table reservations';
COMMENT ON COLUMN airbnb_reservations_staging.sync_batch_id IS 'UUID pour grouper les réservations d''un même sync';
