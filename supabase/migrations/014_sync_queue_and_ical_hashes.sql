-- ============================================================================
-- Migration 014: Tables sync_queue + ical_hashes pour les services Python
-- ============================================================================
-- Tables utilisées par les Docker services :
--   - ical_hashes : cache des hashes SHA256 des calendriers iCal
--   - sync_queue  : file d'attente pour le targeted scraper (avec retry)
-- Référencées par :
--   - ical_watcher.py (lit/écrit ical_hashes, INSERT dans sync_queue)
--   - targeted_scraper.py (lit/update sync_queue, orders by retry_count)
--   - monitoring_watcher.py (lit reservations)
-- ============================================================================

-- ── 1. Table des hashes iCal (cache pour détecter les changements) ─────
CREATE TABLE IF NOT EXISTS public.ical_hashes (
    listing_id  TEXT PRIMARY KEY,
    hash        TEXT NOT NULL,
    checked_at  TIMESTAMPTZ DEFAULT now(),
    changed_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.ical_hashes IS
  'Hash SHA256 des calendriers iCal Airbnb pour détecter les changements (utilisé par ical-watcher)';
COMMENT ON COLUMN public.ical_hashes.listing_id IS 'Airbnb listing ID (airbnb_listing_id du loft)';
COMMENT ON COLUMN public.ical_hashes.hash IS 'Hash SHA256 du contenu brut du calendrier iCal';
COMMENT ON COLUMN public.ical_hashes.checked_at IS 'Dernier check iCal (peu importe si changé)';
COMMENT ON COLUMN public.ical_hashes.changed_at IS 'Dernier check où le calendrier a CHANGÉ (utilisé pour décider de re-scraper)';

CREATE INDEX IF NOT EXISTS idx_ical_hashes_checked_at
  ON public.ical_hashes (checked_at DESC);


-- ── 2. File d'attente de scraping ciblé ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id             BIGSERIAL PRIMARY KEY,
    listing_id     TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'done', 'error')),
    reason         TEXT,
    error_message  TEXT,
    retry_count    INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT now(),
    processed_at   TIMESTAMPTZ
);

COMMENT ON TABLE public.sync_queue IS
  'File d''attente pour le scraping ciblé (targeted_scraper) — quand l''ical change, on insère ici';
COMMENT ON COLUMN public.sync_queue.listing_id IS 'Airbnb listing ID à re-scraper en priorité';
COMMENT ON COLUMN public.sync_queue.status IS 'pending → processing → done | error';
COMMENT ON COLUMN public.sync_queue.reason IS 'Pourquoi cette entrée a été créée (ical_changed, manual, retry, etc.)';
COMMENT ON COLUMN public.sync_queue.error_message IS 'Message d''erreur si status=error (pour debug)';
COMMENT ON COLUMN public.sync_queue.retry_count IS 'Nombre de tentatives (max 3, puis status=error définitif)';
COMMENT ON COLUMN public.sync_queue.processed_at IS 'Timestamp du dernier traitement (succès ou échec final)';

-- Index pour la lecture rapide des pending (les plus anciens d'abord, erreurs en priorité)
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending
  ON public.sync_queue (status, retry_count DESC, created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sync_queue_listing
  ON public.sync_queue (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_error
  ON public.sync_queue (status, created_at DESC)
  WHERE status = 'error';


-- ── 3. RLS — Pattern identique à 002_rls_policies.sql ─────────────────
ALTER TABLE public.ical_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue  ENABLE ROW LEVEL SECURITY;

-- Drop si existent (pour idempotence lors d'un re-run)
DROP POLICY IF EXISTS "Authenticated users can read ical hashes"   ON public.ical_hashes;
DROP POLICY IF EXISTS "Service role can manage ical hashes"         ON public.ical_hashes;
DROP POLICY IF EXISTS "Authenticated users can read sync queue"     ON public.sync_queue;
DROP POLICY IF EXISTS "Admins can manage sync queue"                ON public.sync_queue;
DROP POLICY IF EXISTS "Service role can manage sync queue"          ON public.sync_queue;

-- ical_hashes : lecture authentifiée, écriture service role (Python) uniquement
CREATE POLICY "Authenticated users can read ical hashes"
  ON public.ical_hashes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage ical hashes"
  ON public.ical_hashes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- sync_queue : lecture authentifiée, admin/manager peuvent forcer/reset, service role fait tout
CREATE POLICY "Authenticated users can read sync queue"
  ON public.sync_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sync queue"
  ON public.sync_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager', 'superuser'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager', 'superuser'))
    )
  );

CREATE POLICY "Service role can manage sync queue"
  ON public.sync_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── 4. Vérification ────────────────────────────────────────────────────
DO $$
DECLARE
  v_hashes_count INTEGER;
  v_queue_count  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_hashes_count FROM public.ical_hashes;
  SELECT COUNT(*) INTO v_queue_count  FROM public.sync_queue;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Migration 014 appliquée';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '📊 ical_hashes : % lignes (table vide au départ, normal)', v_hashes_count;
  RAISE NOTICE '📊 sync_queue  : % lignes (table vide au départ, normal)', v_queue_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 RLS policies actives :';
  RAISE NOTICE '   - ical_hashes : lecture authentifiée, écriture service_role';
  RAISE NOTICE '   - sync_queue  : lecture authentifiée, gestion admin/manager/service_role';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END $$;
