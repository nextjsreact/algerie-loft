-- Script de diagnostic pour les annonces urgentes
-- Exécutez ce script pour identifier le problème

-- ========================================
-- 1. Vérifier que la table existe
-- ========================================
SELECT 
  'Table exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'urgent_announcements'
    ) THEN '✅ OK'
    ELSE '❌ Table manquante'
  END as status;

-- ========================================
-- 2. Vérifier RLS
-- ========================================
SELECT 
  'RLS enabled' as check_name,
  CASE 
    WHEN relrowsecurity THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as status
FROM pg_class
WHERE relname = 'urgent_announcements';

-- ========================================
-- 3. Lister les politiques
-- ========================================
SELECT 
  'Policies' as check_name,
  COUNT(*)::text || ' politiques trouvées' as status
FROM pg_policies
WHERE tablename = 'urgent_announcements';

-- Détail des politiques
SELECT 
  policyname as "Nom de la politique",
  cmd as "Commande",
  permissive as "Type"
FROM pg_policies
WHERE tablename = 'urgent_announcements';

-- ========================================
-- 4. Vérifier votre utilisateur
-- ========================================
SELECT 
  'Current user' as check_name,
  COALESCE(auth.uid()::text, '❌ Non connecté') as status;

-- ========================================
-- 5. Vérifier votre profil
-- ========================================
SELECT 
  'Your profile' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
    THEN '✅ Profil existe'
    ELSE '❌ Profil manquant'
  END as status;

-- ========================================
-- 6. Vérifier votre rôle
-- ========================================
SELECT 
  email as "Email",
  role as "Rôle",
  CASE 
    WHEN role IN ('admin', 'superuser') THEN '✅ Autorisé'
    WHEN role IS NULL THEN '❌ Rôle non défini'
    ELSE '❌ Rôle insuffisant (' || role || ')'
  END as "Statut"
FROM profiles
WHERE id = auth.uid();

-- ========================================
-- 7. Tester l'insertion (simulation)
-- ========================================
SELECT 
  'Can insert' as check_name,
  CASE 
    WHEN auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'superuser')
    ) THEN '✅ Vous pouvez créer des annonces'
    ELSE '❌ Permission refusée - Vérifiez votre rôle'
  END as status;

-- ========================================
-- 8. Compter les annonces existantes
-- ========================================
SELECT 
  'Existing announcements' as check_name,
  COUNT(*)::text || ' annonces dans la table' as status
FROM urgent_announcements;

-- ========================================
-- RÉSUMÉ
-- ========================================
SELECT 
  '========================================' as "RÉSUMÉ";

SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'urgent_announcements')
    THEN '❌ PROBLÈME: Table manquante - Exécutez create_urgent_announcements.sql'
    
    WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
    THEN '❌ PROBLÈME: Profil manquant - Créez votre profil'
    
    WHEN (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'superuser')
    THEN '❌ PROBLÈME: Rôle insuffisant - Changez votre rôle en admin'
    
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'urgent_announcements') = 0
    THEN '❌ PROBLÈME: Politiques manquantes - Exécutez fix_announcements_policies.sql'
    
    ELSE '✅ TOUT EST OK - Vous devriez pouvoir créer des annonces'
  END as "Diagnostic";
