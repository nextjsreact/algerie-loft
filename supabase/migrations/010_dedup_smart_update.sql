-- =============================================================================
-- Migration 010: Dedup 4 couches + Smart Update
-- =============================================================================
-- Ajoute:
--   1. last_manual_edit_at : timestamp de la derniere edition manuelle
--   2. admin_locked_fields : JSONB listant les champs proteges
--   3. matched_via : 'airbnb_id' | 'fuzzy_manual' | 'none' (comment la resa a ete liee)
--   4. Index pour fuzzy match rapide
--   5. Vue v_potential_duplicates pour audit
-- =============================================================================

-- 1. Colonnes de tracking
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS last_manual_edit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_locked_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS matched_via TEXT;

COMMENT ON COLUMN reservations.last_manual_edit_at IS 'Timestamp de la derniere modification manuelle par un admin/employe';
COMMENT ON COLUMN reservations.admin_locked_fields IS 'JSONB array de champs proteges du sync Airbnb (ex: ["special_requests", "guest_phone"])';
COMMENT ON COLUMN reservations.matched_via IS 'Comment la resa a ete liee: airbnb_id (exact) | fuzzy_manual (loft+name+date) | none (nouvelle)';

-- 2. Index pour fuzzy match (lookup rapide des entrees manuelles par loft + date)
CREATE INDEX IF NOT EXISTS idx_reservations_fuzzy_match
ON reservations(loft_id, check_in_date)
WHERE airbnb_confirmation_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_matched_via
ON reservations(matched_via)
WHERE matched_via IS NOT NULL;

-- 3. Vue d'audit : detecte les doublons potentiels (a executer apres la migration)
--    (Une resa scrapee avec airbnb_confirmation_code X + une manuelle meme loft/nom/date)
CREATE OR REPLACE VIEW v_potential_duplicates AS
SELECT
    a.id                AS scraped_id,
    b.id                AS manual_id,
    a.loft_id,
    l.name              AS loft_name,
    a.guest_name,
    a.check_in_date     AS scraped_check_in,
    b.check_in_date     AS manual_check_in,
    a.airbnb_confirmation_code AS scraped_airbnb_id,
    b.last_manual_edit_at      AS manual_edited_at,
    b.source            AS manual_source
FROM reservations a
JOIN reservations b
    ON a.loft_id = b.loft_id
   AND a.guest_name = b.guest_name
   AND ABS((a.check_in_date - b.check_in_date)) <= 1
   AND a.id != b.id
JOIN lofts l ON l.id = a.loft_id
WHERE a.airbnb_confirmation_code IS NOT NULL  -- scrapee
  AND b.airbnb_confirmation_code IS NULL      -- manuelle
  AND a.status != 'cancelled'
  AND b.status != 'cancelled';

COMMENT ON VIEW v_potential_duplicates IS 'Paires de reservations (scrapee + manuelle) sur le meme loft, guest et date - peuvent etre fusionnees';

-- 4. Fonction utilitaire pour normaliser un nom de guest
--    (lowercase, trim, remove accents et ponctuation)
CREATE OR REPLACE FUNCTION normalize_guest_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(REGEXP_REPLACE(
        TRANSLATE(name, 'àâäéèêëïîôöùûüç', 'aaaeeeeiioouuuc'),
        '[^a-z0-9 ]', '', 'g'
    )));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Trigger pour auto-marquer last_manual_edit_at quand un champ "protege" change
--    (Permet de savoir si la resa a ete touchee manuellement)
CREATE OR REPLACE FUNCTION trg_mark_manual_edit()
RETURNS TRIGGER AS $$
BEGIN
    -- Detecter si un champ "manuel" a change
    IF (NEW.special_requests IS DISTINCT FROM OLD.special_requests)
       OR (NEW.payment_status IS DISTINCT FROM OLD.payment_status)
       OR (NEW.guest_phone IS DISTINCT FROM OLD.guest_phone)
       OR (NEW.guest_email IS DISTINCT FROM OLD.guest_email)
       OR (NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason)
    THEN
        NEW.last_manual_edit_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reservations_mark_manual_edit ON reservations;
CREATE TRIGGER trigger_reservations_mark_manual_edit
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION trg_mark_manual_edit();

-- 6. Ajouter la colonne reservations_linked dans airbnb_sync_logs (si absente)
ALTER TABLE airbnb_sync_logs
ADD COLUMN IF NOT EXISTS reservations_linked INTEGER DEFAULT 0;

-- 7. Table de liaison airbnb_sync_log_reservations (FK many-to-many)
-- Permet de retrouver QUEL log a traité QUELLE réservation (même dans le cas
-- d'un batch partagé), pour debuggage et audit. CASCADE sur les deux côtés
-- pour qu'un log ou une résa supprimé nettoie automatiquement la liaison.
CREATE TABLE IF NOT EXISTS airbnb_sync_log_reservations (
  log_id UUID NOT NULL REFERENCES airbnb_sync_logs(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'linked', 'skipped', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (log_id, reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_aslr_log ON airbnb_sync_log_reservations(log_id);
CREATE INDEX IF NOT EXISTS idx_aslr_reservation ON airbnb_sync_log_reservations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_aslr_action ON airbnb_sync_log_reservations(action);

COMMENT ON TABLE airbnb_sync_log_reservations IS
  'Liaison many-to-many entre logs de sync et réservations affectees. Permet de retrouver quel batch a traite chaque reservation.';
COMMENT ON COLUMN airbnb_sync_log_reservations.action IS
  'Action effectuee par le sync sur cette reservation: created (nouvelle), updated (mise a jour), linked (lier a une existante), skipped (deja a jour), failed (echec).';
