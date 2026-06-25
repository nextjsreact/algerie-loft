-- ============================================================
-- Requête : Liste des lofts AVEC et SANS photos
-- ============================================================

-- Option 1 : Lofts avec photos dans la table loft_photos
SELECT
  l.id,
  l.name,
  l.address,
  l.status,
  COUNT(lp.id) AS nb_photos
FROM public.lofts l
INNER JOIN public.loft_photos lp ON lp.loft_id = l.id
GROUP BY l.id, l.name, l.address, l.status
ORDER BY nb_photos DESC;

-- Option 2 : Lofts avec photos dans la table loft_images
SELECT
  l.id,
  l.name,
  l.address,
  l.status,
  COUNT(li.id) AS nb_images
FROM public.lofts l
INNER JOIN public.loft_images li ON li.loft_id = l.id
GROUP BY l.id, l.name, l.address, l.status
ORDER BY nb_images DESC;

-- Option 3 : Union des deux (lofts avec photos dans l'une ou l'autre table)
SELECT
  l.id,
  l.name,
  l.address,
  l.status,
  COUNT(DISTINCT lp.id) + COUNT(DISTINCT li.id) AS nb_photos_total
FROM public.lofts l
LEFT JOIN public.loft_photos lp ON lp.loft_id = l.id
LEFT JOIN public.loft_images li ON li.loft_id = l.id
GROUP BY l.id, l.name, l.address, l.status
HAVING COUNT(DISTINCT lp.id) + COUNT(DISTINCT li.id) > 0
ORDER BY nb_photos_total DESC;

-- Option 4 : Détail par loft avec URL de la première photo
SELECT
  l.id,
  l.name,
  l.address,
  l.status,
  (SELECT lp.url FROM public.loft_photos lp WHERE lp.loft_id = l.id ORDER BY lp.order_index LIMIT 1) AS premiere_photo_url,
  (SELECT COUNT(*) FROM public.loft_photos lp WHERE lp.loft_id = l.id) AS nb_photos
FROM public.lofts l
WHERE EXISTS (SELECT 1 FROM public.loft_photos lp WHERE lp.loft_id = l.id)
ORDER BY l.name;


-- ============================================================
-- Lofts SANS photos (ni dans loft_photos ni dans loft_images)
-- ============================================================

-- Option 5 : Lofts sans aucune photo
SELECT
  l.id,
  l.name,
  l.address,
  l.status,
  l.price_per_night
FROM public.lofts l
WHERE NOT EXISTS (SELECT 1 FROM public.loft_photos lp WHERE lp.loft_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM public.loft_images li WHERE li.loft_id = l.id)
ORDER BY l.name;

-- ============================================================
-- Vue complète : TOUS les lofts avec statut photo
-- ============================================================

-- Option 6 : Tous les lofts, nombre de photos, avec indicateur
SELECT
  l.id,
  l.name,
  l.address,
  l.status,
  l.price_per_night,
  COUNT(DISTINCT lp.id) + COUNT(DISTINCT li.id) AS nb_photos_total,
  CASE
    WHEN COUNT(DISTINCT lp.id) + COUNT(DISTINCT li.id) = 0 THEN 'SANS PHOTO'
    ELSE 'AVEC PHOTO'
  END AS statut_photo
FROM public.lofts l
LEFT JOIN public.loft_photos lp ON lp.loft_id = l.id
LEFT JOIN public.loft_images li ON li.loft_id = l.id
GROUP BY l.id, l.name, l.address, l.status, l.price_per_night
ORDER BY statut_photo, l.name;
