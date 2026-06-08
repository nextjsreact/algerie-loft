-- ================================================================
-- 🚨 FIX URGENT: Contrainte guest_nationality + Insertion 19 réservations
-- ================================================================
--
-- PROBLÈME DÉTECTÉ:
-- La contrainte NOT NULL sur guest_nationality bloque l'insertion
-- La migration 007_make_guest_fields_nullable.sql n'a pas été appliquée
--
-- SOLUTION EN 2 ÉTAPES:
-- 1. Supprimer la contrainte NOT NULL sur guest_nationality
-- 2. Insérer les 19 réservations manquantes
--
-- ================================================================

-- ================================================================
-- ÉTAPE 1: SUPPRIMER CONTRAINTE NOT NULL
-- ================================================================

-- Vérifier l'état actuel de la colonne
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('guest_email', 'guest_nationality', 'guest_phone')
ORDER BY column_name;

-- Rendre guest_email nullable (si pas déjà fait)
DO $$ 
BEGIN
  ALTER TABLE reservations
    ALTER COLUMN guest_email DROP NOT NULL;
  RAISE NOTICE 'guest_email est maintenant nullable ✅';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'guest_email était déjà nullable ou erreur: %', SQLERRM;
END $$;

-- Rendre guest_nationality nullable
DO $$ 
BEGIN
  ALTER TABLE reservations
    ALTER COLUMN guest_nationality DROP NOT NULL;
  RAISE NOTICE 'guest_nationality est maintenant nullable ✅';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'guest_nationality était déjà nullable ou erreur: %', SQLERRM;
END $$;

-- Rendre guest_phone nullable (si pas déjà fait)
DO $$ 
BEGIN
  ALTER TABLE reservations
    ALTER COLUMN guest_phone DROP NOT NULL;
  RAISE NOTICE 'guest_phone est maintenant nullable ✅';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'guest_phone était déjà nullable ou erreur: %', SQLERRM;
END $$;

-- Ajouter commentaires
COMMENT ON COLUMN reservations.guest_email IS 'Email du voyageur. NULL si non disponible (scraping Airbnb).';
COMMENT ON COLUMN reservations.guest_nationality IS 'Nationalité du voyageur (code ISO 2 lettres). NULL si non disponible.';
COMMENT ON COLUMN reservations.guest_phone IS 'Téléphone du voyageur. NULL si non disponible.';

-- Vérifier que la contrainte a été supprimée
SELECT 
  column_name,
  data_type,
  is_nullable as nullable_maintenant,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ OK'
    ELSE '❌ Toujours NOT NULL'
  END as status
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('guest_email', 'guest_nationality', 'guest_phone')
ORDER BY column_name;

-- ================================================================
-- ÉTAPE 2: INSÉRER LES 19 RÉSERVATIONS MANQUANTES
-- ================================================================

-- Vérifier combien de réservations manquent AVANT insertion
SELECT 
  COUNT(*) as reservations_manquantes_avant_insertion
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  );
-- Devrait retourner 19

-- Insertion des 19 réservations manquantes
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
  guest_nationality,
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
  
  -- Statut basé sur le statut Airbnb
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
  
  -- ✅ Utiliser NULL au lieu de chaînes vides pour champs optionnels
  NULLIF(s.raw_data->>'guest_email', '') as guest_email,
  NULLIF(s.raw_data->>'guest_phone', '') as guest_phone,
  NULLIF(s.raw_data->>'guest_nationality', '') as guest_nationality,
  
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
  loft_id,
  guest_nationality;

-- ================================================================
-- ÉTAPE 3: VÉRIFICATION POST-INSERTION
-- ================================================================

-- 3a. Compter les réservations après récupération
SELECT 
  COUNT(*) as total_reservations_airbnb,
  COUNT(CASE WHEN guest_nationality IS NOT NULL THEN 1 END) as avec_nationalite,
  COUNT(CASE WHEN guest_nationality IS NULL THEN 1 END) as sans_nationalite
FROM reservations
WHERE source = 'airbnb_scraper';
-- Devrait être 76 + 19 = 95 réservations

-- 3b. Vérifier qu'il ne reste plus de réservations manquantes
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

-- 3c. Liste des 19 réservations récupérées avec détails
SELECT 
  r.airbnb_confirmation_code,
  r.guest_name,
  l.name as loft,
  r.check_in_date,
  r.check_out_date,
  r.status,
  r.total_amount,
  r.currency_code,
  r.guest_nationality,
  CASE 
    WHEN r.guest_nationality IS NOT NULL THEN '✅ Nationalité présente'
    ELSE '⚠️  Nationalité NULL (normal pour Airbnb)'
  END as nationalite_status,
  r.synced_at as date_recuperation
FROM reservations r
INNER JOIN lofts l ON l.id = r.loft_id
WHERE r.synced_at > NOW() - INTERVAL '5 minutes'
  AND r.source = 'airbnb_scraper'
ORDER BY r.synced_at DESC;

-- 3d. Distribution des statuts après récupération
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status
ORDER BY nombre DESC;

-- 3e. Calcul des revenus récupérés
SELECT 
  COUNT(*) as nb_reservations_recuperees,
  SUM(total_amount) as revenus_recuperes_dzd,
  MIN(check_in_date) as premiere_reservation,
  MAX(check_out_date) as derniere_reservation,
  SUM(check_out_date::date - check_in_date::date) as total_nuits
FROM reservations
WHERE synced_at > NOW() - INTERVAL '5 minutes'
  AND source = 'airbnb_scraper';

-- ================================================================
-- RÉSUMÉ ATTENDU
-- ================================================================

/*
ÉTAPE 1 - CONTRAINTE:
✅ guest_email maintenant nullable
✅ guest_nationality maintenant nullable
✅ guest_phone maintenant nullable

ÉTAPE 2 - INSERTION:
✅ 19 réservations insérées avec succès
✅ Certaines avec guest_nationality NULL (normal pour Airbnb)

ÉTAPE 3 - VÉRIFICATION:
┌──────────────────────────────────┬─────────┐
│ Metric                           │ Valeur  │
├──────────────────────────────────┼─────────┤
│ Réservations Airbnb dans DB      │   95    │ ✅ +19
│ Réservations manquantes          │    0    │ ✅
│ Taux de synchronisation          │ 100%    │ ✅
└──────────────────────────────────┴─────────┘
*/

-- ================================================================
-- PROCHAINES ÉTAPES
-- ================================================================

/*
1. ✅ Exécuter ce script complet dans Supabase SQL Editor
2. 🔧 Corriger le bug dans airbnb-sync-service-optimized.ts
   - Lignes 377-406 et 418-431
   - Enregistrer les erreurs dans this.errors
3. 🔄 Redémarrer le serveur Next.js
4. 📊 Vérifier les statistiques dans l'interface
5. 📅 Vérifier la disponibilité des lofts
*/
