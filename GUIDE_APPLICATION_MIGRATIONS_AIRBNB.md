# 🚀 Guide d'Application des Migrations Airbnb

## 📋 Contexte

Les migrations SQL pour l'intégration Airbnb ont été créées mais **n'ont pas été appliquées** dans Supabase DEV. C'est pourquoi vous obtenez l'erreur :

```
ERROR: column "airbnb_confirmation_code" does not exist
```

## ✅ Solution : Appliquer les Migrations Manuellement

### Étape 1 : Ouvrir Supabase SQL Editor

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet **DEV** : `zlpzuyctjhajdwlxzdzk`
3. Cliquer sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter le Script Consolidé

1. Ouvrir le fichier : `supabase/migrations/APPLY_ALL_AIRBNB_MIGRATIONS.sql`
2. **Copier tout le contenu** du fichier
3. **Coller** dans le SQL Editor de Supabase
4. Cliquer sur **Run** (ou `Ctrl+Enter`)

### Étape 3 : Vérifier les Résultats

Le script affichera des messages de progression :

```
🔧 Migration 005: Extension de la table reservations...
✅ Migration 005 terminée
🔧 Migration 006: Création de la table de staging...
✅ Migration 006 terminée
...
✅ TOUTES LES MIGRATIONS AIRBNB ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS
```

Vous verrez également :
- ✅ Les 3 colonnes ajoutées à `reservations` : `source`, `airbnb_confirmation_code`, `synced_at`
- ✅ Les 3 nouvelles tables créées : `airbnb_reservations_staging`, `airbnb_sync_logs`, `airbnb_conflicts`
- ✅ La colonne `airbnb_listing_id` ajoutée à `lofts`

---

## 🔄 Étape 4 : Relancer la Synchronisation

Une fois les migrations appliquées, relancez la synchronisation :

### Option A : Utiliser le Script de Transformation (RECOMMANDÉ)

```powershell
cd C:\Users\SERVICE-INFO\IA\algerie-loft\scripts
python transform-and-send-airbnb-data.py
```

Ce script :
- ✅ Lit `d:\Airbnb_transfer_v2\output\reservations_airbnb.json`
- ✅ Transforme le format scraper → format API
- ✅ Envoie les données par batches de 100
- ✅ Gère les retry automatiques

### Option B : Utiliser le Script d'Envoi Direct

```powershell
cd C:\Users\SERVICE-INFO\IA\algerie-loft\scripts
python send-airbnb-data-to-api.py d:\Airbnb_transfer_v2\output\reservations_airbnb.json
```

⚠️ **Note** : Ce script nécessite que les données soient déjà au format API attendu.

---

## 📊 Étape 5 : Vérifier les Données Importées

### Dans Supabase SQL Editor

1. Ouvrir le fichier : `supabase/migrations/verify_airbnb_import.sql`
2. Copier tout le contenu
3. Coller dans le SQL Editor
4. Cliquer sur **Run**

Vous obtiendrez un rapport complet avec :

- 📊 **Statistiques globales** : Total réservations, réservations Airbnb vs manuelles
- 📋 **Répartition par statut** : confirmed, pending, cancelled, etc.
- 📅 **Réservations par mois** : Derniers 12 mois
- 📧 **Coordonnées voyageur** : Complétude des emails, téléphones, nationalités
- 🏠 **Mapping lofts** : Combien de lofts ont un `airbnb_listing_id`
- 📝 **Logs de sync** : Dernières synchronisations
- ⚠️ **Conflits** : Chevauchements de dates détectés
- 🏆 **Top 10 lofts** : Par nombre de réservations
- 💰 **Montants totaux** : Par devise
- 📅 **Réservations à venir** : 7 jours, 30 jours

---

## 🗺️ Étape 6 : Mapper les Annonces Airbnb aux Lofts

### Problème Actuel

Les 6177 réservations Airbnb proviennent de **102 annonces différentes** (listing_id), mais elles ne sont **pas encore mappées** aux lofts de votre base de données.

### Solution : Créer le Mapping

Vous devez remplir la colonne `airbnb_listing_id` dans la table `lofts` :

```sql
-- Exemple de mapping manuel
UPDATE lofts 
SET airbnb_listing_id = '27940108' 
WHERE name = 'Loft Alger Centre';

UPDATE lofts 
SET airbnb_listing_id = '40739075' 
WHERE name = 'Appartement Hydra';

-- ... etc pour les 102 annonces
```

