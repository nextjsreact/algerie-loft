-- Supprimer le loft s'il existe déjà (pour éviter les doublons)
DELETE FROM lofts WHERE name = 'Heaven Loft';

-- Insérer le loft "Heaven Loft" pour les tests
INSERT INTO lofts (
  name, 
  address, 
  price_per_month, 
  status, 
  description,
  company_percentage, 
  owner_percentage,
  created_at,
  updated_at
) VALUES (
  'Heaven Loft',
  '48 rue Oukil El Hadj. Batiment F, 10ème étage. El mouradia',
  9000,
  'available',
  'Profitez avec toute la famille dans cet appartement confortable, calme, avec une magnifique vue panoramique',
  50.00,
  50.00,
  NOW(),
  NOW()
);

-- Vérifier que le loft a été inséré
SELECT id, name, address, price_per_month, status, description 
FROM lofts 
WHERE name = 'Heaven Loft';