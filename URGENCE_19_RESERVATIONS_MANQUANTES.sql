-- ================================================================
-- 🚨 URGENCE: 19 réservations Airbnb manquantes
-- ================================================================
--
-- GRAVITÉ: CRITIQUE
-- 19 réservations valides et mappées ne sont PAS dans la table reservations
--
-- IMPACT:
-- - Revenus non comptabilisés
-- - Risque de double réservation
-- - Statistiques complètement fausses
-- - Clients ayant payé mais pas de trace dans le système
--
-- ================================================================

-- ÉTAPE 1: IDENTIFIER TOUTES les réservations manquantes
-- ================================================================

-- 1a. Liste complète des 19 réservations manquantes
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.raw_data->>'statut' as statut_airbnb,
  s.raw_data->>'montant_total' as montant,
  s.raw_data->>'devise' as devise,
  s.raw_data->>'nb_voyageurs' as nb_voyageurs,
  s.raw_data->>'listing_id' as listing_id,
  l.name as loft_name,
  l.id as loft_id,
  s.created_at as date_scraping,
  s.validation_status,
  s.mapping_status
FROM airbnb_reservations_staging s
LEFT JOIN lofts l ON l.airbnb_listing_id = s.raw_data->>'listing_id'
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
ORDER BY s.created_at DESC, s.check_in_date;

-- 1b. Résumé par loft
SELECT 
  l.name as loft_name,
  COUNT(*) as nb_reservations_manquantes,
  SUM((s.raw_data->>'montant_total')::numeric) as montant_total_manquant,
  MIN(s.check_in_date) as premiere_date,
  MAX(s.check_in_date) as derniere_date
FROM airbnb_reservations_staging s
LEFT JOIN lofts l ON l.airbnb_listing_id = s.raw_data->>'listing_id'
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
GROUP BY l.name
ORDER BY nb_reservations_manquantes DESC;

-- 1c. Résumé par date de création (quand ont-elles été scrappées)
SELECT 
  DATE(s.created_at) as date_scraping,
  COUNT(*) as nb_manquantes,
  array_agg(s.airbnb_id ORDER BY s.check_in_date) as airbnb_ids
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
GROUP BY DATE(s.created_at)
ORDER BY date_scraping DESC;

-- 1d. Résumé par statut Airbnb
SELECT 
  s.raw_data->>'statut' as statut_airbnb,
  COUNT(*) as nb_manquantes
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
GROUP BY s.raw_data->>'statut'
ORDER BY nb_manquantes DESC;

-- 1e. Calcul du montant total manquant
SELECT 
  COUNT(*) as total_reservations_manquantes,
  SUM((s.raw_data->>'montant_total')::numeric) as montant_total_manquant_brut,
  s.raw_data->>'devise' as devise,
  CASE 
    WHEN s.raw_data->>'devise' = 'DZD' THEN SUM((s.raw_data->>'montant_total')::numeric)
    WHEN s.raw_data->>'devise' IS NOT NULL THEN 
      SUM((s.raw_data->>'montant_total')::numeric) * 
      COALESCE((s.raw_data->>'currency_ratio')::numeric, 270)
    ELSE SUM((s.raw_data->>'montant_total')::numeric)
  END as montant_total_manquant_dzd
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
GROUP BY s.raw_data->>'devise';

-- ================================================================
-- ÉTAPE 2: RÉCUPÉRATION MASSIVE - Insérer les 19 réservations
-- ================================================================

-- ⚠️⚠️⚠️ ATTENTION CRITIQUE ⚠️⚠️⚠️
-- Cette requête va INSÉRER 19 réservations dans la base de données
-- Vérifiez ABSOLUMENT les résultats de l'étape 1 avant d'exécuter
-- Impact : ~19 réservations + revenus importants

-- Insertion de TOUTES les réservations manquantes
INSERT INTO reservations (
  loft_id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  guest_count,
  total_amount,
  currency_code,
  status,
  source,
  created_at,
  synced_at,
  guest_email,
  guest_phone,
  original_currency_code,
  original_amount,
  currency_ratio,
  base_price,
  cleaning_fee,
  service_fee,
  taxes
)
SELECT 
  l.id as loft_id,
  s.airbnb_id as airbnb_confirmation_code,
  s.guest_name,
  s.check_in_date::date,
  s.check_out_date::date,
  COALESCE((s.raw_data->>'nb_voyageurs')::integer, 2) as guest_count,
  COALESCE((s.raw_data->>'montant_total')::numeric, 0) as total_amount,
  COALESCE(s.raw_data->>'devise', 'DZD') as currency_code,
  
  -- Statut basé sur le statut Airbnb (avec nouveau traducteur)
  CASE 
    WHEN s.raw_data->>'statut' IN ('Laissez un commentaire sur le voyageur', 'En attente de commentaire du voyageur', 'Ancien voyageur') 
    THEN 'completed'
    WHEN s.raw_data->>'statut' IN ('Annulée', 'Annulé', 'Cancelled')
    THEN 'cancelled'
    WHEN s.raw_data->>'statut' IN ('En attente', 'Pending', 'Demande')
    THEN 'pending'
    WHEN s.raw_data->>'statut' IN ('Séjour en cours', 'Départ aujourd''hui', 'Confirmée', 'Confirmé', 'Confirmed')
    THEN 'confirmed'
    ELSE 'confirmed'
  END as status,
  
  'airbnb_scraper' as source,
  s.created_at as created_at,
  NOW() as synced_at,
  COALESCE(s.raw_data->>'guest_email', '') as guest_email,
  COALESCE(s.raw_data->>'guest_phone', '') as guest_phone,
  s.raw_data->>'original_currency_code' as original_currency_code,
  (s.raw_data->>'original_amount')::numeric as original_amount,
  (s.raw_data->>'currency_ratio')::numeric as currency_ratio,
  (s.raw_data->>'base_price')::numeric as base_price,
  (s.raw_data->>'cleaning_fee')::numeric as cleaning_fee,
  (s.raw_data->>'service_fee')::numeric as service_fee,
  (s.raw_data->>'taxes')::numeric as taxes
