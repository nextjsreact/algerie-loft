-- Table pour les annonces urgentes/promotions
CREATE TABLE IF NOT EXISTS urgent_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contenu multilingue
  message_fr TEXT NOT NULL,
  message_en TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  -- Style
  background_color TEXT DEFAULT '#EF4444', -- Rouge par défaut
  text_color TEXT DEFAULT '#FFFFFF',
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_urgent_announcements_active ON urgent_announcements(is_active, end_date);
CREATE INDEX idx_urgent_announcements_dates ON urgent_announcements(start_date, end_date);

-- RLS (Row Level Security)
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les annonces actives
CREATE POLICY "Anyone can view active announcements"
  ON urgent_announcements
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );

-- Politique : Seuls admin et superuser peuvent créer
CREATE POLICY "Admin and superuser can create announcements"
  ON urgent_announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superuser')
    )
  );

-- Politique : Seuls admin et superuser peuvent modifier
CREATE POLICY "Admin and superuser can update announcements"
  ON urgent_announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superuser')
    )
  );

-- Politique : Seuls admin et superuser peuvent supprimer
CREATE POLICY "Admin and superuser can delete announcements"
  ON urgent_announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superuser')
    )
  );

-- Fonction pour désactiver automatiquement les annonces expirées
CREATE OR REPLACE FUNCTION deactivate_expired_announcements()
RETURNS void AS $$
BEGIN
  UPDATE urgent_announcements
  SET is_active = false
  WHERE is_active = true
  AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE urgent_announcements IS 'Annonces urgentes et promotions affichées en bannière défilante';
COMMENT ON COLUMN urgent_announcements.message_fr IS 'Message en français';
COMMENT ON COLUMN urgent_announcements.message_en IS 'Message en anglais';
COMMENT ON COLUMN urgent_announcements.message_ar IS 'Message en arabe';
COMMENT ON COLUMN urgent_announcements.background_color IS 'Couleur de fond (hex)';
COMMENT ON COLUMN urgent_announcements.text_color IS 'Couleur du texte (hex)';
