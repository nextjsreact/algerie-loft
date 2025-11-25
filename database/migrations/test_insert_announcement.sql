-- TEST D'INSERTION DIRECTE
-- Exécuter dans Supabase SQL Editor APRÈS avoir exécuté fix_rls_superuser.sql

-- 1. Vérifier votre identité
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email,
  (SELECT role::text FROM profiles WHERE id = auth.uid()) as my_role;

-- 2. Test d'insertion directe (devrait fonctionner)
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
  'Test depuis SQL',
  'Test from SQL',
  'اختبار من SQL',
  NOW(),
  NOW() + INTERVAL '7 days',
  '#FF0000',
  '#FFFFFF',
  true
)
RETURNING *;

-- 3. Vérifier que l'insertion a fonctionné
SELECT 
  id,
  message_fr,
  message_en,
  is_active,
  created_at
FROM urgent_announcements
ORDER BY created_at DESC
LIMIT 5;

-- 4. Nettoyer le test (optionnel)
-- DELETE FROM urgent_announcements WHERE message_fr = 'Test depuis SQL';
