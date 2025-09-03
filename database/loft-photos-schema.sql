-- Création de la table pour les photos des lofts
CREATE TABLE IF NOT EXISTS loft_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_loft_photos_loft_id ON loft_photos(loft_id);
CREATE INDEX IF NOT EXISTS idx_loft_photos_uploaded_by ON loft_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_loft_photos_created_at ON loft_photos(created_at);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_loft_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loft_photos_updated_at
  BEFORE UPDATE ON loft_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_loft_photos_updated_at();

-- RLS (Row Level Security)
ALTER TABLE loft_photos ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture (tous les utilisateurs authentifiés)
CREATE POLICY "loft_photos_select" ON loft_photos
  FOR SELECT TO authenticated
  USING (true);

-- Politique pour l'insertion (utilisateurs authentifiés)
CREATE POLICY "loft_photos_insert" ON loft_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Politique pour la suppression (propriétaire ou admin)
CREATE POLICY "loft_photos_delete" ON loft_photos
  FOR DELETE TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Création du bucket de stockage Supabase (à exécuter dans l'interface Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('loft-photos', 'loft-photos', true);

-- Politique de stockage pour l'upload
-- CREATE POLICY "loft_photos_upload" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'loft-photos');

-- Politique de stockage pour la lecture
-- CREATE POLICY "loft_photos_read" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'loft-photos');

-- Politique de stockage pour la suppression
-- CREATE POLICY "loft_photos_storage_delete" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (bucket_id = 'loft-photos');