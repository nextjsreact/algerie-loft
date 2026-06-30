-- ============================================================================
-- SCRIPT CONSOLIDÉ: Application de toutes les migrations Airbnb
-- ============================================================================
-- Date: 2026-05-28
-- Description: Applique les migrations 005 à 009 pour supporter l'intégration Airbnb
-- Usage: Copier-coller dans Supabase SQL Editor (environnement DEV uniquement)
-- ============================================================================

-- ============================================================================
-- MIGRATION 005: Étendre la table reservations pour Airbnb
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔧 Migration 005: Extension de la table reservations...';
END $$;

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

-- Commentaires pour documentation
COMMENT ON COLUMN reservations.source IS 'Source de la réservation: manual, airbnb_scraper, booking_com, etc.';
COMMENT ON COLUMN reservations.airbnb_confirmation_code IS 'Code de confirmation Airbnb (ex: HMABCD123). UNIQUE pour éviter les doublons.';
COMMENT ON COLUMN reservations.synced_at IS 'Date de dernière synchronisation avec Airbnb. NULL pour les réservations manuelles.';

-- Mettre à jour les réservations existantes avec source='manual'
UPDATE reservations 
SET source = 'manual' 
WHERE source IS NULL;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 005 terminée';
END $$;

-- ============================================================================
-- MIGRATION 006: Créer la table airbnb_reservations_staging
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔧 Migration 006: Création de la table de staging...';
END $$;

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
  mapping_status VARCHAR(50) DEFAULT 'pending',
  validation_status VARCHAR(50) DEFAULT 'pending',
  validation_errors JSONB,
  
  -- Réconciliation avec reservations
  reservation_id UUID REFERENCES reservations(id),
  reconciliation_status VARCHAR(50) DEFAULT 'pending',
  reconciliation_action VARCHAR(50),
  reconciliation_error TEXT,
  
  -- Métadonnées de synchronisation
  sync_type VARCHAR(50),
  sync_batch_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  -- Contrainte d'unicité
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

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 006 terminée';
END $$;

-- ============================================================================
-- MIGRATION 007: Ajouter airbnb_listing_id à la table lofts
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔧 Migration 007: Ajout de airbnb_listing_id aux lofts...';
END $$;

-- Ajouter la colonne airbnb_listing_id
ALTER TABLE lofts 
  ADD COLUMN IF NOT EXISTS airbnb_listing_id VARCHAR(50);

-- Ajouter une contrainte UNIQUE
CREATE UNIQUE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id_unique 
  ON lofts(airbnb_listing_id) 
  WHERE airbnb_listing_id IS NOT NULL;

-- Ajouter un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_lofts_airbnb_listing_id 
  ON lofts(airbnb_listing_id);

-- Commentaire
COMMENT ON COLUMN lofts.airbnb_listing_id IS 'ID de l''annonce Airbnb (numérique). Utilisé pour mapper les réservations Airbnb aux lofts.';

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 007 terminée';
END $$;

-- ============================================================================
-- MIGRATION 008: Créer la table airbnb_sync_logs
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔧 Migration 008: Création de la table de logs...';
END $$;

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS airbnb_sync_logs CASCADE;

