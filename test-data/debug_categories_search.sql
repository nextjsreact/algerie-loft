-- Script de diagnostic pour comprendre pourquoi la recherche de catégorie échoue
-- À exécuter dans Supabase SQL Editor

-- 1. Lister TOUTES les catégories de type 'expense'
SELECT 
  id,
  name,
  type,
  description,
  created_at
FROM categories
WHERE type = 'expense'
ORDER BY name;

-- 2. Tester les recherches ILIKE pour chaque utilitaire
-- Téléphone
SELECT 'telephone' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'telephone';

SELECT 'Phone' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'Phone';

SELECT 'Phone Bill' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'Phone Bill';

-- Eau
SELECT 'eau' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'eau';

SELECT 'Water' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'Water';

-- Energie
SELECT 'energie' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'energie';

SELECT 'Energy' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'Energy';

-- Internet
SELECT 'internet' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'internet';

SELECT 'Internet' as search_term, id, name, type
FROM categories
WHERE type = 'expense' AND name ILIKE 'Internet';

-- 3. Vérifier si les catégories ont des espaces ou caractères spéciaux
SELECT 
  id,
  name,
  LENGTH(name) as name_length,
  OCTET_LENGTH(name) as name_bytes,
  type,
  -- Afficher les caractères invisibles
  REPLACE(REPLACE(REPLACE(name, ' ', '·'), CHR(9), '→'), CHR(10), '↵') as name_with_visible_spaces
FROM categories
WHERE type = 'expense'
  AND (
    LOWER(name) LIKE '%eau%'
    OR LOWER(name) LIKE '%water%'
    OR LOWER(name) LIKE '%energie%'
    OR LOWER(name) LIKE '%energy%'
    OR LOWER(name) LIKE '%telephone%'
    OR LOWER(name) LIKE '%phone%'
    OR LOWER(name) LIKE '%internet%'
  )
ORDER BY name;
