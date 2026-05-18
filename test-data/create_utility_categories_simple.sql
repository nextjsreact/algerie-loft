-- Script simplifié pour créer les catégories d'utilitaires
-- Sans ON CONFLICT (car pas de contrainte UNIQUE sur name)

-- 1. D'abord, vérifier si les catégories existent déjà
SELECT 
  id, 
  name, 
  type,
  description
FROM categories 
WHERE name IN ('eau', 'energie', 'telephone', 'internet')
ORDER BY name;

-- 2. Si aucune catégorie n'est retournée ci-dessus, exécutez ceci :
-- (Sinon, passez à l'étape 3)

INSERT INTO categories (name, type, description)
VALUES 
  ('eau', 'expense', 'Factures d''eau'),
  ('energie', 'expense', 'Factures d''énergie (électricité + gaz)'),
  ('telephone', 'expense', 'Factures de téléphone'),
  ('internet', 'expense', 'Factures d''internet');

-- 3. Vérifier que les catégories ont été créées
SELECT 
  id, 
  name, 
  type,
  description
FROM categories 
WHERE name IN ('eau', 'energie', 'telephone', 'internet')
ORDER BY name;
