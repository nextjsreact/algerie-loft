-- =====================================================
-- FIX SIMPLE: Policies RLS pour la table owners
-- =====================================================
-- Version simplifiée sans erreurs
-- =====================================================

-- 1. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Admin can view all owners" ON owners;
DROP POLICY IF EXISTS "Admin can update all owners" ON owners;
DROP POLICY IF EXISTS "Admin can insert owners" ON owners;
DROP POLICY IF EXISTS "Admin can delete owners" ON owners;
DROP POLICY IF EXISTS "Partners can view own data" ON owners;
DROP POLICY IF EXISTS "Partners can update own data" ON owners;

-- 2. Créer les policies pour les ADMINS

-- Policy 1 : Admin peut VOIR tous les owners
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

-- Policy 2 : Admin peut MODIFIER tous les owners
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

-- Policy 3 : Admin peut INSÉRER des owners
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

-- Policy 4 : Admin peut SUPPRIMER des owners
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

-- 3. Créer les policies pour les PARTNERS

-- Policy 5 : Partners peuvent VOIR leurs propres données
CREATE POLICY "Partners can view own data"
ON owners
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy 6 : Partners peuvent MODIFIER leurs propres données
CREATE POLICY "Partners can update own data"
ON owners
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- 4. Activer RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier les policies créées
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename = 'owners'
ORDER BY policyname;

-- 6. Test : Compter les owners et partners
SELECT 
  COUNT(*) as total_owners,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as total_partners,
  COUNT(*) FILTER (WHERE user_id IS NULL) as total_internes
FROM owners;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- ✅ 6 policies créées
-- ✅ RLS activé
-- ✅ Total: 26 owners (23 internes, 3 partners)
-- =====================================================
