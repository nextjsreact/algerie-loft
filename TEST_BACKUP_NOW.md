# 🧪 Test du Backup - Guide Rapide

## ✅ Correction Appliquée

**Erreur corrigée** : `credentials.projectUrl` → `credentials.url`

Le PgDumpCloner attend maintenant les bonnes propriétés.

## 🚀 Test Maintenant

### Étape 1 : Vérifier les variables d'environnement

Ouvrir `.env.local` et vérifier :
```env
NEXT_PUBLIC_SUPABASE_URL=https://mhngbluefyucoesgcjoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_PASSWORD=votre_mot_de_passe  # ← REQUIS
```

### Étape 2 : Créer un backup

1. Aller sur : `http://localhost:3000/fr/admin/superuser/backup`
2. Cliquer sur **"Sauvegarde Complète Immédiate"**
3. Observer les logs dans la console

### Étape 3 : Logs attendus

```
🚀 Starting backup using PgDumpCloner for mhngbluefyucoesgcjoy...
🟡 [PG-DUMP-CLONER] Initializing pg_dump cloning process...
✅ pg_dump found: pg_dump (PostgreSQL) 15.x
🔄 Dumping user schemas (public, etc)...
✅ Dumps created successfully (Total: 125.45 MB)
✅ Backup b037342d-919c-4bf6-8e68-751ae7bc2bbb completed successfully
```

### Étape 4 : Vérifier le fichier

```bash
# Windows
dir backups\*.sql

# Linux/Mac
ls -lh backups/*.sql
```

Vous devriez voir :
```
full_2024-11-29T22-30-00-000Z_a1b2c3d4.sql
```

### Étape 5 : Vérifier dans l'interface

1. Rafraîchir la page backup
2. Le backup devrait apparaître avec statut **"Terminé"**
3. Cliquer sur **"👁️ Voir"** pour les détails
4. Vérifier la taille du fichier

## 🔍 Si ça échoue encore

### Vérifier pg_dump
```bash
pg_dump --version
```

Si non installé :
```bash
# Windows
choco install postgresql

# Linux
sudo apt-get install postgresql-client

# Mac
brew install postgresql
```

### Vérifier le mot de passe

Le mot de passe PostgreSQL est différent de votre mot de passe Supabase.

Pour le trouver :
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Settings → Database
4. Chercher "Database password" ou "Connection string"

### Vérifier les logs détaillés

Dans la console du serveur, chercher :
```
[PG-DUMP-CLONER]
```

## 📊 Vérifier dans la Base de Données

```sql
-- Voir le dernier backup
SELECT 
    id,
    backup_type,
    status,
    started_at,
    completed_at,
    file_size,
    file_path,
    error_message
FROM backup_records 
ORDER BY started_at DESC 
LIMIT 1;
```

## ✅ Succès Attendu

Si tout fonctionne :
- ✅ Statut : **COMPLETED**
- ✅ Fichier créé dans `/backups`
- ✅ Taille > 0 bytes
- ✅ Checksum SHA-256 généré
- ✅ Pas d'erreur dans les logs

## 🎯 Prochaines Étapes

Une fois le premier backup réussi :
1. Tester "Sauvegarde Incrémentale"
2. Tester "Sauvegarde Manuelle"
3. Vérifier l'intégrité d'un backup
4. Tester la restauration (manuel avec psql)

## 📞 Résumé

**Correction** : Propriété `url` au lieu de `projectUrl`  
**Test** : Créer un backup maintenant  
**Résultat attendu** : Fichier .sql dans `/backups`  

Allez-y, testez ! 🚀
