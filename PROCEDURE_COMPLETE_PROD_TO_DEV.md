# 🔄 Procédure Complète : Nettoyer PROD → Backup → Restaurer DEV

## 📋 Vue d'Ensemble

Cette procédure en 3 étapes vous permet de :
1. ✅ Nettoyer les données de test en production
2. ✅ Créer un backup propre de la production
3. ✅ Restaurer le backup dans l'environnement de développement

**Durée totale estimée :** 15-20 minutes

---

## 🎯 ÉTAPE 1 : Nettoyer la Production (5 min)

### 1.1 Ouvrir Supabase Production

1. Aller sur https://supabase.com/dashboard
2. Sélectionner le projet **PRODUCTION** : `mhngbluefyucoesgcjoy`
3. Aller dans **SQL Editor**
4. Cliquer sur **"New Query"**

### 1.2 Vérifier les Données à Supprimer

Copier-coller et exécuter **ÉTAPE 1** du fichier :
```
test-data/cleanup_test_data_production.sql
```

Cela affichera :
- ✅ Nombre de réservations de test
- ✅ Nombre d'entrées staging de test
- ✅ Nombre de conflits de test
- ✅ Nombre de logs de test

**Vérifiez que seules les données de test sont listées !**

### 1.3 Supprimer les Données de Test

Exécuter **ÉTAPE 2** du fichier `cleanup_test_data_production.sql` **commande par commande** :

```sql
-- 1. Supprimer les conflits (pas de FK)
DELETE FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '3 hours';

-- 2. Supprimer les logs (pas de FK)
DELETE FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';

-- 3. Supprimer le staging (a des FK vers reservations)
DELETE FROM airbnb_reservations_staging
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3'
OR airbnb_id LIKE 'HMTEST%';

-- 4. Supprimer les réservations (EN DERNIER)
DELETE FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003')
OR guest_name IN ('Ahmed Benali', 'Sarah Martin', 'John Doe');
```

### 1.4 Vérifier le Nettoyage

Exécuter **ÉTAPE 3** du fichier `cleanup_test_data_production.sql` :

```sql
-- Vérification finale
SELECT 
    '=== VÉRIFICATION FINALE ===' as section,
    (SELECT COUNT(*) FROM reservations WHERE airbnb_confirmation_code LIKE 'HMTEST%') as reservations_test,
    (SELECT COUNT(*) FROM airbnb_reservations_staging WHERE airbnb_id LIKE 'HMTEST%') as staging_test,
    (SELECT COUNT(*) FROM airbnb_conflicts WHERE created_at > NOW() - INTERVAL '3 hours') as conflits_recents,
    (SELECT COUNT(*) FROM airbnb_sync_logs WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3') as logs_test;
```

**Résultat attendu :** Tous les compteurs doivent être à **0**

---

## 🎯 ÉTAPE 2 : Créer un Backup de Production (5 min)

### 2.1 Créer le Backup

1. Rester dans le projet **PRODUCTION** : `mhngbluefyucoesgcjoy`
2. Aller dans **Database** → **Backups**
3. Cliquer sur **"Create backup"** ou **"Backup now"**
4. Attendre la fin du backup (2-5 minutes selon la taille)
5. Le backup apparaîtra dans la liste avec un timestamp

### 2.2 Télécharger le Backup

1. Dans la liste des backups, trouver le backup que vous venez de créer
2. Cliquer sur **"..."** (trois points) → **"Download"**
3. Le fichier sera téléchargé (format `.sql` ou `.dump`)
4. Sauvegarder le fichier dans un endroit sûr :
   ```
   C:\Users\SERVICE-INFO\IA\algerie-loft\backups\production_backup_YYYYMMDD.sql
   ```

**Note :** Gardez ce backup précieusement, c'est votre copie de sécurité !

---

## 🎯 ÉTAPE 3 : Restaurer dans DEV (5 min)

### 3.1 Restaurer le Backup

