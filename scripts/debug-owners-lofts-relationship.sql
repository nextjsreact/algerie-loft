-- Script de diagnostic pour comprendre la relation owners-lofts
-- Exécutez ce script dans Supabase SQL Editor et partagez les résultats

-- 1. Vérifier les colonnes dans la table lofts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lofts' 
  AND column_name LIKE '%owner%'
ORDER BY column_name;

-- 2. Voir quelques exemples de lofts avec TOUTES leurs colonnes owner
SELECT 
  id,
  name,
  owner_id,
  partner_id,
  new_owner_id,
  price_per_month,
  price_per_night
FROM lofts
LIMIT 5;

-- 3. Compter combien de lofts ont chaque type d'owner ID
SELECT 
  COUNT(*) as total_lofts,
  COUNT(owner_id) as with_owner_id,
  COUNT(partner_id) as with_partner_id,
  COUNT(new_owner_id) as with_new_owner_id,
  COUNT(CASE WHEN owner_id IS NOT NULL OR partner_id IS NOT NULL OR new_owner_id IS NOT NULL THEN 1 END) as with_any_owner
FROM lofts;

-- 4. Voir les IDs des owners dans la table owners
SELECT 
  id,
  name,
  business_name,
  email
FROM owners
LIMIT 5;

-- 5. Essayer de faire la jointure pour voir si ça matche
SELECT 
  o.id as owner_id,
  o.name as owner_name,
  o.business_name,
  COUNT(l.id) FILTER (WHERE l.new_owner_id = o.id) as count_new_owner_id,
  COUNT(l.id) FILTER (WHERE l.owner_id = o.id) as count_owner_id,
  COUNT(l.id) FILTER (WHERE l.partner_id = o.id) as count_partner_id
FROM owners o
LEFT JOIN lofts l ON (l.new_owner_id = o.id OR l.owner_id = o.id OR l.partner_id = o.id)
GROUP BY o.id, o.name, o.business_name
HAVING COUNT(l.id) > 0
LIMIT 10;

-- 6. Vérifier s'il y a des lofts orphelins (sans owner)
SELECT COUNT(*) as lofts_without_owner
FROM lofts
WHERE owner_id IS NULL 
  AND partner_id IS NULL 
  AND new_owner_id IS NULL;
