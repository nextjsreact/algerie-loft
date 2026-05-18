-- Script de test complet pour le paiement de facture
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que les catégories existent
SELECT 
  'Catégories existantes' as test,
  id,
  name,
  type
FROM categories
WHERE name IN ('eau', 'energie', 'telephone', 'internet')
  AND type = 'expense'
ORDER BY name;

-- 2. Vérifier le loft "Camomille loft"
SELECT 
  'Loft Camomille' as test,
  id,
  name,
  frequence_paiement_telephone,
  prochaine_echeance_telephone
FROM lofts
WHERE LOWER(name) LIKE '%camomille%'
LIMIT 1;

-- 3. Tester la recherche de catégorie (comme dans le code)
SELECT 
  'Recherche catégorie telephone' as test,
  id,
  name,
  type
FROM categories
WHERE type = 'expense'
  AND name = 'telephone';

-- 4. Vérifier les devises disponibles
SELECT 
  'Devises disponibles' as test,
  id,
  code,
  name,
  symbol,
  is_default,
  ratio
FROM currencies
WHERE is_default = true
ORDER BY code
LIMIT 5;

-- 5. Vérifier les modes de paiement disponibles
SELECT 
  'Modes de paiement' as test,
  id,
  name
FROM payment_methods
ORDER BY name
LIMIT 5;

-- 6. Simuler l'insertion d'une transaction (sans l'exécuter)
-- Remplacez les valeurs par celles de votre test
DO $$
DECLARE
  v_loft_id uuid;
  v_category_id uuid;
  v_currency_id uuid;
  v_payment_method_id uuid;
BEGIN
  -- Récupérer les IDs nécessaires
  SELECT id INTO v_loft_id FROM lofts WHERE LOWER(name) LIKE '%camomille%' LIMIT 1;
  SELECT id INTO v_category_id FROM categories WHERE name = 'telephone' AND type = 'expense';
  SELECT id INTO v_currency_id FROM currencies WHERE is_default = true LIMIT 1;
  SELECT id INTO v_payment_method_id FROM payment_methods LIMIT 1;
  
  -- Afficher les valeurs qui seraient utilisées
  RAISE NOTICE 'Loft ID: %', v_loft_id;
  RAISE NOTICE 'Category ID: %', v_category_id;
  RAISE NOTICE 'Currency ID: %', v_currency_id;
  RAISE NOTICE 'Payment Method ID: %', v_payment_method_id;
  
  -- Vérifier si tous les IDs sont trouvés
  IF v_loft_id IS NULL THEN
    RAISE EXCEPTION 'Loft "Camomille" not found';
  END IF;
  
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category "telephone" not found';
  END IF;
  
  IF v_currency_id IS NULL THEN
    RAISE EXCEPTION 'Default currency not found';
  END IF;
  
  IF v_payment_method_id IS NULL THEN
    RAISE EXCEPTION 'Payment method not found';
  END IF;
  
  RAISE NOTICE 'All IDs found successfully!';
  RAISE NOTICE 'Transaction would be created with:';
  RAISE NOTICE '  - Loft: %', v_loft_id;
  RAISE NOTICE '  - Category: %', v_category_id;
  RAISE NOTICE '  - Amount: 5000';
  RAISE NOTICE '  - Currency: %', v_currency_id;
  RAISE NOTICE '  - Payment Method: %', v_payment_method_id;
END $$;

-- 7. Vérifier les contraintes de la table transactions
SELECT
  'Contraintes transactions' as test,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
ORDER BY conname;
