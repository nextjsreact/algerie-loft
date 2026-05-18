# 🔄 Restaurer la Production vers l'Environnement de Développement

## ✅ Avantages de cette Approche

- ✅ **Copie exacte** : Structure + données identiques à la production
- ✅ **Rapide** : Pas besoin d'appliquer les migrations manuellement
- ✅ **Sécurisé** : Tester sur des données réelles sans risque
- ✅ **Fiable** : Garantit que DEV = PROD en termes de structure

---

## 📊 Environnements

### Production (Source)
- **Projet Supabase :** `mhngbluefyucoesgcjoy`
- **URL :** `https://mhngbluefyucoesgcjoy.supabase.co`
- **Statut :** Base de données de production avec données réelles

### Développement (Cible)
- **Projet Supabase :** `wtcbyjdwjrrqyzpvjfze`
- **URL :** `https://wtcbyjdwjrrqyzpvjfze.supabase.co`
- **Statut :** Sera écrasé par la copie de production

---

## 🚀 Méthode 1 : Backup/Restore via Supabase Dashboard (RECOMMANDÉ)

### Étape 1 : Créer un Backup de la Production

1. **Ouvrir Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionner le projet PRODUCTION** : `mhngbluefyucoesgcjoy`
3. **Aller dans** : `Database` → `Backups`
4. **Créer un backup manuel** :
   - Cliquer sur **"Create backup"** ou **"Backup now"**
   - Attendre la fin du backup (quelques minutes)
   - Noter l'ID ou le timestamp du backup

### Étape 2 : Télécharger le Backup

