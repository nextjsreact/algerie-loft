-- Script pour corriger les réservations Airbnb en statut "pending" qui devraient être "confirmed"
-- 
-- ATTENTION : Ce script modifie les données !
-- Exécutez d'abord check-airbnb-reservation-statuses.sql pour diagnostic
--
-- Ce script corrige UNIQUEMENT les réservations qui :
-- 1. Proviennent d'Airbnb (source = 'airbnb_scraper')
-- 2. Sont en statut "pending"
-- 3. Ont une date de check-in dans le futur ou récente
-- 4. N'ont PAS été annulées

-- OPTION 1: Mettre toutes les réservations Airbnb "pending" en "confirmed"
-- (sauf celles qui sont clairement annulées)
UPDATE reservations
SET 
  status = 'confirmed',
  updated_at = NOW()
WHERE 
  source = 'airbnb_scraper'
  AND status = 'pending'
  AND cancelled_at IS NULL
  AND cancellation_reason IS NULL
  AND check_in_date >= CURRENT_DATE - INTERVAL '7 days'  -- Seulement les réservations récentes/futures
RETURNING 
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  status;

-- Afficher le résultat
SELECT 
  'Réservations corrigées' as "Action",
  COUNT(*) as "Nombre"
FROM reservations
WHERE 
  source = 'airbnb_scraper'
  AND status = 'confirmed'
  AND updated_at > NOW() - INTERVAL '1 minute';
