-- Migration: Rendre reservation_id nullable pour les notifications de test
-- Date: 2026-06-01
-- Description: Permet de créer des notifications sans réservation réelle (pour les tests)

-- Modifier la colonne reservation_id pour la rendre nullable
ALTER TABLE airbnb_notifications 
ALTER COLUMN reservation_id DROP NOT NULL;

-- Commentaire pour expliquer pourquoi c'est nullable
COMMENT ON COLUMN airbnb_notifications.reservation_id IS 'ID de la réservation (nullable pour les notifications de test)';
