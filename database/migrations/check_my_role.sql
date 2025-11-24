-- Script ultra-simple : Vérifier votre rôle
-- Exécutez ce script pour voir si vous êtes admin

SELECT 
  email as "Votre email",
  COALESCE(role, 'PAS DE RÔLE') as "Votre rôle actuel",
  CASE 
    WHEN role = 'admin' THEN '✅ Vous êtes ADMIN - OK'
    WHEN role = 'superuser' THEN '✅ Vous êtes SUPERUSER - OK'
    WHEN role IS NULL THEN '❌ Vous n''avez PAS de rôle - PROBLÈME'
    ELSE '❌ Votre rôle est "' || role || '" - INSUFFISANT'
  END as "Statut"
FROM profiles
WHERE id = auth.uid();

-- ========================================
-- SOLUTION
-- ========================================

-- Si vous n'êtes PAS admin, exécutez cette commande :
-- (Décommentez la ligne ci-dessous et exécutez)

-- UPDATE profiles SET role = 'admin' WHERE id = auth.uid();

-- Puis vérifiez à nouveau en réexécutant ce script
