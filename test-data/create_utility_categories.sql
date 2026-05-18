-- Script pour créer les catégories d'utilitaires nécessaires
-- pour le paiement de factures

-- 1. Vérifier les catégories existantes
SELECT 
  'Catégories existantes:' as info,
  id, 
  name, 
  type,
  description
FROM categories 
WHERE type = 'expense'
ORDER BY name;

-- 2. Créer les catégories d'utilitaires si elles n'existent pas
INSERT INTO categories (name, type, description)
VALUES 
  ('eau', 'expense', 'Factures d''eau'),
  ('energie', 'expense', 'Factures d''énergie (électricité + gaz)'),
  ('telephone', 'expense', 'Factures de téléphone'),
  ('internet', 'expense', 'Factures d''internet')
ON CONFLICT (name) DO NOTHING;

-- 3. Vérifier que les catégories ont été créées
SELECT 
  'Catégories créées:' as info,
  id, 
  name, 
  type,
  description
FROM categories 
WHERE name IN ('eau', 'energie', 'telephone', 'internet')
ORDER BY name;

-- 4. Compter toutes les catégories par type
SELECT 
  'Résumé:' as info,
  type,
  COUNT(*) as count
FROM categories
GROUP BY type
ORDER BY type;
