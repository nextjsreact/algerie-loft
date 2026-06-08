-- Script de test pour créer une nouvelle notification Airbnb
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Récupérer un loft existant et l'utilisateur admin
WITH loft_info AS (
  SELECT id, name FROM lofts LIMIT 1
),
admin_user AS (
  SELECT id FROM profiles WHERE role = 'admin' LIMIT 1
)

-- 2. Créer une notification de test
INSERT INTO airbnb_notifications (
  reservation_id,
  loft_id,
  type,
  title,
  message,
  metadata,
  is_read
)
SELECT
  gen_random_uuid(), -- ID de réservation fictif
  loft_info.id,
  'new',
  '🎉 Nouvelle réservation - ' || loft_info.name,
  'Jean Dupont • 15 juin 2026 → 18 juin 2026 (3 nuits) • 45 000 DA',
  jsonb_build_object(
    'guest_name', 'Jean Dupont',
    'check_in', '2026-06-15',
    'check_out', '2026-06-18',
    'total_price', 45000,
    'status', 'confirmed',
    'loft_name', loft_info.name,
    'test', true
  ),
  false
FROM loft_info, admin_user;

-- 3. Vérifier la notification créée
SELECT 
  id,
  type,
  title,
  message,
  is_read,
  created_at,
  metadata->>'guest_name' as guest,
  metadata->>'loft_name' as loft
FROM airbnb_notifications
WHERE metadata->>'test' = 'true'
ORDER BY created_at DESC
LIMIT 1;
