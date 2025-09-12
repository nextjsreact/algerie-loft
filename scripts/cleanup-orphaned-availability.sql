-- Script pour nettoyer les enregistrements de disponibilité orphelins
-- Exécutez ce script dans votre interface Supabase SQL Editor

-- 1. Identifier les enregistrements orphelins
SELECT 
    la.date,
    la.loft_id,
    la.blocked_reason,
    la.is_available,
    l.name as loft_name
FROM loft_availability la
LEFT JOIN lofts l ON la.loft_id = l.id
WHERE l.id IS NULL
ORDER BY la.date DESC;

-- 2. Compter les enregistrements orphelins
SELECT COUNT(*) as orphaned_records_count
FROM loft_availability la
LEFT JOIN lofts l ON la.loft_id = l.id
WHERE l.id IS NULL;

-- 3. Supprimer les enregistrements orphelins (ATTENTION: Décommentez seulement si vous êtes sûr)
-- DELETE FROM loft_availability 
-- WHERE loft_id NOT IN (SELECT id FROM lofts);

-- 4. Vérifier les lofts existants pour référence
SELECT id, name, status 
FROM lofts 
ORDER BY name;

-- 5. Vérifier les enregistrements de disponibilité valides
SELECT 
    la.date,
    la.loft_id,
    la.blocked_reason,
    la.is_available,
    l.name as loft_name
FROM loft_availability la
INNER JOIN lofts l ON la.loft_id = l.id
WHERE la.is_available = false
ORDER BY la.date DESC
LIMIT 10;