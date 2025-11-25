-- TEST SIMPLE - ANNONCES
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Vérifier votre identité
SELECT 
  auth.uid() as mon_user_id,
  p.email as mon_email,
  p.role as mon_role
FROM profiles p
WHERE p.id = auth.uid();

-- 2. Compter les politiques
SELECT COUNT(*) as nombre_politiques
FROM pg_policies
WHERE tablename = 'urgent_announcements';

-- 3. Tester une insertion
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
  '🎉 TEST - Promotion spéciale',
  '🎉 TEST - Special promotion',
  '🎉 اختبار - عرض خاص',
  NOW(),
  NOW() + INTERVAL '7 days',
  '#EF4444',
  '#FFFFFF',
  true
)
RETURNING id, message_fr, is_active;
