-- Script de diagnostic pour le bug de fréquence bimestriel
-- Loft: Camomille loft
-- Utilité: Téléphone

-- 1. Vérifier les données actuelles du loft
SELECT 
  id,
  name,
  frequence_paiement_telephone,
  prochaine_echeance_telephone,
  phone_number
FROM lofts
WHERE LOWER(name) LIKE '%camomille%';

-- 2. Vérifier les transactions de paiement de téléphone pour ce loft
SELECT 
  t.id,
  t.date,
  t.description,
  t.amount,
  t.category,
  t.status,
  t.created_at,
  l.name as loft_name
FROM transactions t
JOIN lofts l ON t.loft_id = l.id
WHERE LOWER(l.name) LIKE '%camomille%'
  AND t.category = 'telephone'
ORDER BY t.created_at DESC
LIMIT 5;

-- 3. Tester la fonction calculate_next_due_date avec "bimestriel"
SELECT 
  'Test bimestriel' as test_name,
  '2024-01-15'::DATE as date_actuelle,
  calculate_next_due_date('2024-01-15'::DATE, 'bimestriel') as prochaine_date_calculee,
  calculate_next_due_date('2024-01-15'::DATE, 'bimestriel') - '2024-01-15'::DATE as jours_ajoutes;

-- 4. Tester avec différentes fréquences pour comparaison
SELECT 
  frequency,
  '2024-01-15'::DATE as date_actuelle,
  calculate_next_due_date('2024-01-15'::DATE, frequency) as prochaine_date,
  calculate_next_due_date('2024-01-15'::DATE, frequency) - '2024-01-15'::DATE as jours_ajoutes
FROM (
  VALUES 
    ('mensuel'),
    ('bimestriel'),
    ('trimestriel'),
    ('semestriel'),
    ('annuel')
) AS frequencies(frequency);

-- 5. Vérifier la définition de la fonction calculate_next_due_date
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'calculate_next_due_date'
  AND routine_schema = 'public';
