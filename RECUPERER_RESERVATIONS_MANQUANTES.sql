-- ================================================================
-- RÉCUPÉRATION: 3 réservations Airbnb manquantes
-- ================================================================
--
-- PROBLÈME:
-- 3 réservations valides et mappées dans staging mais absentes de reservations
-- - HM485Y9PET (Jiakun Zheng - Purple's loft)
-- - HMPQKER8J5 (Abdel Djoumad - Amel loft)
-- - HMK58SP4JB (Ouardia Yahiaoui - La redoute N5)
--
-- CAUSE:
-- Bug de synchronisation - échec d'insertion non loggé
--
-- SOLUTION:
-- Insérer manuellement depuis staging
--
-- ================================================================

-- ÉTAPE 1: Vérifier les données avant insertion
-- ================================================================

-- 1a. Voir les détails complets des 3 réservations
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  s.raw_data->>'nb_voyageurs' as nb_voyageurs,
  s.raw_data->>'montant_total' as montant_total,
  s.raw_data->>'devise' as devise,
  s.raw_data->>'statut' as statut_airbnb,
  s.raw_data->>'guest_email' as email,
  s.raw_data->>'guest_phone' as phone,
  s.raw_data->>'listing_id' as listing_id,
  l.id as loft_id,
  l.name as loft_name,
  s.validation_status,
  s.mapping_status
FROM airbnb_reservations_staging s
INNER JOIN lofts l ON l.airbnb_listing_id = s.raw_data->>'listing_id'
WHERE s.airbnb_id IN ('HM485Y9PET', 'HMPQKER8J5', 'HMK58SP4JB')
ORDER BY s.created_at;

-- 1b. Vérifier qu'elles n'existent vraiment pas dans reservations
SELECT 
  COUNT(*) as deja_existantes
FROM reservations
WHERE airbnb_confirmation_code IN ('HM485Y9PET', 'HMPQKER8J5', 'HMK58SP4JB');
-- Devrait retourner 0

-- ================================================================
-- ÉTAPE 2: INSERTION des réservations manquantes
-- ================================================================

-- ⚠️ ATTENTION: Cette requête va INSÉRER dans la base de données
-- Vérifiez les résultats de l'étape 1 avant d'exécuter

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
  currency_ratio
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
  CASE 
    WHEN s.raw_data->>'statut' IN ('Laissez un commentaire sur le voyageur', 'En attente de commentaire du voyageur', 'Ancien voyageur') 
    THEN 'completed'
    WHEN s.raw_data->>'statut' IN ('Séjour en cours', 'Départ aujourd''hui')
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
  (s.raw_data->>'currency_ratio')::numeric as currency_ratio
FROM airbnb_reservations_staging s
INNER JOIN lofts l ON l.airbnb_listing_id = s.raw_data->>'listing_id'
WHERE s.airbnb_id IN ('HM485Y9PET', 'HMPQKER8J5', 'HMK58SP4JB')
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
RETURNING 
  id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  status,
  total_amount,
  currency_code;

-- ================================================================
-- ÉTAPE 3: VÉRIFICATION
-- ================================================================

-- 3a. Vérifier que les 3 réservations sont maintenant dans la table
SELECT 
  r.id,
  r.airbnb_confirmation_code,
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.status,
  r.total_amount,
  r.currency_code,
  l.name as loft_name,
  r.created_at,
  r.synced_at
FROM reservations r
INNER JOIN lofts l ON l.id = r.loft_id
WHERE r.airbnb_confirmation_code IN ('HM485Y9PET', 'HMPQKER8J5', 'HMK58SP4JB')
ORDER BY r.check_in_date;

-- Devrait retourner 3 lignes ✅

-- 3b. Voir la nouvelle distribution des statuts
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY nombre DESC;

-- Devrait être : confirmed ~75, completed ~4

-- 3c. Vérifier s'il reste d'autres réservations manquantes
SELECT 
  COUNT(*) as autres_manquantes
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  );

-- Devrait retourner 0 ✅

-- 3d. Détail des réservations récupérées avec calculs
SELECT 
  r.guest_name,
  r.airbnb_confirmation_code,
  l.name as loft,
  r.check_in_date,
  r.check_out_date,
  r.check_out_date - r.check_in_date as nb_nuits,
  r.status,
  r.total_amount,
  r.currency_code,
  r.original_amount,
  r.original_currency_code,
  CASE 
    WHEN r.original_currency_code IS NOT NULL AND r.original_currency_code != 'DZD'
    THEN r.original_amount || ' ' || r.original_currency_code || ' (≈ ' || r.total_amount || ' DZD)'
    ELSE r.total_amount || ' ' || r.currency_code
  END as montant_affiche
FROM reservations r
INNER JOIN lofts l ON l.id = r.loft_id
WHERE r.airbnb_confirmation_code IN ('HM485Y9PET', 'HMPQKER8J5', 'HMK58SP4JB')
ORDER BY r.check_in_date;

-- ================================================================
-- RÉSUMÉ ATTENDU
-- ================================================================

/*
AVANT RÉCUPÉRATION:
- Réservations Airbnb dans DB: 76
- Réservations dans staging non synchronisées: 3
- Revenus manquants: ??? DZD

APRÈS RÉCUPÉRATION:
- Réservations Airbnb dans DB: 79 (+3) ✅
- Réservations dans staging non synchronisées: 0 ✅
- Revenus récupérés: Total des 3 réservations ✅

IMPACT:
✅ Statistiques complètes
✅ Revenus corrects
✅ Disponibilité mise à jour
✅ Plus de risque de double réservation sur ces dates
*/

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================

/*
1. Ces réservations ont été créées dans staging le 6 juin 2026
2. Elles ont échoué lors de la synchronisation (bug d'insertion)
3. Elles sont VALIDES et MAPPÉES mais n'ont jamais été insérées
4. Cette récupération manuelle est nécessaire car le bug a empêché l'insertion automatique
5. Le bug dans le code devrait être corrigé pour éviter que cela se reproduise

PROCHAINES ÉTAPES:
- Corriger le code pour enregistrer toutes les erreurs d'insertion
- Surveiller les prochaines synchronisations pour détecter d'autres échecs
- Mettre en place une alerte si des réservations staging ne sont pas synchronisées après 24h
*/
