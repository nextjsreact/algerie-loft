-- ============================================================================
-- Script de Vérification de l'Import Airbnb
-- ============================================================================
-- Ce script vérifie que les données Airbnb ont été correctement importées
-- Usage: Exécuter dans Supabase SQL Editor
-- ============================================================================

-- 1. STATISTIQUES GLOBALES
-- ============================================================================
SELECT 
  '📊 STATISTIQUES GLOBALES' as section,
  '' as metric,
  '' as value;

SELECT 
  'Total réservations' as metric,
  COUNT(*)::text as value
FROM reservations;

SELECT 
  'Réservations Airbnb' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb';

SELECT 
  'Réservations manuelles' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'manual' OR source IS NULL;

-- 2. RÉPARTITION PAR STATUT
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '📋 RÉPARTITION PAR STATUT' as section,
  '' as metric,
  '' as value;

SELECT 
  status as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 3. RÉSERVATIONS PAR MOIS (DERNIERS 12 MOIS)
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '📅 RÉSERVATIONS PAR MOIS (Check-in)' as section,
  '' as metric,
  '' as value;

SELECT 
  TO_CHAR(check_in_date, 'YYYY-MM') as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND check_in_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(check_in_date, 'YYYY-MM')
ORDER BY metric DESC
LIMIT 12;

-- 4. COORDONNÉES VOYAGEUR (COMPLÉTUDE)
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '📧 COORDONNÉES VOYAGEUR' as section,
  '' as metric,
  '' as value;

SELECT 
  'Avec email' as metric,
  COUNT(*)::text || ' (' || ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM reservations WHERE source = 'airbnb'), 0), 1)::text || '%)' as value
FROM reservations
WHERE source = 'airbnb'
  AND guest_email IS NOT NULL
  AND guest_email != '';

SELECT 
  'Avec téléphone' as metric,
  COUNT(*)::text || ' (' || ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM reservations WHERE source = 'airbnb'), 0), 1)::text || '%)' as value
FROM reservations
WHERE source = 'airbnb'
  AND guest_phone IS NOT NULL
  AND guest_phone != '';

SELECT 
  'Avec nationalité' as metric,
  COUNT(*)::text || ' (' || ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM reservations WHERE source = 'airbnb'), 0), 1)::text || '%)' as value
FROM reservations
WHERE source = 'airbnb'
  AND guest_nationality IS NOT NULL
  AND guest_nationality != '';

SELECT 
  'Coordonnées complètes' as metric,
  COUNT(*)::text || ' (' || ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM reservations WHERE source = 'airbnb'), 0), 1)::text || '%)' as value
FROM reservations
WHERE source = 'airbnb'
  AND guest_email IS NOT NULL AND guest_email != ''
  AND guest_phone IS NOT NULL AND guest_phone != ''
  AND guest_nationality IS NOT NULL AND guest_nationality != '';

-- 5. LOFTS AVEC MAPPING AIRBNB
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '🏠 MAPPING LOFTS' as section,
  '' as metric,
  '' as value;

SELECT 
  'Lofts avec airbnb_listing_id' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Lofts sans airbnb_listing_id' as metric,
  COUNT(*)::text as value
FROM lofts
WHERE airbnb_listing_id IS NULL;

-- 6. LOGS DE SYNCHRONISATION
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '📝 DERNIERS LOGS DE SYNC' as section,
  '' as metric,
  '' as value;

SELECT 
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI') as metric,
  sync_type || ' - ' || status || ' (' || 
  COALESCE(reservations_created, 0)::text || ' créées, ' || 
  COALESCE(reservations_updated, 0)::text || ' MAJ, ' || 
  COALESCE(reservations_failed, 0)::text || ' échecs)' as value
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- 7. CONFLITS DÉTECTÉS
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '⚠️  CONFLITS' as section,
  '' as metric,
  '' as value;

SELECT 
  'Conflits non résolus' as metric,
  COUNT(*)::text as value
FROM airbnb_conflicts
WHERE resolved_at IS NULL;

