-- Script pour créer un utilisateur partenaire de test
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer un utilisateur de test (si pas déjà existant)
-- Note: Remplacez l'email et le mot de passe par vos valeurs de test

-- 2. Mettre à jour le profil pour avoir le rôle partner
UPDATE profiles 
SET role = 'partner'
WHERE email = 'test-partner@example.com'; -- Remplacez par l'email de votre utilisateur de test

-- 3. Vérifier le rôle
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'test-partner@example.com';

-- Alternative: Mettre à jour votre utilisateur admin actuel temporairement
-- ATTENTION: Cela changera votre rôle d'admin à partner
-- UPDATE profiles 
-- SET role = 'partner'
-- WHERE id = '728772d1-543b-4e8c-9150-6c84203a0e16';
