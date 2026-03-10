-- Script pour vérifier les données dans la table lofts
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Compter le nombre total de lofts
SELECT COUNT(*) as total_lofts FROM lofts;

-- 2. Vérifier les colonnes owner dans lofts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lofts' 
  AND column_name LIKE '%owner%'
ORDER BY column_name;

-- 3. Voir quelques exemples de lofts avec leurs owner IDs
SELECT 
  id,
  name,
  owner_id,
  partner_id,
  new_owner_id,
  price_per_month,
  price_per_night
FROM lofts
LIMIT 10;

-- 4. Compter combien de lofts ont chaque type d'owner ID
SELECT 
  COUNT(*) as total_lofts,
  COUNT(owner_id) as with_owner_id,
  COUNT(partner_id) as with_partner_id,
  COUNT(new_owner_id) as with_new_owner_id
FROM lofts;

-- 5. Compter le nombre d'owners
SELECT COUNT(*) as total_owners FROM owners;

-- 6. Voir quelques exemples d'owners avec leurs IDs
SELECT 
  id,
  name,
  business_name,
  email
FROM owners
LIMIT 5;

-- 7. Essayer de faire la jointure entre owners et lofts
SELECT 
  o.id as owner_id,
  o.name as owner_name,
  COUNT(l.id) as loft_count,
  SUM(l.price_per_month) as total_monthly_value
FROM owners o
LEFT JOIN lofts l ON (l.new_owner_id = o.id OR l.owner_id = o.id OR l.partner_id = o.id)
GROUP BY o.id, o.name
ORDER BY loft_count DESC
LIMIT 10;
