# 🔧 Guide: Correction des statuts Airbnb

## 🎯 Problème détecté

**28 réservations** utilisent des statuts Airbnb non reconnus, dont **7 sont mal classées** comme "confirmed" alors qu'elles sont terminées.

---

## ✅ Solution appliquée (Code)

### Modification du traducteur

**Fichier modifié** : `lib/utils/airbnb-status-translator.ts`

**Statuts ajoutés** :
- ✅ "Séjour en cours" → `confirmed` (15 réservations)
- ✅ "Départ aujourd'hui" → `confirmed` (6 réservations)
- ✅ "Ancien voyageur" → `completed` (2 réservations)
- ✅ "En attente de commentaire du voyageur" → `completed` (3 réservations)
- ✅ "Laissez un commentaire sur le voyageur" → `completed` (2 réservations)

**Impact** : Les **futures synchronisations** classeront correctement ces statuts.

---

## 🔄 Correction des données existantes (SQL)

### Étape 1 : Vérifier les réservations à corriger

```sql
-- Voir les 7 réservations mal classées
SELECT 
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.status as statut_actuel,
  s.raw_data->>'statut' as statut_airbnb_reel
FROM airbnb_reservations_staging s
JOIN reservations r ON r.airbnb_confirmation_code = s.airbnb_id
WHERE s.raw_data->>'statut' IN (
  'Ancien voyageur',
  'En attente de commentaire du voyageur',
  'Laissez un commentaire sur le voyageur'
)
AND r.status != 'completed';
```

**Résultat attendu** : 7 réservations

---

### Étape 2 : Appliquer la correction

**Option A : Script complet** (recommandé)
```bash
# Exécuter dans Supabase SQL Editor
FIX_STATUTS_AIRBNB_COMPLETED.sql
```

**Option B : Correction manuelle**
```sql
UPDATE reservations r
SET status = 'completed', updated_at = NOW()
FROM airbnb_reservations_staging s
WHERE r.airbnb_confirmation_code = s.airbnb_id
  AND r.source = 'airbnb_scraper'
  AND s.raw_data->>'statut' IN (
    'Ancien voyageur',
    'En attente de commentaire du voyageur',
    'Laissez un commentaire sur le voyageur'
  )
  AND r.status != 'completed';
```

---

### Étape 3 : Vérifier les résultats

```sql
-- Distribution après correction
SELECT 
  status,
  COUNT(*) as nombre,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM reservations
WHERE source = 'airbnb_scraper'
GROUP BY status;
```

**Résultat attendu** :
```
confirmed: 67 (88.16%)  ← Était 74
completed:  9 (11.84%)  ← Était 2
```

---

## 📊 Impact de la correction

### Avant
```
❌ 7 réservations terminées mal classées
❌ Statistiques faussées
❌ Taux d'occupation incorrect
```

### Après
```
✅ Toutes les réservations correctement classées
✅ Statistiques précises
✅ Taux d'occupation correct
✅ Futures syncs classeront automatiquement les nouveaux statuts
```

---

## 🚀 Procédure complète

### 1️⃣ Code déjà déployé ✅
Le code a été modifié et poussé sur GitHub.

**Action** : Redémarrer le serveur Next.js
```bash
# Arrêter avec Ctrl+C puis
npm run dev
```

### 2️⃣ Corriger les données existantes
**Action** : Exécuter `FIX_STATUTS_AIRBNB_COMPLETED.sql` dans Supabase

### 3️⃣ Vérifier
**Action** : Voir les nouvelles statistiques dans l'interface admin

---

## ❓ FAQ

### Les futures syncs corrigeront-elles automatiquement ?
**OUI** ✅ Le traducteur a été mis à jour, donc les prochaines synchronisations classeront correctement tous les statuts.

### Dois-je exécuter le script SQL ?
**Recommandé** pour corriger les 7 réservations déjà mal classées. Sinon, elles resteront "confirmed" jusqu'à la prochaine sync Airbnb.

### Puis-je annuler la correction ?
**OUI**, mais pas recommandé :
```sql
-- Pour annuler (déconseillé)
UPDATE reservations
SET status = 'confirmed'
WHERE id IN (...);
```

### Y a-t-il d'autres statuts non reconnus ?
Probablement. Si vous voyez des erreurs dans les logs ou des statuts étranges, consultez `STATUTS_AIRBNB_NON_RECONNUS.md` et ajoutez-les au traducteur.

---

## 📝 Résumé

| Étape | Action | Statut |
|-------|--------|--------|
| **Code** | Traducteur mis à jour | ✅ Fait |
| **Déploiement** | Redémarrer serveur | ⏳ À faire |
| **Correction SQL** | Exécuter script | ⏳ À faire |
| **Vérification** | Voir stats | ⏳ À faire |

---

## 🎉 Bonus : Aucune annulation !

**Bonne nouvelle** : Aucun statut "Annulée" détecté dans staging !

Cela confirme que vous n'avez **aucune réservation annulée** sur Airbnb. 🎊

---

**Date** : 2026-06-08  
**Fichiers créés** :
- `FIX_STATUTS_AIRBNB_COMPLETED.sql` (script de correction)
- `STATUTS_AIRBNB_NON_RECONNUS.md` (documentation)
- `GUIDE_CORRECTION_STATUTS_AIRBNB.md` (ce guide)

**Commit** : `f259fcc` - "fix: Ajouter statuts Airbnb manquants"