1. Dans la liste des backups, trouver le backup que vous venez de créer
2. Cliquer sur **"Download"** ou **"..."** → **"Download"**
3. Le fichier sera téléchargé (format `.sql` ou `.dump`)
4. Sauvegarder le fichier dans un endroit sûr (ex: `C:\Users\SERVICE-INFO\IA\algerie-loft\backups\`)

### Étape 3 : Restaurer dans l'Environnement DEV

1. **Sélectionner le projet DEV** : `wtcbyjdwjrrqyzpvjfze`
2. **Aller dans** : `Database` → `Backups`
3. **Restaurer le backup** :
   - Cliquer sur **"Restore"** ou **"Upload backup"**
   - Sélectionner le fichier téléchargé à l'étape 2
   - ⚠️ **ATTENTION** : Cela va **ÉCRASER** toutes les données existantes en DEV
   - Confirmer la restauration
   - Attendre la fin de la restauration (quelques minutes)

### Étape 4 : Vérifier la Restauration

```sql
-- À exécuter dans Supabase DEV (wtcbyjdwjrrqyzpvjfze)
-- SQL Editor > New Query

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

-- 2. Vérifier la colonne airbnb_listing_id dans lofts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lofts'
AND column_name = 'airbnb_listing_id';

-- 3. Vérifier les colonnes Airbnb dans reservations
SELECT column_name, data_type, is_nullable, is_generated
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name IN ('airbnb_confirmation_code', 'source', 'nights', 'base_price', 'synced_at');

-- 4. Compter les lofts
SELECT COUNT(*) as total_lofts FROM lofts;

-- 5. Compter les réservations
SELECT COUNT(*) as total_reservations FROM reservations;

-- 6. Vérifier le loft Star loft avec listing_id
SELECT id, name, address, airbnb_listing_id
FROM lofts
WHERE airbnb_listing_id = '12345678';
```

---

## 🚀 Méthode 2 : Backup/Restore via pg_dump et psql (Alternative)

### Prérequis
- PostgreSQL client installé sur votre machine
- Mot de passe de la base de données

### Étape 1 : Exporter la Production

```bash
# Dans PowerShell
cd C:\Users\SERVICE-INFO\IA\algerie-loft\backups

# Créer le dossier backups s'il n'existe pas
mkdir backups -ErrorAction SilentlyContinue

# Exporter la base de production
$env:PGPASSWORD="Canada!2025Mosta"
pg_dump -h aws-0-eu-central-1.pooler.supabase.com `
        -p 6543 `
        -U postgres.mhngbluefyucoesgcjoy `
        -d postgres `
        -F c `
        -f "backups\production_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
```

### Étape 2 : Restaurer dans DEV

```bash
# Restaurer dans la base de développement
$env:PGPASSWORD="Canada!2025Mosta"
pg_restore -h aws-0-eu-central-1.pooler.supabase.com `
           -p 6543 `
           -U postgres.wtcbyjdwjrrqyzpvjfze `
           -d postgres `
           --clean `
           --if-exists `
           "backups\production_backup_YYYYMMDD_HHMMSS.dump"
```

---

## 🚀 Méthode 3 : Copie Directe via SQL (Plus Rapide)

### Option A : Copier uniquement la structure

```sql
-- À exécuter dans Supabase DEV (wtcbyjdwjrrqyzpvjfze)

-- 1. Se connecter à la production via dblink (si disponible)
-- OU copier-coller les CREATE TABLE depuis la production

-- 2. Exporter les CREATE TABLE depuis PRODUCTION
-- Aller dans Supabase PRODUCTION > SQL Editor
-- Exécuter ce script pour obtenir les CREATE TABLE

SELECT 
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' || 
    string_agg(
        column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 'DECIMAL(' || numeric_precision || ',' || numeric_scale || ')'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) || ');' as create_statement
FROM information_schema.columns
WHERE table_name IN (
    'airbnb_reservations_staging',
    'airbnb_sync_logs',
    'airbnb_conflicts'
)
GROUP BY table_name;
```

---

## 🔄 Après la Restauration

### Étape 1 : Nettoyer les Données de Test en DEV

```sql
-- À exécuter dans Supabase DEV (wtcbyjdwjrrqyzpvjfze)

-- Supprimer les réservations de test
DELETE FROM reservations
WHERE airbnb_confirmation_code IN ('HMTEST001', 'HMTEST002', 'HMTEST003');

-- Supprimer les entrées staging de test
DELETE FROM airbnb_reservations_staging
WHERE airbnb_id LIKE 'HMTEST%';

-- Supprimer les conflits de test
DELETE FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Supprimer les logs de test
DELETE FROM airbnb_sync_logs
WHERE sync_batch_id = '44d52471-5a89-4dcb-84ca-5a84d6aa39d3';
```

### Étape 2 : Vérifier que le Loft Star est Présent

```sql
-- Vérifier le loft avec listing_id mappé
SELECT id, name, address, airbnb_listing_id, status
FROM lofts
WHERE airbnb_listing_id = '12345678';

-- Si le loft n'existe pas, le créer
INSERT INTO lofts (name, address, airbnb_listing_id, status)
VALUES (
    'Star loft',
    '27 Rue Mohamed BENLAREDJ 1er étage, appartement N°5 El Madania',
    '12345678',
    'active'
)
ON CONFLICT (airbnb_listing_id) DO NOTHING;
```

### Étape 3 : Basculer vers l'Environnement DEV

```bash
# Dans PowerShell
cd C:\Users\SERVICE-INFO\IA\algerie-loft

# Sauvegarder la config production
copy .env.local .env.production.backup

# Activer l'environnement de développement
copy .env.development .env.local

# Vérifier le contenu de .env.local
type .env.local | Select-String "SUPABASE_URL"

# Devrait afficher : wtcbyjdwjrrqyzpvjfze
```

### Étape 4 : Redémarrer le Serveur Next.js

```bash
# Arrêter le serveur actuel (Ctrl+C dans le terminal où npm run dev tourne)

# Redémarrer
npm run dev
```

### Étape 5 : Tester l'Import en DEV

1. Ouvrir http://localhost:3000/fr/admin/airbnb/import
2. Vérifier que la page se charge correctement
3. Importer `test-data/reservations_test.json`
4. Vérifier les résultats :
   - ✅ 3 réservations traitées
   - ✅ 2 réservations créées
   - ⚠️ 1 réservation ignorée (HMTEST003)
   - ✅ 0 erreur

---

## ✅ Checklist Complète

### Avant la Restauration
- [ ] Backup de production créé
- [ ] Backup téléchargé et sauvegardé localement
- [ ] Confirmation que DEV peut être écrasé

### Pendant la Restauration
- [ ] Restauration lancée dans Supabase DEV
- [ ] Attendre la fin de la restauration
- [ ] Vérifier qu'il n'y a pas d'erreurs

### Après la Restauration
- [ ] Toutes les tables Airbnb existent en DEV
- [ ] La colonne `nights` est GENERATED
- [ ] Le loft Star avec listing_id 12345678 existe
- [ ] Données de test nettoyées (optionnel)
- [ ] `.env.local` pointe vers DEV
- [ ] Serveur Next.js redémarré
- [ ] Import test réussi

---

## 🎯 Avantages de cette Approche

| Aspect | Avantage |
|--------|----------|
| **Structure** | ✅ Identique à la production |
| **Données** | ✅ Copie des données réelles pour tests réalistes |
| **Rapidité** | ✅ Plus rapide que d'appliquer les migrations manuellement |
| **Fiabilité** | ✅ Garantit que DEV = PROD |
| **Sécurité** | ✅ Tester sur une copie sans risque |

---

## ⚠️ Points d'Attention

### 1. Taille de la Base de Données
- Si la base de production est très grande (> 1 GB), la restauration peut prendre du temps
- Supabase Free Tier a des limites de stockage (500 MB)

### 2. Données Sensibles
- La copie contiendra toutes les données de production (clients, réservations, etc.)
- Assurez-vous que l'environnement DEV est sécurisé
- Envisagez d'anonymiser les données sensibles après la restauration

### 3. Connexions Actives
- Pendant la restauration, la base DEV sera inaccessible
- Assurez-vous qu'aucune application ne se connecte à DEV pendant la restauration

---

## 🔒 Anonymisation des Données (Optionnel)

Si vous voulez anonymiser les données sensibles en DEV :

```sql
-- À exécuter dans Supabase DEV après la restauration

-- Anonymiser les emails des clients
UPDATE reservations
SET guest_email = 'test' || id::text || '@example.com'
WHERE guest_email IS NOT NULL;

-- Anonymiser les téléphones
UPDATE reservations
SET guest_phone = '+213555' || LPAD((random() * 999999)::int::text, 6, '0')
WHERE guest_phone IS NOT NULL;

-- Anonymiser les noms
UPDATE reservations
SET guest_name = 'Test Guest ' || id::text;

-- Anonymiser les demandes spéciales
UPDATE reservations
SET special_requests = NULL
WHERE special_requests IS NOT NULL;
```

---

## 📝 Résumé de la Procédure Recommandée

1. **Créer un backup de PROD** via Supabase Dashboard
2. **Télécharger le backup** sur votre machine
3. **Restaurer le backup dans DEV** via Supabase Dashboard
4. **Vérifier** que toutes les tables et colonnes sont présentes
5. **Nettoyer** les données de test (optionnel)
6. **Basculer** `.env.local` vers DEV
7. **Redémarrer** le serveur Next.js
8. **Tester** l'import Airbnb

---

**Auteur :** Kiro AI Assistant  
**Date :** 2026-05-18  
**Version :** 1.0.0
