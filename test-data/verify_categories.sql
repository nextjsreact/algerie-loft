-- Vérifier les catégories existantes pour les utilitaires
-- Ce script aide à diagnostiquer pourquoi markBillAsPaid échoue

-- 1. Lister toutes les catégories de type 'expense'
SELECT 
  id,
  name,
  type,
  created_at
FROM categories
WHERE type = 'expense'
ORDER BY name;

-- 2. Chercher spécifiquement les catégories d'utilitaires
SELECT 
  id,
  name,
  type
FROM categories
WHERE name IN ('eau', 'energie', 'telephone', 'internet', 'water', 'energy', 'phone', 'internet')
ORDER BY name;

-- 3. Chercher avec LIKE pour voir les variations possibles
SELECT 
  id,
  name,
  type
FROM categories
WHERE LOWER(name) LIKE '%eau%'
   OR LOWER(name) LIKE '%water%'
   OR LOWER(name) LIKE '%energie%'
   OR LOWER(name) LIKE '%energy%'
   OR LOWER(name) LIKE '%telephone%'
   OR LOWER(name) LIKE '%phone%'
   OR LOWER(name) LIKE '%internet%'
ORDER BY name;

-- 4. Compter les catégories par type
SELECT 
  type,
  COUNT(*) as count
FROM categories
GROUP BY type;
