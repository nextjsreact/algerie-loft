-- ============================================================================
-- SCRIPT DE TEST : Système de Notifications Airbnb
-- ============================================================================
-- Date: 2026-06-01
-- Description: Script pour tester le système de notifications Airbnb
-- Usage: Exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Vérifier que la table existe
-- ============================================================================

SELECT 
  'Table airbnb_notifications existe' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'airbnb_notifications'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL - Table non trouvée'
  END as resultat;

-- ============================================================================
-- ÉTAPE 2 : Vérifier les colonnes
-- ============================================================================

SELECT 
  'Colonnes de la table' as test,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'airbnb_notifications'
ORDER BY ordinal_position;

-- ============================================================================
-- ÉTAPE 3 : Vérifier les indexes
-- ============================================================================

SELECT 
  'Indexes créés' as test,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'airbnb_notifications';

-- ============================================================================
-- ÉTAPE 4 : Vérifier les politiques RLS
-- ============================================================================

SELECT 
  'Politiques RLS' as test,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'airbnb_notifications';

-- ============================================================================
-- ÉTAPE 5 : Créer une notification de test
-- ============================================================================

-- Trouver une réservation Airbnb existante
WITH test_reservation AS (
  SELECT 
    r.id as reservation_id,
    r.loft_id,
    r.guest_name,
    r.check_in_date,
    r.check_out_date,
    r.total_amount,
    l.name as loft_name
  FROM reservations r
  JOIN lofts l ON l.id = r.loft_id
  WHERE r.source = 'airbnb_scraper'
  LIMIT 1
)
INSERT INTO airbnb_notifications (
  reservation_id,
  loft_id,
  type,
  title,
  message,
  metadata
)
SELECT 
  reservation_id,
  loft_id,
  'new',
  '🎉 TEST - Nouvelle réservation - ' || loft_name,
  guest_name || ' • ' || 
    TO_CHAR(check_in_date, 'DD Mon YYYY') || ' → ' || 
    TO_CHAR(check_out_date, 'DD Mon YYYY') || ' • ' ||
    TO_CHAR(total_amount, '999,999 DZD'),
  jsonb_build_object(
    'test', true,
    'created_by', 'test_script',
    'guest_name', guest_name,
    'check_in', check_in_date,
    'check_out', check_out_date,
    'total_price', total_amount,
    'loft_name', loft_name
  )
FROM test_reservation
RETURNING 
  id,
  type,
  title,
  message,
  created_at;

-- ============================================================================
-- ÉTAPE 6 : Vérifier que la notification a été créée
-- ============================================================================

SELECT 
  'Notification de test créée' as test,
  COUNT(*) as nombre,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as resultat
FROM airbnb_notifications
WHERE metadata->>'test' = 'true';

-- ============================================================================
-- ÉTAPE 7 : Afficher les notifications non lues
-- ============================================================================

SELECT 
  'Notifications non lues' as section,
  n.id,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.created_at,
  l.name as loft_name,
  r.guest_name
FROM airbnb_notifications n
LEFT JOIN lofts l ON l.id = n.loft_id
LEFT JOIN reservations r ON r.id = n.reservation_id
WHERE n.is_read = FALSE
ORDER BY n.created_at DESC
LIMIT 10;

-- ============================================================================
-- ÉTAPE 8 : Compter les notifications par type
-- ============================================================================

SELECT 
  'Statistiques par type' as section,
  type,
  COUNT(*) as nombre,
  COUNT(*) FILTER (WHERE is_read = FALSE) as non_lues,
  COUNT(*) FILTER (WHERE is_read = TRUE) as lues
FROM airbnb_notifications
GROUP BY type
ORDER BY nombre DESC;

-- ============================================================================
-- ÉTAPE 9 : Tester le marquage comme lu
-- ============================================================================

-- Marquer la notification de test comme lue
UPDATE airbnb_notifications
SET 
  is_read = TRUE,
  read_at = NOW()
WHERE metadata->>'test' = 'true'
RETURNING 
  id,
  type,
  title,
  is_read,
  read_at;

-- ============================================================================
-- ÉTAPE 10 : Vérifier que le marquage a fonctionné
-- ============================================================================

SELECT 
  'Marquage comme lu' as test,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_read = TRUE) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as resultat,
  COUNT(*) FILTER (WHERE is_read = TRUE) as notifications_lues
