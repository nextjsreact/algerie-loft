-- Migration pour ajouter ON DELETE CASCADE aux foreign keys Airbnb
-- Permet la suppression de réservations Airbnb sans erreur de violation de contrainte

-- 1. Supprimer les anciennes contraintes dans airbnb_reservations_staging
ALTER TABLE IF EXISTS airbnb_reservations_staging
  DROP CONSTRAINT IF EXISTS airbnb_reservations_staging_reservation_id_fkey;

-- 2. Ajouter la nouvelle contrainte avec ON DELETE SET NULL
-- (SET NULL au lieu de CASCADE car on veut garder l'historique de staging)
ALTER TABLE IF EXISTS airbnb_reservations_staging
  ADD CONSTRAINT airbnb_reservations_staging_reservation_id_fkey
  FOREIGN KEY (reservation_id)
  REFERENCES reservations(id)
  ON DELETE SET NULL;

-- 3. Supprimer les anciennes contraintes dans airbnb_conflicts
ALTER TABLE IF EXISTS airbnb_conflicts
  DROP CONSTRAINT IF EXISTS airbnb_conflicts_reservation_1_id_fkey;

ALTER TABLE IF EXISTS airbnb_conflicts
  DROP CONSTRAINT IF EXISTS airbnb_conflicts_reservation_2_id_fkey;

-- 4. Ajouter les nouvelles contraintes avec ON DELETE CASCADE
-- (CASCADE car si une réservation est supprimée, le conflit n'a plus de sens)
ALTER TABLE IF EXISTS airbnb_conflicts
  ADD CONSTRAINT airbnb_conflicts_reservation_1_id_fkey
  FOREIGN KEY (reservation_1_id)
  REFERENCES reservations(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS airbnb_conflicts
  ADD CONSTRAINT airbnb_conflicts_reservation_2_id_fkey
  FOREIGN KEY (reservation_2_id)
  REFERENCES reservations(id)
  ON DELETE CASCADE;

-- 5. Vérifier que airbnb_notifications a déjà ON DELETE CASCADE (normalement oui)
-- Si la contrainte n'existe pas ou est incorrecte, la corriger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'airbnb_notifications_reservation_id_fkey'
    AND table_name = 'airbnb_notifications'
  ) THEN
    ALTER TABLE airbnb_notifications
      DROP CONSTRAINT airbnb_notifications_reservation_id_fkey;
  END IF;
  
  ALTER TABLE airbnb_notifications
    ADD CONSTRAINT airbnb_notifications_reservation_id_fkey
    FOREIGN KEY (reservation_id)
    REFERENCES reservations(id)
    ON DELETE CASCADE;
END $$;

COMMENT ON CONSTRAINT airbnb_reservations_staging_reservation_id_fkey ON airbnb_reservations_staging IS
  'SET NULL pour garder historique de staging même si réservation supprimée';

COMMENT ON CONSTRAINT airbnb_conflicts_reservation_1_id_fkey ON airbnb_conflicts IS
  'CASCADE car conflit sans réservation n''a pas de sens';

COMMENT ON CONSTRAINT airbnb_conflicts_reservation_2_id_fkey ON airbnb_conflicts IS
  'CASCADE car conflit sans réservation n''a pas de sens';

COMMENT ON CONSTRAINT airbnb_notifications_reservation_id_fkey ON airbnb_notifications IS
  'CASCADE car notification sans réservation n''a pas de sens';