1. **Changer de projet** : Sélectionner **DEV** : `wtcbyjdwjrrqyzpvjfze`
2. Aller dans **Database** → **Backups**
3. Cliquer sur **"Restore"** ou **"Upload backup"**
4. Sélectionner le fichier téléchargé à l'étape 2.2
5. ⚠️ **ATTENTION** : Un message d'avertissement apparaîtra :
   ```
   "This will overwrite all existing data in your database"
   ```
6. Confirmer en tapant le nom du projet ou en cliquant sur **"Restore"**
7. Attendre la fin de la restauration (2-5 minutes)

### 3.2 Vérifier la Restauration

1. Aller dans **SQL Editor** (toujours dans DEV)
2. Exécuter ce script de vérification :

```sql
-- 1. Vérifier que les tables Airbnb existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'lofts',
    'reservations',
    'airbnb_reservations_staging',
    'airbnb_sync_logs',
    'airbnb_conflicts'
)
ORDER BY table_name;

-- Résultat attendu : 5 tables

-- 2. Vérifier la colonne airbnb_listing_id dans lofts
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lofts'
AND column_name = 'airbnb_listing_id';

-- Résultat attendu : 1 ligne (airbnb_listing_id, character varying)

-- 3. Vérifier que nights est GENERATED
SELECT column_name, is_generated
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name = 'nights';

-- Résultat attendu : nights | ALWAYS

-- 4. Vérifier le loft Star avec listing_id
SELECT id, name, address, airbnb_listing_id
FROM lofts
WHERE airbnb_listing_id = '12345678';

-- Résultat attendu : 1 ligne (Star loft)

-- 5. Vérifier qu'il n'y a pas de données de test
SELECT COUNT(*) as test_reservations
FROM reservations
WHERE airbnb_confirmation_code LIKE 'HMTEST%';

-- Résultat attendu : 0
```

**✅ Si tous les résultats sont corrects, la restauration est réussie !**

---

## 🎯 ÉTAPE 4 : Basculer vers DEV (2 min)

### 4.1 Modifier .env.local

```bash
# Dans PowerShell
cd C:\Users\SERVICE-INFO\IA\algerie-loft

# Sauvegarder la config production
copy .env.local .env.production.backup

# Activer l'environnement de développement
copy .env.development .env.local

# Vérifier que le changement est effectif
type .env.local | Select-String "SUPABASE_URL"
```

**Résultat attendu :**
```
NEXT_PUBLIC_SUPABASE_URL=https://wtcbyjdwjrrqyzpvjfze.supabase.co
```

### 4.2 Redémarrer le Serveur Next.js

1. Dans le terminal où `npm run dev` tourne, appuyer sur **Ctrl+C**
2. Attendre l'arrêt complet du serveur
3. Relancer le serveur :
   ```bash
   npm run dev
   ```
4. Attendre que le serveur démarre (quelques secondes)
5. Vérifier dans les logs que l'URL Supabase est bien celle de DEV

---

## 🎯 ÉTAPE 5 : Tester l'Import en DEV (3 min)

### 5.1 Accéder à l'Interface Admin

1. Ouvrir le navigateur
2. Aller sur http://localhost:3000/fr/admin/airbnb/import
3. Vérifier que la page se charge correctement

### 5.2 Tester l'Import

1. Cliquer sur **"Choisir un fichier"** ou **"Browse"**
2. Sélectionner `test-data/reservations_test.json`
3. Cliquer sur **"Importer les réservations"**
4. Attendre le résultat

**Résultat attendu :**
```
✅ Import réussi
Batch ID: [un UUID]
Traitées: 3
Créées: 2
Mises à jour: 0
Ignorées: 1
Échouées: 0
Conflits: 1 (ou 0 si la logique est corrigée)

⚠️ 1 avertissement(s)
HMTEST003: Listing ID 99999999 not mapped to any loft
```

### 5.3 Vérifier dans la Base de Données DEV

