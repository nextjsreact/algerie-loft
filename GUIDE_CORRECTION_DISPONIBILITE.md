# 🚀 Guide Rapide: Correction Disponibilité Airbnb

## ❌ Problème
Les réservations Airbnb ne bloquent pas la disponibilité des lofts → **risque de double réservation**.

## ✅ Solution
Modifier la vérification de disponibilité pour inclure **TOUTES les réservations non-annulées** (pas seulement `confirmed` et `pending`).

---

## 📋 Étapes à suivre

### 1️⃣ Diagnostic (optionnel)
Voir l'ampleur du problème :

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: DIAGNOSTIC_DISPONIBILITE_AIRBNB.sql
```

### 2️⃣ Appliquer la correction SQL ⚠️ **OBLIGATOIRE**

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: FIX_DISPONIBILITE_AIRBNB.sql
```

**Ce que fait ce script :**
- ✅ Met à jour la fonction `check_loft_availability()`
- ✅ Exécute des tests automatiques
- ✅ Affiche les résultats

**Résultats attendus :**
```
✅ SUCCÈS: La fonction détecte correctement l'indisponibilité
✅ SUCCÈS: La fonction détecte correctement la disponibilité
```

### 3️⃣ Redémarrer l'application

Le code TypeScript a déjà été modifié et poussé sur GitHub.

**En développement :**
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

**En production :**
Redémarrer le service selon votre hébergement (Vercel, etc.)

### 4️⃣ Vérification finale

1. Ouvrir un loft avec des réservations Airbnb
2. Vérifier que les dates occupées sont **indisponibles**
3. Essayer de créer une réservation sur des dates occupées → devrait être **bloqué** ✅

---

## 📊 Résumé des changements

### Base de données (SQL)
- **Fonction** : `check_loft_availability()`
- **Changement** : `status IN ('confirmed', 'pending')` → `status != 'cancelled'`

### Code TypeScript
- **Fichier** : `lib/services/availability-service.ts`
- **Changements** : 2 modifications (lignes 134-141 et 379-385)
- **Logique** : Même principe que SQL

---

## ⏱️ Temps estimé
- Diagnostic : 2 minutes
- Correction SQL : 30 secondes
- Redémarrage : 1 minute
- **Total : ~4 minutes**

---

## 🆘 En cas de problème

### Les tests échouent ?
Vérifiez qu'il y a au moins une réservation Airbnb dans la base :
```sql
SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper';
```

### La disponibilité ne change pas ?
1. Vérifiez que le script SQL s'est bien exécuté (pas d'erreurs)
2. Vérifiez que le serveur a été redémarré
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Questions ?
Lisez la documentation complète : `EXPLICATION_DISPONIBILITE_AIRBNB.md`

---

**✅ Correction prête à appliquer**
**📅 Date : 2026-06-08**
