# 📊 Guide d'Analyse et de Test - Intégration Airbnb

**Date:** 2026-05-19  
**Status:** Prêt pour analyse et test

---

## 🎯 Objectif

Ce guide vous aide à :
1. **Analyser** les données Airbnb déjà présentes
2. **Configurer** le mapping pour vos lofts
3. **Tester** l'endpoint API

---

## 📊 PARTIE 1 : Analyser les Données Existantes

### Étape 1 : Exécuter le Script d'Analyse

1. Ouvrir Supabase Dashboard : https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk
2. Aller dans **SQL Editor**
3. Copier le contenu de `supabase/migrations/analyze_airbnb_data.sql`
4. Exécuter le script

### Résultats Attendus

Le script va afficher :

#### **Section 1 : Loft avec Mapping Airbnb**
```
id | name | airbnb_listing_id | address | city
---+------+-------------------+---------+------
... | ... | 12345678 | ... | ...
```
→ Vous verrez le(s) loft(s) déjà configuré(s)

#### **Section 2 : Réservations Airbnb Synchronisées**
```
id | loft_name | guest_name | check_in_date | check_out_date | airbnb_confirmation_code
---+-----------+------------+---------------+----------------+-------------------------
... | ... | ... | 2026-05-20 | 2026-05-25 | HMABCD123
```
→ Les 2 réservations Airbnb déjà dans le système

#### **Section 3 : Réservations en Staging**
```
airbnb_id | listing_id | guest_name | mapping_status | validation_status | reconciliation_status
----------+------------+------------+----------------+-------------------+----------------------
HMXYZ789 | 87654321 | John Doe | pending | valid | pending
```
→ Les 12 réservations en attente de traitement

#### **Section 4 : Logs de Synchronisation**
```
sync_batch_id | sync_type | status | reservations_created | reservations_updated | started_at
--------------+-----------+--------+---------------------+---------------------+------------
uuid-123 | manual | success | 1 | 0 | 2026-05-18 20:00:00
```
→ Historique des 4 synchronisations

#### **Section 5 : Conflits Détectés**
```
loft_name | reservation_1_guest | res1_checkin | reservation_2_guest | res2_checkin | overlap_nights
----------+--------------------+--------------+--------------------+--------------+---------------
Loft A | Guest 1 | 2026-05-20 | Guest 2 | 2026-05-22 | 3
```
→ Le conflit à résoudre

#### **Section 6 : Statistiques Globales**
```
metric | count
-------+------
Total Lofts | 53
Lofts avec Mapping Airbnb | 1
Total Réservations | 708
Réservations Airbnb | 2
Réservations Manuelles | 706
Réservations en Staging | 12
Syncs Réussis | 3
Syncs Échoués | 1
Conflits Ouverts | 1
```

---

## 🔧 PARTIE 2 : Configurer le Mapping

### Étape 1 : Identifier vos Listing IDs Airbnb

Pour chaque loft que vous voulez synchroniser, trouvez son **listing_id** :

1. Allez sur votre compte Airbnb
2. Ouvrez l'annonce du loft
3. Regardez l'URL : `https://www.airbnb.com/rooms/12345678`
4. Le listing_id est `12345678`

### Étape 2 : Voir la Liste de vos Lofts

1. Ouvrir Supabase SQL Editor
2. Exécuter :

```sql
SELECT 
  id,
  name,
  address,
  city,
  airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✓ Mappé'
    ELSE '✗ Non mappé'
  END as mapping_status
FROM lofts
ORDER BY name;
```

### Étape 3 : Configurer le Mapping

#### **Option A : Mapper 1 loft**

```sql
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE name = 'Nom Exact du Loft';
```

#### **Option B : Mapper plusieurs lofts en une fois**

```sql
UPDATE lofts 
SET airbnb_listing_id = CASE 
  WHEN name = 'Loft 1' THEN '11111111'
  WHEN name = 'Loft 2' THEN '22222222'
  WHEN name = 'Loft 3' THEN '33333333'
END
WHERE name IN ('Loft 1', 'Loft 2', 'Loft 3');
```

#### **Option C : Utiliser le script de configuration**

1. Ouvrir `supabase/migrations/configure_airbnb_mapping.sql`
2. Modifier le template à la fin du fichier
3. Exécuter dans Supabase SQL Editor

### Étape 4 : Vérifier le Mapping

```sql
SELECT 
  name,
  airbnb_listing_id,
  '✓ Mapping configuré' as status
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;
```

---

## 🧪 PARTIE 3 : Tester l'Endpoint API

### Étape 1 : Démarrer le Serveur Next.js

```powershell
# Terminal 1
npm run dev
```

Attendez que le serveur démarre :
```
✓ Ready in 3.2s
○ Local: http://localhost:3000
```

### Étape 2 : Modifier le Script de Test (Optionnel)

Si vous voulez tester avec un listing_id spécifique :

1. Ouvrir `test-airbnb-sync.ps1`
2. Modifier la ligne :
```powershell
listing_id = "12345678"  # ← Remplacer par votre listing_id
```

### Étape 3 : Exécuter le Test

```powershell
# Terminal 2 (nouveau terminal)
.\test-airbnb-sync.ps1
```

### Résultats Possibles

#### **Résultat A : Succès avec Création** ✅
```
✓ Succès!

Métriques:
  - Processed: 1
  - Created: 1
  - Updated: 0
  - Skipped: 0
  - Failed: 0
  - Conflicts: 0

Sync Batch ID: 550e8400-e29b-41d4-a716-446655440000
```
→ **Parfait !** La réservation a été créée dans la base de données.

