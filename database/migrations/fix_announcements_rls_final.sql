-- CORRECTION FINALE DES POLITIQUES RLS POUR URGENT_ANNOUNCEMENTS
-- Exécuter dans Supabase SQL Editor

-- 1. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Allow admins to insert announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow admins to update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow admins to delete announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow public to view active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable read access for all users" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable insert for admins" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable update for admins" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable delete for admins" ON urgent_announcements;

-- 2. S'assurer que RLS est activé
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;

-- 3. Créer les nouvelles politiques SIMPLIFIÉES

-- Politique de lecture : tout le monde peut lire les annonces actives
CREATE POLICY "Public can view active announcements"
ON urgent_announcements
FOR SELECT
USING (
  is_active = true 
  AND start_date <= NOW() 
  AND end_date >= NOW()
);

-- Politique d'insertion : admins et superusers uniquement
CREATE POLICY "Admins can insert announcements"
ON urgent_announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Politique de mise à jour : admins et superusers uniquement
CREATE POLICY "Admins can update announcements"
ON urgent_announcements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Politique de suppression : admins et superusers uniquement
CREATE POLICY "Admins can delete announcements"
ON urgent_announcements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Politique de lecture pour les admins : voir toutes les annonces
CREATE POLICY "Admins can view all announcements"
ON urgent_announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- 4. Vérifier que votre utilisateur a bien le rôle admin
-- Remplacer 'votre-email@example.com' par votre email réel
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Trouver l'ID de l'utilisateur par email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'nextjsreact@gmail.com'; -- REMPLACER PAR VOTRE EMAIL
  
  IF user_id IS NOT NULL THEN
    -- Créer ou mettre à jour le profil
    INSERT INTO profiles (id, email, role, full_name)
    VALUES (
      user_id,
      'nextjsreact@gmail.com', -- REMPLACER PAR VOTRE EMAIL
      'admin',
      'Admin User'
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      email = EXCLUDED.email;
    
    RAISE NOTICE 'Profile updated for user %', user_id;
  ELSE
    RAISE NOTICE 'User not found with this email';
  END IF;
END $$;

-- 5. Afficher le résultat
SELECT 
  id,
  email,
  role,
  full_name
FROM profiles
WHERE email = 'nextjsreact@gmail.com'; -- REMPLACER PAR VOTRE EMAIL
