# ✅ Correction Appliquée : Devise Originale Airbnb

## 🎯 Ce qui a été fait

### 1. Code Backend Corrigé ✅

**Fichier modifié** : `lib/services/airbnb-sync-service-optimized.ts`

La fonction `buildSmartUpdatePayload()` a été améliorée pour :
- ✅ Préserver `original_currency_code` et `original_amount` quand ils sont envoyés par le scraper
- ✅ Calculer automatiquement `currency_ratio` si manquant
- ✅ Utiliser `currency_code` comme fallback robuste si différent de DZD
- ✅ Éviter les valeurs NULL inappropriées

**Commit et push effectués** : ✅

---

## 🔧 Prochaines Étapes

### ÉTAPE 1️⃣ : Diagnostiquer la réservation de Seloua

Exécutez ce script SQL pour voir si les données originales existent dans staging :

```sql
-- Fichier : check-staging-seloua-currency.sql
```

**Interprétation des résultats** :

| Résultat | Signification | Action |
|----------|---------------|--------|
| `raw_original_currency_code` est présent (ex: "GBP") | ✅ Les données sont dans staging | Passer à l'ÉTAPE 2 |
| `raw_original_currency_code` est NULL | ⚠️ Le scraper n'a pas envoyé ces données | Vérifier le scraper (ÉTAPE 3) |
| Aucun résultat | ⚠️ Cette réservation n'est pas dans staging | Impossible de récupérer rétroactivement |

---

### ÉTAPE 2️⃣ : Corriger les réservations existantes (si données disponibles)

Si l'ÉTAPE 1 montre que les données sont dans staging, exécutez ce script :

```sql
-- Fichier : fix-missing-original-currency-from-staging.sql

-- 1. D'ABORD : Exécuter la première requête SELECT pour voir les réservations concernées
-- 2. ENSUITE : Décommenter le bloc DO $$ et l'exécuter pour corriger
-- 3. ENFIN : Décommenter la dernière requête SELECT pour vérifier
```

**⚠️ IMPORTANT** : 
- Lisez bien les commentaires dans le script
- Exécutez d'abord la requête SELECT pour voir ce qui sera corrigé
- Décommentez le bloc DO $$ seulement après vérification

**Résultat attendu** :
```
Correction terminée : X réservation(s) corrigée(s)
```

---

### ÉTAPE 3️⃣ : Vérifier le scraper Python

Si les données ne sont pas dans staging, vérifier que le scraper envoie bien :

```python
# Le payload devrait contenir :
{
  "id": "HM...",
  "devise": "DZD",  # Après conversion
  "montant_total": 13232.70,  # Après conversion
  "original_currency_code": "GBP",  # ← Avant conversion
  "original_amount": 314.28,  # ← Avant conversion
  "currency_ratio": 42.15  # ← Taux de conversion
}
```

**Points à vérifier** :
- [ ] Le scraper extrait bien la devise originale depuis Airbnb
- [ ] Le scraper calcule bien `original_amount` AVANT conversion
- [ ] Le scraper envoie ces champs dans le payload API
- [ ] Les champs ne sont pas `None` ou vides

---

### ÉTAPE 4️⃣ : Tester avec une nouvelle synchronisation

Une fois le code corrigé déployé :

1. Déclencher une nouvelle synchronisation Airbnb (manuelle ou automatique)
2. Vérifier qu'une nouvelle réservation avec devise étrangère a bien :
   - `original_currency_code` rempli
   - `original_amount` rempli
   - `currency_ratio` calculé

**Requête SQL de vérification** :
```sql
SELECT 
  id,
  guest_name,
  airbnb_confirmation_code,
  total_amount,
  currency_code,
  original_currency_code,
  original_amount,
  currency_ratio,
  synced_at
FROM reservations
WHERE source = 'airbnb_scraper'
  AND synced_at > NOW() - INTERVAL '1 hour'
ORDER BY synced_at DESC;
```

---

### ÉTAPE 5️⃣ : Vérifier l'affichage frontend

Après correction des données, vérifier que :

