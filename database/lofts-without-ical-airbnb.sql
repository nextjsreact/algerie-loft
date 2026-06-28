-- ============================================================
-- RECHERCHE DES LOFTS SANS RÉFÉRENCES iCal / Airbnb
-- ============================================================

-- 1. Lofts SANS Airbnb Listing ID
SELECT id, name, airbnb_listing_id
FROM lofts
WHERE airbnb_listing_id IS NULL OR airbnb_listing_id = ''
ORDER BY name;

-- 2. Lofts SANS URL iCal (de la table de config de sync)
SELECT l.id, l.name, c.ical_url_airbnb, c.is_active
FROM lofts l
LEFT JOIN property_sync_config c ON c.loft_id = l.id
WHERE c.ical_url_airbnb IS NULL OR c.ical_url_airbnb = ''
ORDER BY l.name;

-- 3. Vue combinée : tous les lofts avec leurs statuts Airbnb/iCal
SELECT 
    l.id,
    l.name,
    l.airbnb_listing_id,
    CASE WHEN l.airbnb_listing_id IS NULL OR l.airbnb_listing_id = '' 
         THEN '❌ Manquant' ELSE '✅ ' || l.airbnb_listing_id 
    END AS statut_airbnb,
    c.ical_url_airbnb,
    CASE WHEN c.ical_url_airbnb IS NULL OR c.ical_url_airbnb = '' 
         THEN '❌ Manquant' ELSE '✅ Configuré' 
    END AS statut_ical,
    COALESCE(c.is_active, false) AS sync_active
FROM lofts l
LEFT JOIN property_sync_config c ON c.loft_id = l.id
ORDER BY l.name;
