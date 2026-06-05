-- Migration: Créer la table des notifications Airbnb
-- Date: 2026-06-01
-- Description: Table pour stocker les notifications des nouvelles réservations Airbnb

-- Créer la table airbnb_notifications
CREATE TABLE IF NOT EXISTS airbnb_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  loft_id UUID REFERENCES lofts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('new', 'updated', 'cancelled', 'conflict', 'error')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour les requêtes rapides (notifications non lues)
CREATE INDEX idx_airbnb_notifications_unread 
ON airbnb_notifications(is_read, created_at DESC) 
WHERE is_read = FALSE;

-- Index pour les requêtes par loft
CREATE INDEX idx_airbnb_notifications_loft 
ON airbnb_notifications(loft_id, created_at DESC);

-- Index pour les requêtes par réservation
CREATE INDEX idx_airbnb_notifications_reservation 
ON airbnb_notifications(reservation_id);

-- Index pour les requêtes par type
CREATE INDEX idx_airbnb_notifications_type 
ON airbnb_notifications(type, created_at DESC);

-- Commentaires pour la documentation
COMMENT ON TABLE airbnb_notifications IS 'Notifications pour les événements liés aux réservations Airbnb';
COMMENT ON COLUMN airbnb_notifications.type IS 'Type de notification: new, updated, cancelled, conflict, error';
COMMENT ON COLUMN airbnb_notifications.metadata IS 'Données JSON supplémentaires (guest_name, dates, prix, etc.)';
COMMENT ON COLUMN airbnb_notifications.is_read IS 'Indique si la notification a été lue par un admin';

-- Fonction pour nettoyer les anciennes notifications (> 90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_airbnb_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM airbnb_notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND is_read = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Créer une politique RLS pour les admins uniquement
ALTER TABLE airbnb_notifications ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent voir les notifications
CREATE POLICY "Admins can view all notifications"
ON airbnb_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Politique: Seuls les admins peuvent marquer comme lu
CREATE POLICY "Admins can update notifications"
ON airbnb_notifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Politique: Le système peut créer des notifications
CREATE POLICY "System can insert notifications"
ON airbnb_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
