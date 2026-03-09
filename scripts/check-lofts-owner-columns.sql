-- Script de diagnostic pour vérifier les colonnes owner dans la table lofts
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Vérifier quelles colonnes existent dans la table lofts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lofts' 
  AND column_name IN ('owner_id', 'partner_id', 'new_owner_id')
ORDER BY column_name;

-- 2. Compter les lofts par type de colonne owner
SELECT 
  COUNT(*) as total_lofts,
  COUNT(owner_id) as with_owner_id,
  COUNT(partner_id) as with_partner_id,
  COUNT(new_owner_id) as with_new_owner_id
FROM lofts;

-- 3. Voir quelques exemples de lofts avec leurs owner IDs
SELECT 
  id,
  name,
  owner_id,
  partner_id,
  new_owner_id,
  price_per_night
FROM lofts
LIMIT 10;

-- 4. Compter les owners dans la table owners
SELECT COUNT(*) as total_owners FROM owners;

-- 5. Vérifier la correspondance entre lofts et owners
SELECT 
  o.id as owner_id,
  o.name as owner_name,
  COUNT(l.id) as loft_count_new_owner_id,
  SUM(l.price_per_night * 30) as total_monthly_value
FROM owners o
LEFT JOIN lofts l ON l.new_owner_id = o.id
GROUP BY o.id, o.name
ORDER BY loft_count_new_owner_id DESC;
