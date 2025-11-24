-- Script de diagnostic simplifié pour les annonces urgentes
-- Exécutez ce script pour identifier rapidement le problème

-- ========================================
-- 1. Vérifier que la table existe
-- ========================================
SELECT 
  'Table exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'urgent_announcements'
    ) THEN '✅ OK - Table existe'
    ELSE '❌ ERREUR - Table manquante'
  END as status;

-- ========================================
-- 2. Vérifier votre utilisateur connecté
-- ========================================
SELECT 
  'Current user' as check_name,
  COALESCE(auth.uid()::text, '❌ Non connecté') as user_id;

-- ========================================
-- 3. Vérifier votre profil
-- ========================================
SELECT 
  'Your profile' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
    THEN '✅ OK - Profil existe'
    ELSE '❌ ERREUR - Profil manquant'
  END as status;

-- ========================================
-- 4. Vérifier votre rôle
-- ========================================
SELECT 
  'Your role' as check_name,
  email as "Email",
  COALESCE(role, 'NULL') as "Rôle actuel",
  CASE 
    WHEN role IN ('admin', 'superuser') THEN '✅ OK - Autorisé'
    WHEN role IS NULL THEN '❌ ERREUR - Rôle non défini'
    ELSE '❌ ERREUR - Rôle insuffisant'
  END as "Statut"
FROM profiles
WHERE id = auth.uid();

-- ========================================
-- 5. Vérifier les politiques RLS
-- ========================================
SELECT 
  'RLS Policies' as check_name,
  COUNT(*)::text || ' politiques trouvées' as status
FROM pg_policies
WHERE tablename = 'urgent_announcements';

-- Détail des politiques
SELECT 
  policyname as "Nom de la politique",
  cmd as "Commande"
FROM pg_policies
WHERE tablename = 'urgent_announcements'
ORDER BY cmd;

-- ========================================
-- 6. Compter les annonces existantes
-- ========================================
SELECT 
  'Existing announcements' as check_name,
  COUNT(*)::text || ' annonces' as status
FROM urgent_announcements;

-- ========================================
-- 7. Test de permission
-- ========================================
SELECT 
  'Permission test' as check_name,
  CASE 
    WHEN auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'superuser')
    ) THEN '✅ OK - Vous pouvez créer des annonces'
    ELSE '❌ ERREUR - Permission refusée'
  END as status;

-- ========================================
-- DIAGNOSTIC FINAL
-- ========================================
SELECT 
  '========================================' as "DIAGNOSTIC FINAL";

SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'urgent_announcements')
    THEN '❌ PROBLÈME: Table manquante'
    
    WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
    THEN '❌ PROBLÈME: Profil manquant - Créez votre profil'
    
    WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IS NULL
    THEN '❌ PROBLÈME: Rôle non défini - Définissez votre rôle'
    
    WHEN (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('admin', 'superuser')
    THEN '❌ PROBLÈME: Rôle insuffisant - Changez votre rôle en admin'
    
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'urgent_announcements') = 0
    THEN '❌ PROBLÈME: Politiques manquantes - Exécutez fix_announcements_policies.sql'
    
    ELSE '✅ TOUT EST OK - Vous devriez pouvoir créer des annonces'
  END as "Résultat";

-- ========================================
-- SOLUTION RAPIDE
-- ========================================
SELECT 
  '========================================' as "SOLUTION RAPIDE";

-- Si votre rôle n'est pas admin, exécutez ceci :
-- UPDATE profiles SET role = 'admin' WHERE id = auth.uid();

-- Si les politiques manquent, exécutez le fichier :
-- fix_announcements_policies.sql
