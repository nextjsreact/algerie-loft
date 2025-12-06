-- =====================================================
-- FIX: Policies RLS pour la table owners
-- =====================================================

-- 1. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Admin can view all owners" ON owners;
DROP POLICY IF EXISTS "Admin can update all owners" ON owners;
DROP POLICY IF EXISTS "Admin can insert owners" ON owners;
DROP POLICY IF EXISTS "Admin can delete owners" ON owners;
DROP POLICY IF EXISTS "Partners can view own data" ON owners;
DROP POLICY IF EXISTS "Partners can update own data" ON owners;

-- 2. Créer les nouvelles policies

-- Policy 1 : Admin peut tout voir
CREATE POLICY "Admin can view all owners"
ON owners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Policy 2 : Admin peut tout modifier
CREATE POLICY "Admin can update all owners"
ON owners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Policy 3 : Admin peut insérer
CREATE POLICY "Admin can insert owners"
ON owners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Policy 4 : Admin peut supprimer
CREATE POLICY "Admin can delete owners"
ON owners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Policy 5 : Partners peuvent voir leurs propres données
CREATE POLICY "Partners can view own data"
ON owners
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy 6 : Partners peuvent modifier leurs propres données (limité)
CREATE POLICY "Partners can update own data"
ON owners
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
  -- Note: Les champs sensibles (verification_status, approved_by, rejected_by)
  -- sont protégés par les permissions de la table et les fonctions RPC
);

-- 3. S'assurer que RLS est activé
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- 4. Vérifier les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'owners'
ORDER BY policyname;

-- 5. Test : Vérifier qu'on peut lire les données
SELECT COUNT(*) as total_owners FROM owners;
SELECT COUNT(*) as total_partners FROM owners WHERE user_id IS NOT NULL;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- ✅ 6 policies créées
-- ✅ RLS activé
-- ✅ Admin peut tout faire
-- ✅ Partners peuvent voir/modifier leurs propres données
-- =====================================================
