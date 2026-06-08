-- ================================================================
-- 🔄 SYNCHRONISER LES ANNULATIONS AIRBNB
-- ================================================================
--
-- Ce script applique les annulations Airbnb qui n'ont pas été
-- synchronisées automatiquement depuis staging vers reservations
--
-- Date: 2026-06-08
-- ================================================================

-- ================================================================
-- ÉTAPE 1 : DIAGNOSTIC PRÉLIMINAIRE
-- ================================================================

-- 1a. Compter les annulations dans staging
SELECT 
  'Total annulations dans Airbnb staging' as metric,
  COUNT(*) as valeur
FROM airbnb_reservations_staging s
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled');

-- 1b. Compter les annulations déjà synchronisées correctement
SELECT 
  'Annulations déjà marquées cancelled en DB' as metric,
  COUNT(*) as valeur
FROM airbnb_reservations_staging s
INNER JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status = 'cancelled';

-- 1c. Identifier les annulations à synchroniser
SELECT 
  'Annulations à appliquer (status incorrect)' as metric,
  COUNT(*) as valeur
FROM airbnb_reservations_staging s
INNER JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled'
  AND r.source = 'airbnb_scraper';

-- ================================================================
-- ÉTAPE 2 : VOIR LES DÉTAILS DES ANNULATIONS À APPLIQUER
-- ================================================================

-- 2a. Liste complète des réservations à marquer comme annulées
SELECT 
  r.id,
  r.airbnb_confirmation_code,
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.status as status_actuel,
  'cancelled' as nouveau_status,
  s.raw_data->>'statut' as statut_airbnb,
  r.total_amount,
  r.currency_code,
  l.name as loft_name,
  DATE(s.created_at) as date_scraping
FROM reservations r
INNER JOIN airbnb_reservations_staging s ON s.airbnb_id = r.airbnb_confirmation_code
INNER JOIN lofts l ON l.id = r.loft_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled'
  AND r.source = 'airbnb_scraper'
ORDER BY r.check_in_date;

-- 2b. Résumé par loft des annulations à traiter
SELECT 
  l.name as loft_name,
  COUNT(*) as nb_annulations_a_appliquer,
  SUM(r.total_amount) as montant_total_annule,
  MIN(r.check_in_date) as premiere_date,
  MAX(r.check_in_date) as derniere_date
FROM reservations r
INNER JOIN airbnb_reservations_staging s ON s.airbnb_id = r.airbnb_confirmation_code
INNER JOIN lofts l ON l.id = r.loft_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled'
  AND r.source = 'airbnb_scraper'
GROUP BY l.name
ORDER BY nb_annulations_a_appliquer DESC;

-- ================================================================
-- ÉTAPE 3 : APPLIQUER LES ANNULATIONS
-- ================================================================

-- ⚠️⚠️⚠️ ATTENTION ⚠️⚠️⚠️
-- Cette requête va MODIFIER le statut des réservations en 'cancelled'
-- Vérifiez ABSOLUMENT les résultats de l'étape 2 avant d'exécuter

-- Synchroniser les annulations depuis staging vers reservations
UPDATE reservations r
SET 
  status = 'cancelled',
  updated_at = NOW(),
  synced_at = NOW(),
  cancelled_at = COALESCE(r.cancelled_at, NOW())  -- Garder la date si déjà annulée avant
FROM airbnb_reservations_staging s
WHERE s.airbnb_id = r.airbnb_confirmation_code
  AND s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled'
  AND r.source = 'airbnb_scraper'
RETURNING 
  r.id,
  r.airbnb_confirmation_code,
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.status,
  r.cancelled_at,
  s.raw_data->>'statut' as statut_airbnb;

-- ================================================================
-- ÉTAPE 4 : VÉRIFICATION POST-SYNCHRONISATION
-- ================================================================

-- 4a. Vérifier qu'il ne reste plus d'annulations non synchronisées
SELECT 
  COUNT(*) as annulations_encore_non_synchronisees
FROM airbnb_reservations_staging s
INNER JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
  AND r.status != 'cancelled'
  AND r.source = 'airbnb_scraper';
-- Devrait retourner 0 ✅

-- 4b. Statistiques finales sur les annulations
SELECT 
  'Total annulations Airbnb' as metric,
  COUNT(*) as valeur
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'cancelled';

-- 4c. Distribution des statuts après synchronisation
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY nombre DESC;

-- 4d. Annulations par date (dernières 30 jours)
SELECT 
  DATE(cancelled_at) as date_annulation,
  COUNT(*) as nb_annulations,
  SUM(total_amount) as montant_total_annule
FROM reservations
WHERE source = 'airbnb_scraper'
  AND status = 'cancelled'
  AND cancelled_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(cancelled_at)
ORDER BY date_annulation DESC;

-- ================================================================
-- ÉTAPE 5 : LIBÉRER LA DISPONIBILITÉ (Automatique)
-- ================================================================

-- Les réservations annulées ne bloquent plus la disponibilité
-- grâce à la fonction check_loft_availability() qui vérifie status != 'cancelled'

-- Vérification : Lofts avec disponibilité restaurée après annulations
SELECT 
  l.name as loft_name,
  COUNT(*) as nb_annulations_aujourdhui,
  SUM(r.check_out_date::date - r.check_in_date::date) as nuits_liberees
FROM reservations r
INNER JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
  AND r.status = 'cancelled'
  AND DATE(r.updated_at) = CURRENT_DATE
GROUP BY l.name
ORDER BY nuits_liberees DESC;

-- ================================================================
-- RÉSUMÉ ATTENDU
-- ================================================================

/*
AVANT SYNCHRONISATION:
┌──────────────────────────────────┬─────────┐
│ Metric                           │ Valeur  │
├──────────────────────────────────┼─────────┤
│ Annulations dans staging         │    X    │
│ Annulations en DB (cancelled)    │    Y    │
│ Annulations non synchronisées    │  X-Y    │ ❌
└──────────────────────────────────┴─────────┘

APRÈS SYNCHRONISATION:
┌──────────────────────────────────┬─────────┐
│ Metric                           │ Valeur  │
├──────────────────────────────────┼─────────┤
│ Annulations dans staging         │    X    │
│ Annulations en DB (cancelled)    │    X    │ ✅
│ Annulations non synchronisées    │    0    │ ✅
│ Disponibilité restaurée          │ Auto ✅ │
└──────────────────────────────────┴─────────┘
*/

-- ================================================================
-- COMPORTEMENT SYSTÈME APRÈS ANNULATION
-- ================================================================

/*
✅ check_loft_availability() ignore les réservations cancelled
✅ Calendrier affiche les dates comme disponibles
✅ Nouvelle réservation possible sur ces dates
✅ Analytics excluent les réservations cancelled
✅ Revenus recalculés sans les annulations

INTERFACE:
- Réservations annulées affichées en rouge/barré
- Filtre pour voir/cacher les annulations
- Montant affiché mais marqué "Annulé"
*/

-- ================================================================
-- PROCHAINES SYNCHRONISATIONS
-- ================================================================

/*
Le service airbnb-sync-service-optimized.ts devrait maintenant :
✅ Détecter automatiquement les annulations dans staging
✅ Appliquer status = 'cancelled' lors du sync
✅ Logger les erreurs si échec

Si ce script doit être exécuté manuellement, c'est que :
❌ Le sync automatique a échoué
❌ Il faut vérifier les logs du service
❌ Corriger le bug dans le code TypeScript
*/