#### **Résultat B : Succès avec Avertissement** ⚠️
```
✓ Succès!

Métriques:
  - Processed: 1
  - Created: 0
  - Updated: 0
  - Skipped: 1
  - Failed: 0
  - Conflicts: 0

Avertissements:
  - [HMTESTXXXX] Listing ID 12345678 not mapped to any loft

Sync Batch ID: 550e8400-e29b-41d4-a716-446655440000
```
→ **Normal !** Le listing_id du test n'est pas mappé. Retournez à la PARTIE 2 pour configurer le mapping.

#### **Résultat C : Succès avec Mise à Jour** 🔄
```
✓ Succès!

Métriques:
  - Processed: 1
  - Created: 0
  - Updated: 1
  - Skipped: 0
  - Failed: 0
  - Conflicts: 0

Sync Batch ID: 550e8400-e29b-41d4-a716-446655440000
```
→ **Parfait !** La réservation existait déjà et a été mise à jour.

#### **Résultat D : Erreur** ❌
```
✗ Erreur!

Message: 401 Unauthorized
```
→ **Problème d'authentification.** Vérifiez que `AIRBNB_API_SECRET` dans `.env` correspond à la clé dans le script.

### Étape 4 : Vérifier dans la Base de Données

```sql
-- Voir la dernière réservation créée
SELECT 
  id,
  loft_id,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  source,
  airbnb_confirmation_code,
  synced_at,
  created_at
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY created_at DESC
LIMIT 1;

-- Voir le dernier log de sync
SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_created,
  reservations_updated,
  started_at,
  completed_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 1;
```

---

## 🔍 PARTIE 4 : Analyser le Conflit Détecté

Vous avez **1 conflit** dans la base de données. Analysons-le :

### Étape 1 : Voir les Détails du Conflit

```sql
SELECT 
  c.id as conflict_id,
  l.name as loft_name,
  r1.guest_name as reservation_1_guest,
  r1.check_in_date as res1_checkin,
  r1.check_out_date as res1_checkout,
  r1.status as res1_status,
  r1.source as res1_source,
  r2.guest_name as reservation_2_guest,
  r2.check_in_date as res2_checkin,
  r2.check_out_date as res2_checkout,
  r2.status as res2_status,
  r2.source as res2_source,
  c.overlap_start,
  c.overlap_end,
  c.overlap_nights,
  c.severity,
  c.status as conflict_status
FROM airbnb_conflicts c
JOIN lofts l ON c.loft_id = l.id
JOIN reservations r1 ON c.reservation_1_id = r1.id
JOIN reservations r2 ON c.reservation_2_id = r2.id
WHERE c.status = 'open';
```

### Étape 2 : Résoudre le Conflit

#### **Option A : Annuler une des réservations**

```sql
-- Annuler la réservation 1
UPDATE reservations 
SET status = 'cancelled' 
WHERE id = 'uuid-de-la-reservation-1';

-- Marquer le conflit comme résolu
UPDATE airbnb_conflicts 
SET 
  status = 'resolved',
  resolved_at = NOW(),
  resolution_notes = 'Réservation 1 annulée'
WHERE id = 'uuid-du-conflit';
```

#### **Option B : Marquer comme faux positif**

```sql
-- Si les 2 réservations sont valides (ex: même client, 2 chambres)
UPDATE airbnb_conflicts 
SET 
  status = 'false_positive',
  resolved_at = NOW(),
  resolution_notes = 'Même client, 2 chambres différentes'
WHERE id = 'uuid-du-conflit';
```

---

## 📋 Checklist Complète

### Analyse
- [ ] Script `analyze_airbnb_data.sql` exécuté
- [ ] Loft avec mapping identifié
- [ ] 2 réservations Airbnb analysées
- [ ] 12 réservations en staging analysées
- [ ] 4 logs de sync analysés
- [ ] 1 conflit analysé

### Configuration
- [ ] Listing IDs Airbnb identifiés
- [ ] Mapping configuré pour au moins 1 loft
- [ ] Mapping vérifié dans la base de données

### Test
- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Script de test exécuté (`.\test-airbnb-sync.ps1`)
- [ ] Résultat du test vérifié
- [ ] Réservation créée dans la base de données
- [ ] Log de sync créé

### Résolution
- [ ] Conflit analysé
- [ ] Conflit résolu ou marqué comme faux positif

---

## 🆘 Troubleshooting

### Problème : "Listing ID not mapped"
**Solution :** Configurer le mapping (PARTIE 2)

### Problème : "401 Unauthorized"
**Solution :** Vérifier `AIRBNB_API_SECRET` dans `.env`

### Problème : "Table does not exist"
**Solution :** Réappliquer les migrations SQL

### Problème : "Duplicate key value"
**Solution :** Le listing_id est déjà utilisé par un autre loft

---

## 📚 Fichiers Utiles

| Fichier | Description |
|---------|-------------|
| `analyze_airbnb_data.sql` | Analyse complète des données |
| `configure_airbnb_mapping.sql` | Configuration du mapping |
| `test-airbnb-sync.ps1` | Test de l'endpoint API |
| `check_airbnb_tables.sql` | Vérification des tables |

---

## ✅ Prochaine Étape

Une fois que vous avez :
- ✅ Analysé les données existantes
- ✅ Configuré le mapping pour vos lofts
- ✅ Testé l'API avec succès

Vous pouvez passer à la **modification du script Python** pour envoyer les vraies données Airbnb !

Voir : `AIRBNB_INTEGRATION_NEXT_STEPS.md` (ÉTAPE 5)
