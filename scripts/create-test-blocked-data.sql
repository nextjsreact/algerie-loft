-- Script pour créer des données de test pour les lofts bloqués
-- Exécutez ce script dans votre interface Supabase SQL Editor

-- D'abord, vérifions les lofts existants
SELECT id, name FROM lofts LIMIT 5;

-- Créons quelques entrées de disponibilité bloquée pour tester
-- Remplacez 'YOUR_LOFT_ID' par un vrai ID de loft de votre base de données

-- Exemple avec maintenance
INSERT INTO loft_availability (loft_id, date, is_available, blocked_reason, minimum_stay)
VALUES 
  -- Remplacez ces UUIDs par de vrais IDs de loft de votre base
  ('YOUR_LOFT_ID_1', CURRENT_DATE + INTERVAL '1 day', false, 'maintenance', 1),
  ('YOUR_LOFT_ID_1', CURRENT_DATE + INTERVAL '2 days', false, 'maintenance', 1),
  ('YOUR_LOFT_ID_2', CURRENT_DATE + INTERVAL '3 days', false, 'renovation', 1),
  ('YOUR_LOFT_ID_2', CURRENT_DATE + INTERVAL '4 days', false, 'blocked', 1)
ON CONFLICT (loft_id, date) DO UPDATE SET
  is_available = EXCLUDED.is_available,
  blocked_reason = EXCLUDED.blocked_reason;

-- Vérifier les données créées
SELECT 
  la.date,
  la.is_available,
  la.blocked_reason,
  l.name as loft_name
FROM loft_availability la
JOIN lofts l ON la.loft_id = l.id
WHERE la.is_available = false
ORDER BY la.date;