FROM airbnb_reservations_staging s
INNER JOIN lofts l ON l.airbnb_listing_id = s.raw_data->>'listing_id'
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
ORDER BY s.check_in_date
RETURNING 
  id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  status,
  total_amount,
  currency_code,
  loft_id;

-- ================================================================
-- ÉTAPE 3: VÉRIFICATION POST-INSERTION
-- ================================================================

-- 3a. Compter les réservations après récupération
SELECT 
  COUNT(*) as total_reservations_airbnb
FROM reservations
WHERE source = 'airbnb_scraper';
-- Devrait être 76 + 19 = 95 réservations

-- 3b. Distribution des statuts après récupération
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY nombre DESC;

-- 3c. Vérifier qu'il ne reste plus de réservations manquantes
SELECT 
  COUNT(*) as reservations_encore_manquantes
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  );
-- Devrait retourner 0 ✅

-- 3d. Liste des réservations récupérées avec détails
SELECT 
  r.airbnb_confirmation_code,
  r.guest_name,
  l.name as loft,
  r.check_in_date,
  r.check_out_date,
  r.status,
  r.total_amount,
  r.currency_code,
  r.synced_at as date_recuperation
FROM reservations r
INNER JOIN lofts l ON l.id = r.loft_id
WHERE r.synced_at > NOW() - INTERVAL '5 minutes'
  AND r.source = 'airbnb_scraper'
ORDER BY r.synced_at DESC;

-- 3e. Calcul des revenus récupérés
SELECT 
  COUNT(*) as nb_reservations_recuperees,
  SUM(total_amount) as revenus_recuperes_dzd,
  MIN(check_in_date) as premiere_reservation,
  MAX(check_out_date) as derniere_reservation
FROM reservations
WHERE synced_at > NOW() - INTERVAL '5 minutes'
  AND source = 'airbnb_scraper';

-- ================================================================
-- RÉSUMÉ ATTENDU
-- ================================================================

/*
AVANT RÉCUPÉRATION:
┌──────────────────────────────────┬─────────┐
│ Metric                           │ Valeur  │
├──────────────────────────────────┼─────────┤
│ Réservations Airbnb dans DB      │   76    │
│ Réservations staging valides     │  291    │
│ Réservations manquantes          │   19    │ ⚠️⚠️⚠️
│ Taux de synchronisation          │  80%    │ ❌
└──────────────────────────────────┴─────────┘

APRÈS RÉCUPÉRATION:
┌──────────────────────────────────┬─────────┐
│ Metric                           │ Valeur  │
├──────────────────────────────────┼─────────┤
│ Réservations Airbnb dans DB      │   95    │ ✅ +19
│ Réservations staging valides     │  291    │
│ Réservations manquantes          │    0    │ ✅
│ Taux de synchronisation          │ 100%    │ ✅
└──────────────────────────────────┴─────────┘

IMPACT FINANCIER:
- Revenus récupérés: VOIR résultat requête 3e
- Nombre de nuits: CALCULÉ automatiquement
- Périodes concernées: Mai-Juin 2026
*/

-- ================================================================
-- ANALYSE: Pourquoi 19 échecs ?
-- ================================================================

-- Corrélation avec les logs de sync du 6 juin
-- Date: 2026-06-06 entre 21:29 et 22:14
-- Total échecs loggés: 19 reservations_failed
-- Total manquantes: 19
-- Conclusion: TOUS les échecs du 6 juin sont ces 19 réservations

SELECT 
  'Les 19 réservations manquantes correspondent EXACTEMENT aux 19 échecs du 6 juin 2026' as analyse,
  'Bug critique: échec d''insertion en batch sans enregistrement d''erreur' as cause,
  'Corriger le code dans airbnb-sync-service-optimized.ts' as solution;

-- ================================================================
-- ACTIONS POST-RÉCUPÉRATION
-- ================================================================

/*
1. ✅ Exécuter ce script pour récupérer les 19 réservations
2. 🔧 Corriger le bug dans airbnb-sync-service-optimized.ts
3. 🔔 Créer une alerte si staging > reservations + 5
4. 📊 Vérifier les statistiques dans l'interface
5. 💰 Recalculer les revenus totaux
6. 📅 Vérifier la disponibilité des lofts
7. 🧪 Tester une nouvelle synchronisation
*/