### Comment Trouver les Listing IDs ?

1. **Exécuter cette requête** dans Supabase SQL Editor :

```sql
-- Lister tous les listing_id Airbnb avec le nombre de réservations
SELECT 
  listing_id,
  COUNT(*) as nb_reservations,
  MIN(check_in_date) as premiere_reservation,
  MAX(check_out_date) as derniere_reservation
FROM airbnb_reservations_staging
GROUP BY listing_id
ORDER BY COUNT(*) DESC;
```

2. **Identifier les annonces** :
   - Aller sur Airbnb.com
   - Chercher vos annonces
   - L'URL contient le listing_id : `https://www.airbnb.com/rooms/27940108`

3. **Créer le mapping** :
   - Créer un fichier Excel avec 2 colonnes : `listing_id` | `loft_name`
   - Remplir manuellement en comparant les noms
   - Générer les requêtes SQL UPDATE

---

## 🎯 Résumé des Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/APPLY_ALL_AIRBNB_MIGRATIONS.sql` | **Script consolidé** à exécuter dans Supabase |
| `supabase/migrations/verify_airbnb_import.sql` | Script de vérification des données |
| `scripts/transform-and-send-airbnb-data.py` | Script de transformation et envoi |
| `scripts/send-airbnb-data-to-api.py` | Script d'envoi direct |
| `d:\Airbnb_transfer_v2\output\reservations_airbnb.json` | Données scrapées (6177 réservations) |

---

## 🔍 Vérification Rapide

### Vérifier que les colonnes existent

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('source', 'airbnb_confirmation_code', 'synced_at')
ORDER BY column_name;
```

**Résultat attendu :**

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| airbnb_confirmation_code | character varying | YES |
| source | character varying | YES |
| synced_at | timestamp without time zone | YES |

### Vérifier que les tables existent

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'airbnb_reservations_staging',
  'airbnb_sync_logs',
  'airbnb_conflicts'
)
ORDER BY table_name;
```

**Résultat attendu :**

| table_name |
|------------|
| airbnb_conflicts |
| airbnb_reservations_staging |
| airbnb_sync_logs |

---

## ⚠️ Erreurs Possibles

### Erreur : "relation already exists"

**Cause** : Les tables existent déjà (migrations déjà appliquées partiellement)

**Solution** : Le script utilise `IF NOT EXISTS`, donc il ne devrait pas y avoir d'erreur. Si l'erreur persiste, vérifier manuellement :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'airbnb%';
```

### Erreur : "column already exists"

**Cause** : Les colonnes existent déjà

**Solution** : Le script utilise `ADD COLUMN IF NOT EXISTS`, donc pas de problème. Vérifier avec :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
  AND column_name LIKE '%airbnb%';
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs** dans Supabase SQL Editor
2. **Copier le message d'erreur complet**
3. **Vérifier que vous êtes sur l'environnement DEV** (`zlpzuyctjhajdwlxzdzk`)
4. **Ne jamais exécuter sur PROD** (`mhngbluefyucoesgcjoy`)

---

## ✅ Checklist Finale

- [ ] Migrations appliquées dans Supabase DEV
- [ ] Colonnes `source`, `airbnb_confirmation_code`, `synced_at` existent dans `reservations`
- [ ] Tables `airbnb_reservations_staging`, `airbnb_sync_logs`, `airbnb_conflicts` créées
- [ ] Colonne `airbnb_listing_id` existe dans `lofts`
- [ ] Synchronisation relancée avec succès
- [ ] Données vérifiées avec `verify_airbnb_import.sql`
- [ ] Mapping des 102 annonces Airbnb en cours

---

## 🎉 Prochaines Étapes

Une fois les migrations appliquées et les données synchronisées :

1. **Mapper les 102 annonces Airbnb** aux lofts
2. **Configurer le monitoring** des conflits de réservation
3. **Automatiser la synchronisation** (cron job quotidien)
4. **Créer un dashboard** pour visualiser les statistiques Airbnb

---

**Date de création** : 2026-05-28  
**Version** : 1.0.0  
**Environnement** : DEV uniquement (`zlpzuyctjhajdwlxzdzk`)