SELECT 
  'Conflits résolus' as metric,
  COUNT(*)::text as value
FROM airbnb_conflicts
WHERE resolved_at IS NOT NULL;

-- 8. TOP 10 LOFTS PAR NOMBRE DE RÉSERVATIONS
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '🏆 TOP 10 LOFTS (Réservations Airbnb)' as section,
  '' as metric,
  '' as value;

SELECT 
  l.name as metric,
  COUNT(r.id)::text || ' réservations' as value
FROM reservations r
JOIN lofts l ON r.loft_id = l.id
WHERE r.source = 'airbnb'
GROUP BY l.name
ORDER BY COUNT(r.id) DESC
LIMIT 10;

-- 9. RÉSERVATIONS RÉCENTES (DERNIÈRES 10)
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '🕐 DERNIÈRES RÉSERVATIONS IMPORTÉES' as section,
  '' as metric,
  '' as value;

SELECT 
  airbnb_confirmation_code as metric,
  guest_name || ' - ' || 
  TO_CHAR(check_in_date, 'DD/MM/YYYY') || ' → ' || 
  TO_CHAR(check_out_date, 'DD/MM/YYYY') || ' (' || 
  status || ')' as value
FROM reservations
WHERE source = 'airbnb'
ORDER BY synced_at DESC
LIMIT 10;

-- 10. MONTANTS TOTAUX
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '💰 MONTANTS TOTAUX' as section,
  '' as metric,
  '' as value;

SELECT 
  'Montant total (toutes devises)' as metric,
  ROUND(SUM(total_amount), 2)::text || ' (mixte)' as value
FROM reservations
WHERE source = 'airbnb';

SELECT 
  currency_code as metric,
  ROUND(SUM(total_amount), 2)::text || ' ' || currency_code as value
FROM reservations
WHERE source = 'airbnb'
  AND currency_code IS NOT NULL
GROUP BY currency_code
ORDER BY SUM(total_amount) DESC;

-- 11. RÉSERVATIONS À VENIR
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '📅 RÉSERVATIONS À VENIR' as section,
  '' as metric,
  '' as value;

SELECT 
  'Total à venir' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND check_in_date >= CURRENT_DATE;

SELECT 
  'Dans les 7 prochains jours' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND check_in_date >= CURRENT_DATE
  AND check_in_date < CURRENT_DATE + INTERVAL '7 days';

SELECT 
  'Dans les 30 prochains jours' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND check_in_date >= CURRENT_DATE
  AND check_in_date < CURRENT_DATE + INTERVAL '30 days';

-- 12. DURÉE MOYENNE DE SÉJOUR
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '📊 STATISTIQUES DE SÉJOUR' as section,
  '' as metric,
  '' as value;

SELECT 
  'Durée moyenne de séjour' as metric,
  ROUND(AVG(nights), 1)::text || ' nuits' as value
FROM reservations
WHERE source = 'airbnb';

SELECT 
  'Nombre moyen de voyageurs' as metric,
  ROUND(AVG(guest_count), 1)::text || ' personnes' as value
FROM reservations
WHERE source = 'airbnb';

-- 13. RÉSERVATIONS SANS LOFT MAPPÉ
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '⚠️  RÉSERVATIONS SANS LOFT MAPPÉ' as section,
  '' as metric,
  '' as value;

SELECT 
  'Réservations orphelines' as metric,
  COUNT(*)::text as value
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NULL;

-- Si des réservations orphelines existent, afficher les listing_id concernés
SELECT 
  'Listing IDs non mappés' as metric,
  STRING_AGG(DISTINCT airbnb_confirmation_code, ', ') as value
FROM reservations
WHERE source = 'airbnb'
  AND loft_id IS NULL
LIMIT 1;

-- ============================================================================
-- FIN DU RAPPORT
-- ============================================================================
SELECT 
  '' as section,
  '' as metric,
  '' as value;

SELECT 
  '✅ RAPPORT TERMINÉ' as section,
  TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as metric,
  '' as value;
