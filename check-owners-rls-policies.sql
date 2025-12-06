-- =====================================================
-- Vérifier les RLS policies sur la table owners
-- =====================================================

-- 1. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'owners';

-- 2. Lister toutes les policies sur owners
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
WHERE tablename = 'owners';

-- 3. Vérifier les permissions de la table
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'owners';

-- 4. Test : Essayer de lire les partners directement
-- (Cette requête devrait fonctionner si les policies sont correctes)
SELECT 
  id,
  name,
  business_name,
  email,
  verification_status,
  user_id
FROM owners 
WHERE user_id IS NOT NULL
LIMIT 5;