```sql
-- Exécuter dans Supabase DEV
SELECT 
    r.id,
    r.airbnb_confirmation_code,
    l.name as loft_name,
    r.guest_name,
    r.guest_phone,
    r.check_in_date,
    r.check_out_date,
    r.nights,
    r.total_amount,
    r.status,
    r.source,
    r.created_at
FROM reservations r
LEFT JOIN lofts l ON r.loft_id = l.id
WHERE r.airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002')
ORDER BY r.airbnb_confirmation_code;
```

**Résultat attendu :**
- 2 réservations (HMTEST001 et HMTEST002)
- `nights` calculé automatiquement (4 et 5)
- `guest_phone` présent (+213555123456 et +33612345678)
- `source` = 'airbnb_scraper'

---

## ✅ Checklist Complète

### ÉTAPE 1 : Nettoyage Production
- [ ] Connexion à Supabase PRODUCTION
- [ ] Vérification des données à supprimer
- [ ] Suppression des conflits
- [ ] Suppression des logs
- [ ] Suppression du staging
- [ ] Suppression des réservations
- [ ] Vérification finale (tous les compteurs à 0)

### ÉTAPE 2 : Backup Production
- [ ] Création du backup
- [ ] Attente de la fin du backup
- [ ] Téléchargement du backup
- [ ] Sauvegarde locale du fichier

### ÉTAPE 3 : Restauration DEV
- [ ] Connexion à Supabase DEV
- [ ] Upload du backup
- [ ] Confirmation de l'écrasement
- [ ] Attente de la fin de la restauration
- [ ] Vérification des tables
- [ ] Vérification des colonnes
- [ ] Vérification du loft Star
- [ ] Vérification absence de données de test

### ÉTAPE 4 : Basculement vers DEV
- [ ] Sauvegarde de .env.local
- [ ] Copie de .env.development vers .env.local
- [ ] Vérification de l'URL Supabase
- [ ] Redémarrage du serveur Next.js
- [ ] Vérification des logs du serveur

### ÉTAPE 5 : Test de l'Import
- [ ] Accès à l'interface admin
- [ ] Import du fichier de test
- [ ] Vérification des résultats
- [ ] Vérification dans la base de données
- [ ] Confirmation que tout fonctionne

---

## 🎉 Résultat Final

Après avoir suivi cette procédure :

✅ **Production** : Propre, sans données de test  
✅ **Développement** : Copie exacte de la production  
✅ **Environnement local** : Connecté à DEV  
✅ **Import Airbnb** : Fonctionnel et testé  
✅ **Prêt** : Pour continuer le développement en toute sécurité  

---

## 📝 Fichiers Utilisés

1. `test-data/cleanup_test_data_production.sql` - Nettoyage de la production
2. `test-data/reservations_test.json` - Données de test pour l'import
3. `.env.development` - Configuration de l'environnement DEV
4. `.env.local` - Configuration active (sera DEV après basculement)

---

## 🆘 En Cas de Problème

### Problème 1 : Erreur lors de la suppression en PROD
- **Cause** : Contraintes de clés étrangères
- **Solution** : Supprimer dans l'ordre : conflits → logs → staging → réservations

### Problème 2 : Backup trop long
- **Cause** : Base de données volumineuse
- **Solution** : Attendre patiemment, Supabase gère automatiquement

### Problème 3 : Restauration échoue
- **Cause** : Fichier corrompu ou connexions actives
- **Solution** : Re-télécharger le backup, fermer toutes les connexions à DEV

### Problème 4 : Serveur ne démarre pas après basculement
- **Cause** : .env.local mal configuré
- **Solution** : Vérifier que NEXT_PUBLIC_SUPABASE_URL pointe vers DEV

### Problème 5 : Import échoue en DEV
- **Cause** : Structure de base non synchronisée
- **Solution** : Refaire la restauration du backup

---

**Auteur :** Kiro AI Assistant  
**Date :** 2026-05-18  
**Version :** 1.0.0
