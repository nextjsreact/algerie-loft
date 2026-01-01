-- CORRECTION SIMPLE DES POLITIQUES RLS
-- =====================================

-- 1. Vérifier les politiques actuelles
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'owners';

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Executives can read all owners" ON owners;
DROP POLICY IF EXISTS "Owners can read their own data" ON owners;

-- 3. Créer la politique pour les executives
CREATE POLICY "Executives can read all owners" ON owners
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager', 'executive', 'superuser')
        )
    );

-- 4. Créer la politique pour les propriétaires
CREATE POLICY "Owners can read their own data" ON owners
    FOR SELECT 
    USING (user_id = auth.uid());

-- 5. Tester que ça marche
SELECT COUNT(*) as total_owners FROM owners;