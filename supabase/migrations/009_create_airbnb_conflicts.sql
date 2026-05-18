-- Migration: 009_create_airbnb_conflicts.sql
-- Description: Crée la table pour gérer les conflits de réservation
-- Date: 2026-05-17

-- Supprimer la table si elle existe (pour éviter les problèmes de cache)
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
  severity VARCHAR(50) NOT NULL, -- 'critical', 'warning', 'info'
  
  -- Statut
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'false_positive'
  
  -- Résolution
  resolved_at TIMESTAMP,
  resolved_by UUID, -- Référence à auth.users (pas de FK pour éviter les problèmes)
  resolution_notes TEXT,
  
  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_conflicts_loft_id ON airbnb_conflicts(loft_id);
CREATE INDEX idx_conflicts_status ON airbnb_conflicts(status);
CREATE INDEX idx_conflicts_severity ON airbnb_conflicts(severity);
CREATE INDEX idx_conflicts_created_at ON airbnb_conflicts(created_at);
CREATE INDEX idx_conflicts_reservation_1 ON airbnb_conflicts(reservation_1_id);
CREATE INDEX idx_conflicts_reservation_2 ON airbnb_conflicts(reservation_2_id);

-- Contrainte pour éviter les doublons (même conflit dans les deux sens)
CREATE UNIQUE INDEX idx_conflicts_unique 
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
COMMENT ON COLUMN airbnb_conflicts.severity IS 'critical: 2 confirmées, warning: 1 pending, info: 1 cancelled';
COMMENT ON COLUMN airbnb_conflicts.overlap_nights IS 'Nombre de nuits en chevauchement';
COMMENT ON COLUMN airbnb_conflicts.notification_sent IS 'True si une notification a été envoyée à l''admin';
