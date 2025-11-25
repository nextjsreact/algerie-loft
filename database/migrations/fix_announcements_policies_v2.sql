-- ============================================
-- FIX COMPLET DES POLITIQUES RLS - ANNONCES
-- ============================================
-- Ce script résout tous les problèmes de permissions
-- Exécutez-le dans Supabase SQL Editor

-- ÉTAPE 1: Nettoyer toutes les anciennes politiques
-- ================================================
DROP POLICY IF EXISTS "Anyone can view active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Anyone can read active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can read announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can create announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can delete announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON urgent_announcements;

-- ÉTAPE 2: Créer les nouvelles politiques (SIMPLIFIÉES)
-- ======================================================

-- 2.1 LECTURE: Admins peuvent tout lire (pour l'interface admin)
CREATE POLICY "admins_read_all"
ON urgent_announcements
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superuser')
);

-- 2.2 LECTURE: Public peut lire les annonces actives (pour la homepage)
CREATE POLICY "public_read_active"
ON urgent_announcements
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND start_date <= NOW() 
  AND end_date >= NOW()
);

-- 2.3 INSERTION: Admins peuvent créer
CREATE POLICY "admins_insert"
ON urgent_announcements
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superuser')
);

-- 2.4 MODIFICATION: Admins peuvent modifier
CREATE POLICY "admins_update"
ON urgent_announcements
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superuser')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superuser')
);

-- 2.5 SUPPRESSION: Admins peuvent supprimer
CREATE POLICY "admins_delete"
ON urgent_announcements
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superuser')
);

-- ÉTAPE 3: S'assurer que RLS est activé
-- ======================================
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Vérifications
-- ======================

-- 4.1 Afficher toutes les politiques créées
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

-- 4.2 Vérifier votre rôle actuel
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role IN ('admin', 'superuser') THEN '✅ Vous pouvez gérer les annonces'
    ELSE '❌ Rôle insuffisant: ' || COALESCE(role, 'NULL')
  END as status
FROM profiles
WHERE id = auth.uid();

-- 4.3 Test de lecture (doit retourner des résultats ou une table vide, pas d'erreur)
SELECT COUNT(*) as total_announcements FROM urgent_announcements;

-- ÉTAPE 5: Si vous n'êtes pas admin, exécutez ceci
-- =================================================
-- Décommentez et remplacez YOUR_EMAIL par votre email

-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_EMAIL';

-- SELECT 'Rôle mis à jour!' as message;

-- ÉTAPE 6: Diagnostic complet
-- ===========================
DO $$
DECLARE
  policy_count INTEGER;
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'urgent_announcements';
  
  -- Récupérer le rôle de l'utilisateur actuel
  SELECT role, email INTO user_role, user_email
  FROM profiles
  WHERE id = auth.uid();
  
  -- Afficher le résumé
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLET';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Nombre de politiques: %', policy_count;
  RAISE NOTICE 'Votre email: %', COALESCE(user_email, 'NON CONNECTÉ');
  RAISE NOTICE 'Votre rôle: %', COALESCE(user_role, 'AUCUN');
  RAISE NOTICE '========================================';
  
  IF policy_count < 5 THEN
    RAISE WARNING 'Attention: Seulement % politiques trouvées (attendu: 5)', policy_count;
  ELSE
    RAISE NOTICE '✅ Toutes les politiques sont en place';
  END IF;
  
  IF user_role IN ('admin', 'superuser') THEN
    RAISE NOTICE '✅ Vous avez les permissions nécessaires';
  ELSE
    RAISE WARNING '❌ Votre rôle (%) est insuffisant', COALESCE(user_role, 'NULL');
    RAISE NOTICE 'Exécutez: UPDATE profiles SET role = ''admin'' WHERE email = ''%'';', user_email;
  END IF;
END $$;
