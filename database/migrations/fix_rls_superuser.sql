-- CORRECTION FINALE RLS POUR SUPERUSER
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier votre utilisateur actuel
SELECT 
  'Current User ID' as info,
  auth.uid()::text as value
UNION ALL
SELECT 
  'Current User Email',
  auth.email()
UNION ALL
SELECT 
  'Profile Role',
  COALESCE((SELECT role::text FROM profiles WHERE id = auth.uid()), 'NO PROFILE');

-- 2. Vérifier si votre profil existe
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
WHERE id = '6284d376-bcd2-454e-b57b-0a35474e223e';

-- 3. S'assurer que le profil existe avec le bon rôle
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  '6284d376-bcd2-454e-b57b-0a35474e223e',
  (SELECT email FROM auth.users WHERE id = '6284d376-bcd2-454e-b57b-0a35474e223e'),
  'superuser',
  'Super Admin'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'superuser',
  email = EXCLUDED.email;

-- 4. Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Public can view active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow admins to insert announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow admins to update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow admins to delete announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Allow public to view active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable read access for all users" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable insert for admins" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable update for admins" ON urgent_announcements;
DROP POLICY IF EXISTS "Enable delete for admins" ON urgent_announcements;

-- 5. Créer des politiques ULTRA SIMPLES

-- Lecture publique des annonces actives
CREATE POLICY "public_read_active"
ON urgent_announcements
FOR SELECT
TO public
USING (
  is_active = true 
  AND start_date <= NOW() 
  AND end_date >= NOW()
);

-- Lecture complète pour admins/superusers
CREATE POLICY "admin_read_all"
ON urgent_announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Insertion pour admins/superusers
CREATE POLICY "admin_insert"
ON urgent_announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Mise à jour pour admins/superusers
CREATE POLICY "admin_update"
ON urgent_announcements
FOR UPDATE
TO authenticated
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

-- Suppression pour admins/superusers
CREATE POLICY "admin_delete"
ON urgent_announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- 6. Vérifier que RLS est activé
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;

-- 7. Test final : vérifier les permissions
SELECT 
  'Can Read' as permission,
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('admin', 'superuser')
  ) THEN 'YES ✓' ELSE 'NO ✗' END as status
UNION ALL
SELECT 
  'Can Insert',
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('admin', 'superuser')
  ) THEN 'YES ✓' ELSE 'NO ✗' END
UNION ALL
SELECT 
  'Can Update',
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('admin', 'superuser')
  ) THEN 'YES ✓' ELSE 'NO ✗' END
UNION ALL
SELECT 
  'Can Delete',
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('admin', 'superuser')
  ) THEN 'YES ✓' ELSE 'NO ✗' END;

-- 8. Afficher les politiques actives
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'urgent_announcements'
ORDER BY policyname;
