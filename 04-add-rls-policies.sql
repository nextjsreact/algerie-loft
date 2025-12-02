-- =====================================================
-- ÉTAPE 4: Ajouter les politiques RLS
-- =====================================================
-- Exécutez ce script APRÈS avoir exécuté 03-update-lofts-table.sql

-- Activer RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins (accès complet)
CREATE POLICY "Admins can do everything on owners"
  ON owners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superuser', 'manager')
    )
  );

-- Policy pour les propriétaires (voir leurs propres données)
CREATE POLICY "Owners can view their own data"
  ON owners
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy pour les propriétaires (modifier leurs propres données)
CREATE POLICY "Owners can update their own data"
  ON owners
  FOR UPDATE
  USING (user_id = auth.uid());

-- Vérification
SELECT 'Politiques RLS ajoutées avec succès!' as status;
