# 🚨 ACTION IMMÉDIATE REQUISE

**Date** : 2026-05-28 22:00  
**Priorité** : CRITIQUE  
**Temps estimé** : 10 minutes

---

## ❌ PROBLÈME ACTUEL

Vous obtenez cette erreur lors de la synchronisation Airbnb :

```
SQL Error [42703]: ERROR: column "airbnb_confirmation_code" does not exist
Position: 12
```

**Cause** : Les migrations SQL n'ont pas été appliquées dans Supabase DEV.

---

## ✅ SOLUTION EN 3 ÉTAPES

### Étape 1 : Ouvrir Supabase SQL Editor (2 min)

1. Aller sur : https://supabase.com/dashboard
2. Sélectionner le projet **DEV** : `zlpzuyctjhajdwlxzdzk`
3. Cliquer sur **SQL Editor** dans le menu de gauche

---

### Étape 2 : Exécuter le Script de Migration (5 min)

1. **Ouvrir le fichier** dans VS Code :
   ```
   c:\Users\SERVICE-INFO\IA\algerie-loft\supabase\migrations\APPLY_ALL_AIRBNB_MIGRATIONS.sql
   ```

2. **Copier TOUT le contenu** du fichier (`Ctrl+A` puis `Ctrl+C`)

3. **Coller** dans le SQL Editor de Supabase (`Ctrl+V`)

4. **Cliquer sur "Run"** (ou `Ctrl+Enter`)

5. **Attendre** que le script se termine (environ 30 secondes)

6. **Vérifier** que vous voyez ces messages :
   ```
   ✅ Migration 005 terminée
   ✅ Migration 006 terminée
   ✅ Migration 007 terminée
   ✅ Migration 008 terminée
   ✅ Migration 009 terminée
   ✅ TOUTES LES MIGRATIONS AIRBNB ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS
   ```

---

### Étape 3 : Relancer la Synchronisation (3 min)

1. **Ouvrir PowerShell** dans le dossier scripts :
   ```powershell
   cd C:\Users\SERVICE-INFO\IA\algerie-loft\scripts
   ```

2. **Exécuter le script de transformation** :
   ```powershell
   python transform-and-send-airbnb-data.py
   ```

3. **Attendre** que le script se termine (40-50 minutes pour 6177 réservations)

4. **Vérifier** qu'il n'y a plus d'erreurs SQL

---

## 📊 RÉSULTAT ATTENDU

Après avoir appliqué les migrations, vous devriez voir :

### Dans Supabase (Table `reservations`)

✅ 3 nouvelles colonnes :
- `source` (VARCHAR) - Source de la réservation (manual, airbnb, etc.)
- `airbnb_confirmation_code` (VARCHAR) - Code de confirmation Airbnb
- `synced_at` (TIMESTAMP) - Date de dernière synchronisation

### Dans Supabase (Nouvelles tables)

✅ 3 nouvelles tables créées :
- `airbnb_reservations_staging` - Table de staging pour validation
- `airbnb_sync_logs` - Logs de synchronisation
- `airbnb_conflicts` - Conflits de réservation détectés

### Dans Supabase (Table `lofts`)

✅ 1 nouvelle colonne :
- `airbnb_listing_id` (VARCHAR) - ID de l'annonce Airbnb

---

## 🔍 VÉRIFICATION RAPIDE

Pour vérifier que les migrations ont été appliquées, exécutez cette requête dans Supabase SQL Editor :

```sql
-- Vérifier les colonnes dans reservations
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at')
ORDER BY column_name;

-- Vérifier les nouvelles tables
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'airbnb_reservations_staging',
  'airbnb_sync_logs',
  'airbnb_conflicts'
)
ORDER BY table_name;
```

**Résultat attendu** : 3 colonnes + 3 tables

---

## ⚠️ IMPORTANT

- ✅ **Environnement** : DEV uniquement (`zlpzuyctjhajdwlxzdzk`)
- ❌ **NE PAS exécuter sur PROD** (`mhngbluefyucoesgcjoy`)
- ✅ **Sauvegarde** : Pas nécessaire (environnement DEV)
- ✅ **Réversible** : Oui (DROP TABLE si besoin)

---

## 📞 EN CAS DE PROBLÈME

### Erreur : "relation already exists"

**Solution** : Les tables existent déjà. Vérifier avec :
```sql
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'airbnb%';
```

### Erreur : "column already exists"

**Solution** : Les colonnes existent déjà. Vérifier avec :
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reservations' AND column_name LIKE '%airbnb%';
```

### Erreur : "permission denied"

**Solution** : Vérifier que vous êtes connecté avec le bon compte Supabase (projet DEV).

---

## 📝 APRÈS LA MIGRATION

Une fois les migrations appliquées et la synchronisation terminée :

1. **Vérifier les données** avec :
   ```
   supabase/migrations/verify_airbnb_import.sql
   ```

2. **Mapper les 102 annonces Airbnb** aux lofts avec :
   ```
   supabase/migrations/list_airbnb_listings_for_mapping.sql
   ```

3. **Consulter le guide complet** :
   ```
   GUIDE_APPLICATION_MIGRATIONS_AIRBNB.md
   ```

---

## ✅ CHECKLIST

- [ ] Supabase SQL Editor ouvert (projet DEV)
- [ ] Script `APPLY_ALL_AIRBNB_MIGRATIONS.sql` copié-collé
- [ ] Script exécuté avec succès (messages ✅ visibles)
- [ ] Colonnes et tables vérifiées (requête de vérification)
- [ ] Synchronisation relancée (`transform-and-send-airbnb-data.py`)
- [ ] Aucune erreur SQL dans les logs
- [ ] Données vérifiées avec `verify_airbnb_import.sql`

---

## 🎯 OBJECTIF

**Avant** : ❌ Erreur SQL "column does not exist"  
**Après** : ✅ 6177 réservations Airbnb synchronisées avec succès

---

**Temps total estimé** : 10 minutes + 40-50 minutes de synchronisation

**Difficulté** : Facile (copier-coller)

**Impact** : Critique (bloque toute la synchronisation Airbnb)

---

## 🚀 COMMENCER MAINTENANT

👉 **Étape 1** : Ouvrir https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk/sql

👉 **Étape 2** : Ouvrir `supabase/migrations/APPLY_ALL_AIRBNB_MIGRATIONS.sql`

👉 **Étape 3** : Copier-coller et exécuter

---

**Bonne chance ! 🍀**
