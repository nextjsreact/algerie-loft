-- Migration: 008_create_airbnb_sync_logs.sql
-- Description: Crée la table de logs pour le monitoring des synchronisations Airbnb
-- Date: 2026-05-17

-- Supprimer la table si elle existe (pour éviter les problèmes de cache)
DROP TABLE IF EXISTS airbnb_sync_logs CASCADE;

-- Créer la table de logs
CREATE TABLE airbnb_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de synchronisation
  sync_type VARCHAR(50) NOT NULL, -- 'ical_watcher', 'targeted', 'full', 'manual'
  sync_batch_id UUID NOT NULL,
  
  -- Statut
  status VARCHAR(50) NOT NULL, -- 'started', 'success', 'partial', 'failed'
  
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
  triggered_by VARCHAR(50) -- 'cron', 'manual', 'api', 'ical_watcher'
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON airbnb_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON airbnb_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON airbnb_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_batch_id ON airbnb_sync_logs(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON airbnb_sync_logs(created_at);

-- Commentaires
COMMENT ON TABLE airbnb_sync_logs IS 'Logs de synchronisation Airbnb pour monitoring et debugging';
COMMENT ON COLUMN airbnb_sync_logs.sync_batch_id IS 'UUID unique pour identifier un batch de synchronisation';
COMMENT ON COLUMN airbnb_sync_logs.errors IS 'Tableau JSON des erreurs rencontrées pendant le sync';
COMMENT ON COLUMN airbnb_sync_logs.warnings IS 'Tableau JSON des avertissements (ex: listing_id non mappé)';
COMMENT ON COLUMN airbnb_sync_logs.duration_ms IS 'Durée du sync en millisecondes';
