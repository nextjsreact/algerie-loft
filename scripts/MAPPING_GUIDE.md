# Guide de Mapping des Lofts Airbnb

## Objectif

Mapper les `listing_id` Airbnb aux lofts dans votre base de données pour que les réservations soient automatiquement créées.

---

## Étape 1: Identifier vos listing_id Airbnb

### Méthode 1: Depuis le tableau de bord Airbnb

1. Allez sur https://www.airbnb.com/hosting
2. Cliquez sur une annonce
3. L'URL ressemble à: `https://www.airbnb.com/hosting/listings/12345678/...`
4. Le **listing_id** est `12345678`

### Méthode 2: Depuis les données scrapées

Après avoir lancé le scraper, exécutez cette requête SQL:

```sql
-- Voir tous les listing_id détectés avec le nombre de réservations
SELECT 
  listing_id,
  COUNT(*) as nb_reservations,
  STRING_AGG(DISTINCT guest_name, ', ') as voyageurs,
  MIN(check_in_date) as premiere_arrivee,
  MAX(check_out_date) as dernier_depart
FROM airbnb_reservations_staging
GROUP BY listing_id
ORDER BY nb_reservations DESC;
```

---

## Étape 2: Mapper les lofts

### Option A: Mapping manuel (recommandé pour 5-10 lofts)

```sql
-- 1. Voir vos lofts
SELECT id, name, airbnb_listing_id, active
FROM lofts
WHERE active = true
ORDER BY name;

-- 2. Mapper un loft
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE name = 'Star loft';

-- 3. Vérifier
SELECT name, airbnb_listing_id 
FROM lofts 
WHERE airbnb_listing_id IS NOT NULL;
```

### Option B: Mapping en masse (pour 10+ lofts)

```sql
-- Mapper plusieurs lofts en une seule requête
UPDATE lofts SET airbnb_listing_id = '12345678' WHERE name = 'Star loft';
UPDATE lofts SET airbnb_listing_id = '23456789' WHERE name = 'Camomille loft';
UPDATE lofts SET airbnb_listing_id = '34567890' WHERE name = 'Jasmin loft';
UPDATE lofts SET airbnb_listing_id = '45678901' WHERE name = 'Rose loft';
UPDATE lofts SET airbnb_listing_id = '56789012' WHERE name = 'Lavande loft';
-- ... etc
```

### Option C: Mapping avec CSV (pour 50+ lofts)

1. Exportez vos lofts:
```sql
SELECT id, name, airbnb_listing_id 
FROM lofts 
ORDER BY name;
```

2. Remplissez les `airbnb_listing_id` dans Excel

3. Importez avec un script Python:
```python
import csv
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

with open('lofts_mapping.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['airbnb_listing_id']:
            supabase.table('lofts').update({
                'airbnb_listing_id': row['airbnb_listing_id']
            }).eq('id', row['id']).execute()
```

---

## Étape 3: Transférer les réservations en staging

Une fois les lofts mappés, transférez les réservations du staging vers la table principale:

```sql
-- Voir les réservations prêtes à être transférées
SELECT 
  s.airbnb_id,
  s.guest_name,
  s.check_in_date,
  s.check_out_date,
  l.name as loft_name,
  s.mapping_status,
  s.reconciliation_status
FROM airbnb_reservations_staging s
JOIN lofts l ON s.loft_id = l.id
WHERE s.reconciliation_status = 'pending'
  AND s.mapping_status = 'mapped'
  AND s.validation_status = 'valid';

-- Option 1: Relancer le scraper (recommandé)
-- Le scraper va automatiquement détecter les nouveaux mappings
-- et transférer les réservations

-- Option 2: Appeler l'API manuellement
-- Utilisez le script test-with-sample-data.py avec vos données
```

---

## Étape 4: Vérifier le mapping

```sql
-- Statistiques de mapping
SELECT 
  COUNT(*) as total_lofts,
  COUNT(airbnb_listing_id) as lofts_mappes,
  COUNT(*) - COUNT(airbnb_listing_id) as lofts_non_mappes,
  ROUND(100.0 * COUNT(airbnb_listing_id) / COUNT(*), 1) as pourcentage_mappe
FROM lofts
WHERE active = true;

-- Lofts non mappés
SELECT id, name, active
FROM lofts
WHERE airbnb_listing_id IS NULL
  AND active = true
ORDER BY name;

-- Réservations par loft
SELECT 
  l.name as loft,
  l.airbnb_listing_id,
  COUNT(r.id) as nb_reservations,
  SUM(r.total_amount) as montant_total
FROM lofts l
LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb_scraper'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.id, l.name, l.airbnb_listing_id
ORDER BY nb_reservations DESC;
```

---

## Conseils

### 🎯 Commencez petit
Mappez d'abord 2-3 lofts pour tester, puis mappez le reste.

### 🔄 Relancez le scraper après mapping
Le scraper va automatiquement transférer les réservations en staging vers la table principale.

### 📊 Vérifiez régulièrement
Exécutez les requêtes de vérification pour vous assurer que tout fonctionne.

### ⚠️ Attention aux doublons
Si vous changez un `airbnb_listing_id`, les anciennes réservations ne seront pas mises à jour automatiquement.

---

## Dépannage

### Problème: "Listing ID not mapped"
**Solution:** Mappez le loft avec la requête UPDATE ci-dessus.

### Problème: Réservations en staging mais pas dans reservations
**Solution:** Vérifiez que le loft est mappé, puis relancez le scraper ou l'API.

### Problème: Mauvais mapping (réservations sur le mauvais loft)
**Solution:**
```sql
-- 1. Corriger le mapping
UPDATE lofts 
SET airbnb_listing_id = 'CORRECT_ID' 
WHERE airbnb_listing_id = 'WRONG_ID';

-- 2. Supprimer les réservations incorrectes
DELETE FROM reservations 
WHERE loft_id = 'WRONG_LOFT_ID' 
  AND source = 'airbnb_scraper';

-- 3. Relancer le scraper
```

---

## Prochaines étapes

1. ✅ Mappez vos lofts (au moins 2-3 pour tester)
2. ✅ Relancez le scraper ou l'API
3. ✅ Vérifiez les réservations dans Supabase
4. ✅ Mappez le reste des lofts
5. ✅ Configurez un planning automatique (Docker + cron)
