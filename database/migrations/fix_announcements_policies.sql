-- Fix pour les politiques RLS des annonces urgentes
-- Si vous avez une erreur de permission, exécutez ce script

-- 1. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can create announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can delete announcements" ON urgent_announcements;

-- 2. Recréer les politiques avec une meilleure logique

-- Lecture : Tout le monde peut voir les annonces actives
CREATE POLICY "Anyone can view active announcements"
  ON urgent_announcements
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );

-- Insertion : Admin et superuser peuvent créer
CREATE POLICY "Admin and superuser can create announcements"
  ON urgent_announcements
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('admin', 'superuser')
    )
  );

-- Modification : Admin et superuser peuvent modifier
CREATE POLICY "Admin and superuser can update announcements"
  ON urgent_announcements
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('admin', 'superuser')
    )
  );

-- Suppression : Admin et superuser peuvent supprimer
CREATE POLICY "Admin and superuser can delete announcements"
  ON urgent_announcements
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('admin', 'superuser')
    )
  );

-- 3. Vérifier que RLS est activé
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;

-- 4. Vérification : Afficher les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'urgent_announcements';

-- 5. Vérifier votre rôle actuel
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role IN ('admin', 'superuser') THEN '✅ Vous pouvez créer des annonces'
    ELSE '❌ Vous devez être admin ou superuser'
  END as status
FROM profiles
WHERE id = auth.uid();
