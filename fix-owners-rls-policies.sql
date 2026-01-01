-- CORRECTION DES POLITIQUES RLS POUR LA TABLE OWNERS
-- ===================================================
-- 
-- PROBLÈME : L'utilisateur executive ne peut pas lire la table owners
-- SOLUTION : Ajouter/corriger les politiques RLS

-- 1. Vérifier les politiques actuelles
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

-- 2. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'owners';

-- 3. CORRECTION : Ajouter une politique pour permettre aux executives de lire tous les owners
DROP POLICY IF EXISTS "Executives can read all owners" ON owners;

CREATE POLICY "Executives can read all owners" ON owners
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager', 'executive', 'superuser')
        )
    );

-- 4. CORRECTION : Ajouter une politique pour les propriétaires (leurs propres données)
DROP POLICY IF EXISTS "Owners can read their own data" ON owners;

CREATE POLICY "Owners can read their own data" ON owners
    FOR SELECT 
    USING (user_id = auth.uid());

-- 5. Vérifier que les politiques ont été créées
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'owners'
ORDER BY policyname;

-- 6. Test : Vérifier que ton utilisateur peut maintenant lire les owners
-- (Cette requête devrait retourner 26 owners)
SELECT COUNT(*) as total_owners FROM owners;