-- Script pour alimenter la table categories avec les catégories de factures
-- Ces catégories seront utilisées lors du marquage des factures comme payées

-- Insérer les catégories de factures (utilities/services publics)
INSERT INTO categories (name, description, type) VALUES
('eau', 'Factures d''eau et services d''assainissement', 'expense'),
('energie', 'Factures d''électricité et de gaz', 'expense'),
('telephone', 'Factures de téléphone fixe et mobile', 'expense'),
('internet', 'Factures d''accès internet et services numériques', 'expense')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  type = EXCLUDED.type;

-- Insérer d'autres catégories de dépenses courantes pour les lofts
INSERT INTO categories (name, description, type) VALUES
('maintenance', 'Travaux de maintenance et réparations', 'expense'),
('cleaning', 'Services de nettoyage et entretien', 'expense'),
('insurance', 'Assurances habitation et responsabilité', 'expense'),
('taxes', 'Taxes foncières et impôts locaux', 'expense'),
('security', 'Services de sécurité et surveillance', 'expense'),
('supplies', 'Fournitures et équipements', 'expense')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  type = EXCLUDED.type;

-- Insérer quelques catégories de revenus
INSERT INTO categories (name, description, type) VALUES
('rent', 'Revenus locatifs des lofts', 'income'),
('deposit', 'Dépôts de garantie', 'income'),
('fees', 'Frais de service et commissions', 'income')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  type = EXCLUDED.type;

-- Vérifier que les catégories ont été insérées
SELECT 
  name,
  description,
  type,
  created_at
FROM categories 
ORDER BY type, name;

-- Afficher un résumé
SELECT 
  type,
  COUNT(*) as nombre_categories
FROM categories 
GROUP BY type
ORDER BY type;