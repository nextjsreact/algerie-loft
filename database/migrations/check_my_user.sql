-- Vérifier l'utilisateur actuel et ses permissions
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur authentifié
SELECT 
  auth.uid() as user_id,
  auth.email() as user_email;

-- 2. Vérifier le profil dans la table profiles
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
WHERE id = auth.uid();

-- 3. Vérifier les métadonnées de l'utilisateur dans auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- 4. Tester si l'utilisateur peut insérer dans urgent_announcements
-- (Cette requête devrait échouer si les politiques RLS bloquent)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superuser')
    ) THEN 'User has admin/superuser role ✓'
    ELSE 'User does NOT have admin/superuser role ✗'
  END as permission_check;
