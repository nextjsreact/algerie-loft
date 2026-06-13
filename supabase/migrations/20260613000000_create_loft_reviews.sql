-- ============================================================
-- Migration : Création de la table loft_reviews
-- Pour : Avis et commentaires des clients sur leurs séjours
-- ============================================================

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS public.loft_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  loft_id          UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Avis
  rating           SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text      TEXT,

  -- Modération
  is_published     BOOLEAN NOT NULL DEFAULT true,

  -- Réponse de l'équipe
  response_text    TEXT,
  response_date    TIMESTAMPTZ,
  responded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Métadonnées
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Commentaires
COMMENT ON TABLE  public.loft_reviews IS 'Avis et commentaires des clients sur leurs séjours';
COMMENT ON COLUMN public.loft_reviews.rating IS 'Note de 1 à 5';
COMMENT ON COLUMN public.loft_reviews.review_text IS 'Commentaire libre du client';
COMMENT ON COLUMN public.loft_reviews.is_published IS 'true = visible publiquement, false = masqué par modération';
COMMENT ON COLUMN public.loft_reviews.response_text IS 'Réponse de l'équipe à l'avis';

-- 3. Index utiles
CREATE INDEX IF NOT EXISTS idx_loft_reviews_loft_id    ON public.loft_reviews (loft_id);
CREATE INDEX IF NOT EXISTS idx_loft_reviews_client_id  ON public.loft_reviews (client_id);
CREATE INDEX IF NOT EXISTS idx_loft_reviews_booking_id ON public.loft_reviews (booking_id);
CREATE INDEX IF NOT EXISTS idx_loft_reviews_published  ON public.loft_reviews (is_published, created_at DESC);

-- 4. Contrainte unicité : 1 avis par réservation et par client
CREATE UNIQUE INDEX IF NOT EXISTS uq_loft_reviews_booking_client
  ON public.loft_reviews (booking_id, client_id)
  WHERE booking_id IS NOT NULL;

-- 5. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loft_reviews_updated_at ON public.loft_reviews;
CREATE TRIGGER trg_loft_reviews_updated_at
  BEFORE UPDATE ON public.loft_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Row Level Security
ALTER TABLE public.loft_reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique : tous peuvent lire les avis publiés
CREATE POLICY "loft_reviews_select_published"
  ON public.loft_reviews FOR SELECT
  USING (is_published = true);

-- Un client peut lire ses propres avis (publiés ou non)
CREATE POLICY "loft_reviews_select_own"
  ON public.loft_reviews FOR SELECT
  USING (client_id = auth.uid());

-- Un client peut créer un avis
CREATE POLICY "loft_reviews_insert_client"
  ON public.loft_reviews FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Un client peut modifier son propre avis (seulement si pas encore de réponse)
CREATE POLICY "loft_reviews_update_own"
  ON public.loft_reviews FOR UPDATE
  USING (
    client_id = auth.uid()
    AND response_text IS NULL
  );

-- Admin et manager peuvent tout faire (modération, réponses)
CREATE POLICY "loft_reviews_admin_all"
  ON public.loft_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager', 'superuser')
    )
  );

-- 7. Vue pratique pour les admins (avec nom du loft et email client)
CREATE OR REPLACE VIEW public.loft_reviews_admin_view AS
SELECT
  r.id,
  r.booking_id,
  r.loft_id,
  l.name  AS loft_name,
  l.address AS loft_address,
  r.client_id,
  p.full_name AS client_name,
  p.email     AS client_email,
  r.rating,
  r.review_text,
  r.is_published,
  r.response_text,
  r.response_date,
  r.created_at,
  b.check_in,
  b.check_out
FROM public.loft_reviews r
LEFT JOIN public.lofts l ON l.id = r.loft_id
LEFT JOIN public.profiles p ON p.id = r.client_id
LEFT JOIN public.bookings b ON b.id = r.booking_id
ORDER BY r.created_at DESC;

-- ============================================================
-- Instructions d'exécution :
-- 1. Dans Supabase Dashboard → SQL Editor
-- 2. Coller ce script et cliquer "Run"
-- 3. Vérifier avec : SELECT * FROM public.loft_reviews LIMIT 1;
-- ============================================================
