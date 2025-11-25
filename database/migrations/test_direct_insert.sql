-- TEST DIRECT SANS CLIENT JAVASCRIPT
-- Exécuter dans Supabase SQL Editor en étant connecté

-- 1. Vérifier votre session actuelle
SELECT 
  'Votre User ID' as info,
  auth.uid()::text as valeur
UNION ALL
SELECT 
  'Votre Email',
  COALESCE(auth.email(), 'NON CONNECTÉ')
UNION ALL
SELECT 
  'Votre Rôle',
  COALESCE((SELECT role::text FROM profiles WHERE id = auth.uid()), 'PAS DE PROFIL');

-- 2. Test d'insertion DIRECT (bypass du client JS)
-- Si ça fonctionne ici mais pas dans l'app, c'est un problème de token JWT
INSERT INTO urgent_announcements (
  message_fr,
  message_en,
  message_ar,
  start_date,
  end_date,
  background_color,
  text_color,
  is_active
) VALUES (
  '🔥 Test Direct SQL - Ça marche !',
  '🔥 Direct SQL Test - It works!',
  '🔥 اختبار SQL مباشر - إنه يعمل!',
  NOW(),
  NOW() + INTERVAL '7 days',
  '#10B981',
  '#FFFFFF',
  true
)
RETURNING 
  id,
  message_fr,
  created_at,
  'SUCCESS ✓' as status;

-- 3. Vérifier que l'annonce a été créée
SELECT 
  id,
  message_fr,
  is_active,
  created_at
FROM urgent_announcements
ORDER BY created_at DESC
LIMIT 3;