-- Créer la table de logs
CREATE TABLE airbnb_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de synchronisation
  sync_type VARCHAR(50) NOT NULL,
  sync_batch_id UUID NOT NULL,
  
  -- Statut
  status VARCHAR(50) NOT NULL,
  
  -- Métriques
  lofts_processed INTEGER DEFAULT 0,
  reservations_received INTEGER DEFAULT 0,
  reservations_created INTEGER DEFAULT 0,
  reservations_updated INTEGER DEFAULT 0,
  reservations_skipped INTEGER DEFAULT 0,
  reservations_failed INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  
  -- Erreurs et avertissements
  errors JSONB,
  warnings JSONB,
  
  -- Timestamps
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Performance
  duration_ms INTEGER,
  
  -- Métadonnées
  script_version VARCHAR(50),
  triggered_by VARCHAR(50)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON airbnb_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON airbnb_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON airbnb_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_batch_id ON airbnb_sync_logs(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON airbnb_sync_logs(created_at);

-- Commentaires
COMMENT ON TABLE airbnb_sync_logs IS 'Logs de synchronisation Airbnb pour monitoring et debugging';

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 008 terminée';
END $$;

-- ============================================================================
-- MIGRATION 009: Créer la table airbnb_conflicts
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔧 Migration 009: Création de la table de conflits...';
END $$;

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS airbnb_conflicts CASCADE;

-- Créer la table de conflits
CREATE TABLE airbnb_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Loft concerné
  loft_id UUID REFERENCES lofts(id) NOT NULL,
  
  -- Réservations en conflit
  reservation_1_id UUID REFERENCES reservations(id) NOT NULL,
  reservation_2_id UUID REFERENCES reservations(id) NOT NULL,
  
  -- Période de chevauchement
  overlap_start DATE NOT NULL,
  overlap_end DATE NOT NULL,
  overlap_nights INTEGER NOT NULL,
  
  -- Sévérité
  severity VARCHAR(50) NOT NULL,
  
  -- Statut
  status VARCHAR(50) DEFAULT 'open',
  
  -- Résolution
  resolved_at TIMESTAMP,
  resolved_by UUID,
  resolution_notes TEXT,
  
  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_conflicts_loft_id ON airbnb_conflicts(loft_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON airbnb_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON airbnb_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_conflicts_created_at ON airbnb_conflicts(created_at);
CREATE INDEX IF NOT EXISTS idx_conflicts_reservation_1 ON airbnb_conflicts(reservation_1_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_reservation_2 ON airbnb_conflicts(reservation_2_id);

-- Contrainte pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_conflicts_unique 
  ON airbnb_conflicts(
    LEAST(reservation_1_id, reservation_2_id),
    GREATEST(reservation_1_id, reservation_2_id)
  );

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_airbnb_conflicts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_airbnb_conflicts_updated_at
  BEFORE UPDATE ON airbnb_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_airbnb_conflicts_updated_at();

-- Commentaires
COMMENT ON TABLE airbnb_conflicts IS 'Conflits de réservation détectés automatiquement (chevauchement de dates)';

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 009 terminée';
END $$;

-- ============================================================================
-- MIGRATION 015: Convertir UNIQUE INDEX → UNIQUE CONSTRAINT pour PostgREST
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '🔧 Migration 015: Conversion UNIQUE INDEX → UNIQUE CONSTRAINT...';
END $$;

-- Supprimer l'ancien UNIQUE INDEX partiel (créé dans migration 005)
DROP INDEX IF EXISTS idx_reservations_airbnb_code_unique;

-- Créer une vraie UNIQUE CONSTRAINT pour que PostgREST supporte ON CONFLICT
-- PostgreSQL traite les NULLs comme distincts (comme l'ancien index partiel)
ALTER TABLE reservations
  ADD CONSTRAINT uq_reservations_airbnb_confirmation_code
  UNIQUE (airbnb_confirmation_code);

COMMENT ON CONSTRAINT uq_reservations_airbnb_confirmation_code ON reservations
  IS 'Contrainte UNIQUE sur le code de confirmation Airbnb. Permet ON CONFLICT dans PostgREST.';

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 015 terminée';
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ TOUTES LES MIGRATIONS AIRBNB ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Vérification des colonnes ajoutées:';
END $$;

-- Vérifier que les colonnes existent dans reservations
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at')
ORDER BY column_name;

-- Vérifier que les tables ont été créées
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables créées:';
END $$;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN (
  'airbnb_reservations_staging',
  'airbnb_sync_logs',
  'airbnb_conflicts'
)
ORDER BY table_name;

-- Vérifier la colonne airbnb_listing_id dans lofts
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Colonne airbnb_listing_id dans lofts:';
END $$;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lofts'
  AND column_name = 'airbnb_listing_id';

-- ============================================================================
-- PROCHAINES ÉTAPES
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '1. Relancer la synchronisation avec: python scripts/transform-and-send-airbnb-data.py';
  RAISE NOTICE '2. Vérifier les données avec: supabase/migrations/verify_airbnb_import.sql';
  RAISE NOTICE '3. Mapper les 102 annonces Airbnb avec les lofts (colonne airbnb_listing_id)';
  RAISE NOTICE '';
END $$;