1. **Page détail réservation** (`/[locale]/reservations/[id]/page.tsx`)
   - [ ] Affiche le montant en devise originale (ex: "314,28 GBP")
   - [ ] Affiche la conversion en DZD (ex: "13 232,70 DZD")
   - [ ] Affiche le taux de change (ex: "1 GBP = 42,15 DZD")

2. **Dialog d'édition** (`components/reservations/reservation-edit-dialog.tsx`)
   - [ ] Section "Devise" visible
   - [ ] Info box bleue "Prix origine Airbnb" affichée
   - [ ] Montants affichés en devise originale

3. **Liste des réservations**
   - [ ] Badge "📱 Airbnb" visible
   - [ ] Montant affiché correctement

---

## 📊 Monitoring

### Requête de surveillance

Pour surveiller les réservations Airbnb et leurs devises :

```sql
-- Voir toutes les réservations Airbnb avec ou sans devise originale
SELECT 
  COUNT(*) FILTER (WHERE original_currency_code IS NULL) as sans_devise_originale,
  COUNT(*) FILTER (WHERE original_currency_code IS NOT NULL) as avec_devise_originale,
  COUNT(*) as total
FROM reservations
WHERE source = 'airbnb_scraper';

-- Détail par devise
SELECT 
  original_currency_code,
  COUNT(*) as count,
  ROUND(AVG(currency_ratio), 2) as avg_ratio
FROM reservations
WHERE source = 'airbnb_scraper'
  AND original_currency_code IS NOT NULL
GROUP BY original_currency_code
ORDER BY count DESC;
```

---

## 🆘 En cas de problème

### Problème 1 : Les données ne sont pas dans staging
**Cause** : Le scraper n'a pas envoyé les données à l'origine  
**Solution** : Corriger le scraper et refaire une synchronisation complète

### Problème 2 : Le script de correction ne trouve rien
**Cause** : Toutes les réservations ont déjà `original_currency_code` rempli  
**Solution** : RAS, tout est bon !

### Problème 3 : L'affichage frontend ne change pas après correction
**Cause** : Cache ou rechargement nécessaire  
**Solution** : 
1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Redémarrer le serveur Next.js
3. Vérifier que les données sont bien en base avec SELECT

### Problème 4 : Nouvelles synchronisations ont encore le problème
**Cause** : Le scraper envoie toujours des valeurs NULL  
**Solution** : Déboguer le scraper Python côté extraction des données

---

## 📝 Checklist Complète

- [x] Code backend corrigé
- [x] Commit et push effectués
- [ ] Script SQL de diagnostic exécuté (ÉTAPE 1)
- [ ] Script de correction exécuté si nécessaire (ÉTAPE 2)
- [ ] Scraper vérifié si besoin (ÉTAPE 3)
- [ ] Nouvelle sync testée (ÉTAPE 4)
- [ ] Affichage frontend vérifié (ÉTAPE 5)

---

## 🎓 Comprendre le Problème

**Flux normal** :
```
Airbnb (314.28 GBP) 
  → Scraper Python (conversion: 314.28 × 42.15 = 13,232.70 DZD)
  → API Next.js (sauvegarde: original=GBP/314.28, final=DZD/13,232.70)
  → Base de données (tous les champs remplis)
  → Frontend (affiche les 2 montants)
```

**Flux bugué (avant correction)** :
```
Airbnb (314.28 GBP)
  → Scraper Python (envoie original_currency_code=NULL ❌)
  → API Next.js (logique fallback ne se déclenche pas car currency_code=DZD)
  → Base de données (original_currency_code=NULL, original_amount=NULL)
  → Frontend (affiche seulement DZD)
```

**Flux corrigé** :
```
Airbnb (314.28 GBP)
  → Scraper Python (envoie original_currency_code=NULL mais currency_code='DZD')
  → API Next.js (logique améliorée : tente de récupérer depuis staging ou calcule)
  → Base de données (champs remplis autant que possible)
  → Frontend (affiche les montants disponibles)
```

---

**Date** : 8 juin 2026  
**Auteur** : Kiro AI  
**Status** : ✅ Code corrigé, ⏳ En attente des tests utilisateur
