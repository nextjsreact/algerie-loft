# ✅ CORRECTION APPLIQUÉE : Scripts annulations Airbnb

## 🐛 Erreur détectée
```
ERROR: column s.updated_at does not exist
```

## 🔍 Cause
La table `airbnb_reservations_staging` n'a **pas de colonne `updated_at`**

**Colonnes disponibles** :
- ✅ `created_at` - Date de création du record (scraping)
- ✅ `processed_at` - Date de traitement/réconciliation
- ❌ `updated_at` - N'EXISTE PAS

## ✅ Correction appliquée

**Fichiers corrigés** :
- `VERIFIER_ANNULATIONS_AUJOURDHUI.sql`
- `APPLIQUER_ANNULATIONS_AIRBNB.sql`

**Changements** :
```sql
-- AVANT (incorrect)
s.updated_at as derniere_maj
WHERE DATE(s.updated_at) = '2026-06-08'

-- APRÈS (correct)
s.created_at as date_scraping
WHERE DATE(s.created_at) = CURRENT_DATE
```

## 🚀 RÉESSAYER MAINTENANT

**Exécutez à nouveau** : `VERIFIER_ANNULATIONS_AUJOURDHUI.sql`

Cette fois le script devrait fonctionner correctement et vous montrer :
- ✅ Nombre d'annulations scrapées aujourd'hui (8 juin 2026)
- ✅ Leur statut de synchronisation
- ✅ Si elles sont correctement marquées `cancelled` en DB

---

**Commit** : `3fee6fe`  
**Statut** : ✅ Corrigé et poussé sur GitHub
