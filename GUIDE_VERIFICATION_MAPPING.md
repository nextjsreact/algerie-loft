# 🔍 GUIDE COMPLET DE VÉRIFICATION DU MAPPING AIRBNB

Ce guide vous montre **3 méthodes** pour vérifier que le mapping Airbnb fonctionne correctement.

---

## 📋 TABLE DES MATIÈRES

1. [Méthode 1 : Vérification SQL (Recommandée)](#méthode-1--vérification-sql-recommandée)
2. [Méthode 2 : Vérification via l'interface Supabase](#méthode-2--vérification-via-linterface-supabase)
3. [Méthode 3 : Vérification via votre application](#méthode-3--vérification-via-votre-application)
4. [Méthode 4 : Vérification via script Python](#méthode-4--vérification-via-script-python)
5. [Que vérifier exactement ?](#que-vérifier-exactement-)
6. [Problèmes courants et solutions](#problèmes-courants-et-solutions)

---

## Méthode 1 : Vérification SQL (Recommandée)

### ✅ Avantages
- Rapide et complet
- Affiche toutes les statistiques importantes
- Détecte les problèmes automatiquement

### 📝 Étapes

#### 1. Ouvrir Supabase SQL Editor

1. Aller sur https://supabase.com
2. Se connecter à votre projet
3. Cliquer sur **"SQL Editor"** dans le menu de gauche
4. Cliquer sur **"New query"**

#### 2. Exécuter le script de vérification

Copier-coller le contenu du fichier :
```
supabase/migrations/VERIFICATION_COMPLETE_MAPPING.sql
```

Ou exécuter directement :

```sql
-- Vérification rapide
SELECT 
  'Lofts mappés' as metric,
  COUNT(*) as value
FROM lofts
WHERE airbnb_listing_id IS NOT NULL;

SELECT 
  'Réservations avec loft' as metric,
  COUNT(*) as value
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NOT NULL;

SELECT 
  'Réservations SANS loft' as metric,
  COUNT(*) as value
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NULL;
```

#### 3. Interpréter les résultats

✅ **Résultats attendus :**
- **58 lofts mappés** (ou le nombre de vos lofts)
- **3,786 réservations avec loft** (100%)
- **0 réservations sans loft**

❌ **Si vous voyez des problèmes :**
- Des réservations sans loft → Voir [Problèmes courants](#problèmes-courants-et-solutions)
- Des lofts sans mapping → Relancer `auto-map-airbnb-listings.py`

---

## Méthode 2 : Vérification via l'interface Supabase

### 📊 Vérifier les lofts mappés

1. Aller sur https://supabase.com
2. Ouvrir votre projet
3. Cliquer sur **"Table Editor"**
4. Sélectionner la table **"lofts"**
5. Vérifier la colonne **"airbnb_listing_id"**

✅ **Ce que vous devez voir :**
- Chaque loft a un `airbnb_listing_id` (pas NULL)
- Les listing IDs sont des nombres longs (ex: 1626066840513726227)

### 📋 Vérifier les réservations

1. Dans **"Table Editor"**, sélectionner la table **"reservations"**
2. Filtrer par `source = 'airbnb_scraper'`
3. Vérifier la colonne **"loft_id"**

✅ **Ce que vous devez voir :**
- Toutes les réservations Airbnb ont un `loft_id` (pas NULL)
- Le `loft_id` correspond à un loft existant

### 🔍 Vérifier un loft spécifique

1. Dans la table **"lofts"**, cliquer sur un loft
2. Noter son `airbnb_listing_id`
3. Aller dans la table **"reservations"**
4. Filtrer par `loft_id = [l'ID du loft]` et `source = 'airbnb_scraper'`
5. Vous devriez voir toutes les réservations Airbnb pour ce loft

---

## Méthode 3 : Vérification via votre application

### 🌐 Vérifier dans l'interface web

#### 1. Page des Lofts

1. Ouvrir votre application : http://localhost:3000
2. Se connecter
3. Aller sur la page **"Lofts"**
4. Cliquer sur un loft
5. Vérifier qu'il y a des réservations Airbnb affichées

#### 2. Page des Réservations

1. Aller sur la page **"Réservations"**
2. Filtrer par source **"Airbnb"**
3. Vérifier que chaque réservation a un loft associé
4. Cliquer sur une réservation pour voir les détails

#### 3. Calendrier

1. Aller sur le **"Calendrier"**
2. Vérifier que les réservations Airbnb apparaissent
3. Vérifier qu'elles sont bien associées aux bons lofts

### 📊 Vérifier les statistiques

1. Aller sur le **"Dashboard"**
2. Vérifier les statistiques Airbnb :
   - Nombre de réservations
   - Revenu total
   - Taux d'occupation

---

## Méthode 4 : Vérification via script Python

### 🐍 Exécuter le script de vérification

```bash
cd c:\Users\SERVICE-INFO\IA\algerie-loft
python scripts\verify-airbnb-mapping-results.py
```

### 📊 Résultats attendus

```
================================================================================
VÉRIFICATION DES RÉSULTATS DU MAPPING AIRBNB
================================================================================

🏠 LOFTS AVEC MAPPING AIRBNB
--------------------------------------------------------------------------------
✅ 58 lofts mappés

📊 RÉSERVATIONS DANS LA TABLE PRINCIPALE
--------------------------------------------------------------------------------
✅ Avec loft_id:  3,786 (100.0%)
❌ Sans loft_id:  0
📊 Total:         3,786

📈 TOP 10 LOFTS PAR NOMBRE DE RÉSERVATIONS
--------------------------------------------------------------------------------
 1. Star loft                                 162 réservations
 2. Golden loft                                91 réservations
 3. Luna Loft                                  64 réservations
 ...

================================================================================
📊 RÉSUMÉ FINAL
================================================================================
✅ 3,786 réservations Airbnb mappées aux lofts
✅ 58 lofts avec mapping Airbnb
✅ Taux de mapping: 100.0%
================================================================================
```

---

## Que vérifier exactement ?

### ✅ Checklist de vérification

- [ ] **Tous les lofts ont un `airbnb_listing_id`**
  - Vérifier dans la table `lofts`
  - Colonne `airbnb_listing_id` ne doit pas être NULL

- [ ] **Toutes les réservations Airbnb ont un `loft_id`**
  - Vérifier dans la table `reservations`
  - Filtrer par `source = 'airbnb_scraper'`
  - Colonne `loft_id` ne doit pas être NULL

- [ ] **Pas de doublons**
  - Vérifier qu'il n'y a pas de réservations en double
  - Utiliser le script SQL de vérification

- [ ] **Pas de conflits de dates**
  - Vérifier qu'il n'y a pas 2 réservations qui se chevauchent pour le même loft
  - Utiliser le script SQL de vérification

- [ ] **Les données sont cohérentes**
  - Les noms de voyageurs sont corrects
  - Les dates sont logiques (check_in < check_out)
  - Les montants sont positifs

- [ ] **Les réservations futures sont visibles**
  - Vérifier dans le calendrier
  - Vérifier dans la liste des réservations

---

## Problèmes courants et solutions

### ❌ Problème 1 : Réservations sans loft_id

**Symptôme :**
```sql
SELECT COUNT(*) FROM reservations 
WHERE source = 'airbnb_scraper' AND loft_id IS NULL;
-- Résultat > 0
```

**Solution :**
```bash
# Relancer le mapping
python scripts\resync-airbnb-after-mapping.py
```

---

### ❌ Problème 2 : Lofts sans airbnb_listing_id

**Symptôme :**
```sql
SELECT COUNT(*) FROM lofts WHERE airbnb_listing_id IS NULL;
-- Résultat > 0
```

**Solution :**
```bash
# Relancer le mapping automatique
python scripts\auto-map-airbnb-listings.py
```

---

### ❌ Problème 3 : Doublons de réservations

**Symptôme :**
```sql
SELECT airbnb_confirmation_code, COUNT(*) 
FROM reservations 
WHERE source = 'airbnb_scraper'
GROUP BY airbnb_confirmation_code 
HAVING COUNT(*) > 1;
-- Résultat > 0 lignes
```

**Solution :**
```sql
-- Supprimer les doublons (garder le plus récent)
DELETE FROM reservations r1
WHERE r1.source = 'airbnb_scraper'
  AND EXISTS (
    SELECT 1 FROM reservations r2
    WHERE r2.airbnb_confirmation_code = r1.airbnb_confirmation_code
      AND r2.source = 'airbnb_scraper'
      AND r2.created_at > r1.created_at
  );
```

---

### ❌ Problème 4 : Conflits de dates

**Symptôme :**
Le script SQL de vérification affiche des conflits de dates.

**Solution :**
1. Identifier les conflits avec le script SQL
2. Vérifier manuellement sur Airbnb
3. Corriger les dates ou annuler les réservations en double

---

### ❌ Problème 5 : Données manquantes

**Symptôme :**
Certaines réservations n'ont pas de nom de voyageur, email, etc.

**Solution :**
```bash
# Relancer la synchronisation complète
python scripts\transform-and-send-airbnb-data.py d:\Airbnb_transfer_v2\output\reservations_airbnb.json
```

---

## 🎯 Vérification rapide (1 minute)

Si vous voulez juste vérifier rapidement que tout fonctionne :

### Option 1 : SQL (30 secondes)

```sql
-- Dans Supabase SQL Editor
SELECT 
  (SELECT COUNT(*) FROM lofts WHERE airbnb_listing_id IS NOT NULL) as lofts_mappes,
  (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NOT NULL) as reservations_mappees,
  (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NULL) as reservations_sans_loft;
```

✅ **Résultat attendu :** `lofts_mappes = 58`, `reservations_mappees = 3786`, `reservations_sans_loft = 0`

### Option 2 : Python (30 secondes)

```bash
python scripts\verify-airbnb-mapping-results.py
```

✅ **Résultat attendu :** "Taux de mapping: 100.0%"

### Option 3 : Interface web (1 minute)

1. Ouvrir http://localhost:3000
2. Aller sur "Réservations"
3. Filtrer par "Airbnb"
4. Vérifier que toutes les réservations ont un loft

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. **Exécuter le diagnostic complet :**
   ```bash
   python scripts\verify-airbnb-mapping-results.py
   ```

2. **Exécuter le script SQL de vérification :**
   ```
   supabase/migrations/VERIFICATION_COMPLETE_MAPPING.sql
   ```

3. **Vérifier les logs de synchronisation :**
   ```sql
   SELECT * FROM airbnb_sync_logs ORDER BY started_at DESC LIMIT 5;
   ```

4. **Vérifier les erreurs dans staging :**
   ```sql
   SELECT * FROM airbnb_reservations_staging 
   WHERE mapping_status = 'failed' 
   LIMIT 10;
   ```

---

## ✅ Checklist finale

Avant de considérer que le mapping est terminé, vérifiez :

- [ ] Tous les lofts ont un `airbnb_listing_id`
- [ ] Toutes les réservations Airbnb ont un `loft_id`
- [ ] Pas de doublons de réservations
- [ ] Pas de conflits de dates
- [ ] Les réservations apparaissent dans l'application
- [ ] Les statistiques sont correctes
- [ ] Le calendrier affiche les réservations Airbnb

---

**Dernière mise à jour :** 2026-05-29  
**Auteur :** Kiro AI Assistant