FROM airbnb_notifications
WHERE metadata->>'test' = 'true';

-- ============================================================================
-- ÉTAPE 11 : Tester la fonction de nettoyage
-- ============================================================================

-- Créer une vieille notification (> 90 jours)
INSERT INTO airbnb_notifications (
  reservation_id,
  loft_id,
  type,
  title,
  message,
  metadata,
  is_read,
  created_at
)
SELECT 
  r.id,
  r.loft_id,
  'new',
  'TEST - Vieille notification',
  'Cette notification devrait être supprimée',
  '{"test": true, "old": true}'::jsonb,
  TRUE,
  NOW() - INTERVAL '91 days'
FROM reservations r
WHERE r.source = 'airbnb_scraper'
LIMIT 1;

-- Exécuter la fonction de nettoyage
SELECT cleanup_old_airbnb_notifications();

-- Vérifier que la vieille notification a été supprimée
SELECT 
  'Nettoyage des vieilles notifications' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - Vieilles notifications supprimées'
    ELSE '❌ FAIL - Vieilles notifications encore présentes'
  END as resultat
FROM airbnb_notifications
WHERE metadata->>'old' = 'true';

-- ============================================================================
-- ÉTAPE 12 : Statistiques finales
-- ============================================================================

SELECT 
  '📊 STATISTIQUES FINALES' as section,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = FALSE) as non_lues,
  COUNT(*) FILTER (WHERE is_read = TRUE) as lues,
  COUNT(DISTINCT loft_id) as lofts_concernes,
  COUNT(DISTINCT type) as types_differents,
  MIN(created_at) as premiere_notification,
  MAX(created_at) as derniere_notification
FROM airbnb_notifications;

-- ============================================================================
-- ÉTAPE 13 : Top 5 des lofts avec le plus de notifications
-- ============================================================================

SELECT 
  '🏆 TOP 5 LOFTS' as section,
  l.name as loft,
  COUNT(*) as nombre_notifications,
  COUNT(*) FILTER (WHERE n.is_read = FALSE) as non_lues
FROM airbnb_notifications n
JOIN lofts l ON l.id = n.loft_id
GROUP BY l.id, l.name
ORDER BY nombre_notifications DESC
LIMIT 5;

-- ============================================================================
-- ÉTAPE 14 : Notifications récentes (dernières 24h)
-- ============================================================================

SELECT 
  '🕐 DERNIÈRES 24H' as section,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.created_at,
  l.name as loft
FROM airbnb_notifications n
LEFT JOIN lofts l ON l.id = n.loft_id
WHERE n.created_at > NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;

-- ============================================================================
-- ÉTAPE 15 : Nettoyer les notifications de test
-- ============================================================================

-- Supprimer toutes les notifications de test
DELETE FROM airbnb_notifications
WHERE metadata->>'test' = 'true'
RETURNING 
  id,
  type,
  title,
  'Notification de test supprimée' as statut;

-- ============================================================================
-- RÉSUMÉ DES TESTS
-- ============================================================================

SELECT 
  '✅ RÉSUMÉ DES TESTS' as section,
  'Tous les tests sont terminés' as message,
  'Vérifiez les résultats ci-dessus' as action;

-- ============================================================================
-- COMMANDES UTILES POUR LE DÉVELOPPEMENT
-- ============================================================================

-- Voir toutes les notifications
-- SELECT * FROM airbnb_notifications ORDER BY created_at DESC LIMIT 20;

-- Compter les notifications non lues
-- SELECT COUNT(*) FROM airbnb_notifications WHERE is_read = FALSE;

-- Marquer toutes les notifications comme lues
-- UPDATE airbnb_notifications SET is_read = TRUE, read_at = NOW() WHERE is_read = FALSE;

-- Supprimer toutes les notifications
-- DELETE FROM airbnb_notifications;

-- Réinitialiser les notifications de test
-- DELETE FROM airbnb_notifications WHERE metadata->>'test' = 'true';

-- Créer une notification manuelle
-- INSERT INTO airbnb_notifications (reservation_id, loft_id, type, title, message, metadata)
-- SELECT r.id, r.loft_id, 'new', 'Test', 'Message de test', '{}'::jsonb
-- FROM reservations r WHERE r.source = 'airbnb_scraper' LIMIT 1;
