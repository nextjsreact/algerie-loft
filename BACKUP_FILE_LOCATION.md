# 📁 Emplacement des Fichiers de Backup

## 🔍 Problème Identifié

Les fichiers de backup n'apparaissaient pas dans `/backups` car le PgDumpCloner utilise un **dossier temporaire**.

## 📂 Emplacements

### 1. Dossier Temporaire (Avant la correction)
```
C:\Users\SERVICE-INFO\AppData\Local\Temp\supabase-cloner\
```

Le PgDumpCloner crée les fichiers ici par défaut :
- `dump_system_1764454090967.sql` (39 KB)
- `dump_user_1764454099367.sql` (1.6 MB)

### 2. Dossier Final (Après la correction)
```
C:\Users\SERVICE-INFO\IA\algerie-loft\backups\
```

Le fichier sera maintenant **copié** du temp vers backups :
- `full_2025-11-29T22-12-43-502Z_44d8adae.sql`

## 🔧 Correction Appliquée

### Avant (❌ Fichier dans temp)
```typescript
// PgDumpCloner crée directement dans outputFile
await cloner.executeDump(connection, outputFile, options);
// Mais outputFile pointe vers /backups
// Et PgDumpCloner utilise son propre tempDir
```

### Après (✅ Copie vers backups)
```typescript
// 1. Créer dans temp
const tempFile = path.join(tempDir, `backup_${timestamp}.sql`);
await cloner.executeDump(connection, tempFile, options);

// 2. Copier vers backups
await fs.copyFile(tempFile, outputFile);

// 3. Nettoyer temp
await fs.unlink(tempFile);
```

## 🎯 Flux Complet

```
1. Backup demandé
   ↓
2. PgDumpCloner crée dans:
   C:\Users\...\Temp\supabase-cloner\backup_xxx.sql
   ↓
3. Fichier copié vers:
   C:\Users\...\algerie-loft\backups\full_xxx.sql
   ↓
4. Fichier temp supprimé
   ↓
5. ✅ Fichier final dans /backups
```

## 🔍 Vérifier les Fichiers

### Script automatique
```bash
.\find-backup-files.bat
```

### Manuellement

**Dossier backups** :
```bash
dir backups\*.sql
```

**Dossier temp** :
```bash
dir "%TEMP%\supabase-cloner\*.sql"
```

**Via la base de données** :
```sql
SELECT 
    id,
    file_path,
    file_size,
    started_at
FROM backup_records 
ORDER BY started_at DESC 
LIMIT 1;
```

## 📊 Tailles des Fichiers

### Fichiers temporaires (clonage)
```
dump_system_1764454090967.sql    39 KB   (auth, storage data)
dump_user_1764454099367.sql      1.6 MB  (public schema)
Total:                            ~1.6 MB
```

### Fichier final (backup)
```
full_2025-11-29T22-12-43-502Z_44d8adae.sql    1.55 MB
```

## 🗂️ Structure des Dossiers

```
algerie-loft/
├── backups/                                    ← Fichiers finaux
│   ├── README.md
│   ├── full_2025-11-29T22-12-43-502Z_xxx.sql  ← ICI !
│   └── clone-operations/
│
C:\Users\SERVICE-INFO\AppData\Local\Temp\
└── supabase-cloner/                            ← Fichiers temporaires
    ├── dump_system_xxx.sql                     ← Temp (supprimé)
    └── dump_user_xxx.sql                       ← Temp (supprimé)
```

## 🧪 Test Après Correction

### Étape 1 : Créer un nouveau backup
1. Aller sur `/fr/admin/superuser/backup`
2. Cliquer sur "Sauvegarde Complète Immédiate"
3. Attendre la completion

### Étape 2 : Vérifier le fichier
```bash
# Devrait maintenant apparaître
dir backups\*.sql
```

### Étape 3 : Vérifier la taille
```bash
# Devrait être ~1.5 MB
dir backups\full_*.sql
```

## 📝 Logs Attendus

```
🚀 Starting backup using PgDumpCloner for mhngbluefyucoesgcjoy...
[INFO] Dumping user schemas (public, etc)...
[INFO] Running: pg_dump -h aws-0-eu-central-1.pooler.supabase.com ...
[SUCCESS] ✅ Dumps created successfully
📋 Copying backup from C:\Users\...\Temp\...\backup_xxx.sql to /backups/full_xxx.sql...
✅ Backup file created at: /backups/full_2025-11-29T22-12-43-502Z_44d8adae.sql
✅ Backup completed successfully: /backups/full_xxx.sql (1.55 MB)
```

## 🔐 Sécurité

### Fichiers temporaires
- ⚠️ Créés dans `%TEMP%` (accessible à l'utilisateur)
- ✅ Supprimés après copie
- ✅ Pas de données sensibles persistantes dans temp

### Fichiers finaux
- ✅ Dans `/backups` (contrôlé par l'application)
- ✅ Déjà dans `.gitignore`
- ✅ Accès restreint aux superusers

## 🗑️ Nettoyage

### Nettoyer les anciens fichiers temp
```bash
# Windows
del /Q "%TEMP%\supabase-cloner\*.sql"

# Ou via PowerShell
Remove-Item "$env:TEMP\supabase-cloner\*.sql" -Force
```

### Nettoyer les anciens backups
```bash
# Garder seulement les 30 derniers jours
# (À implémenter dans le système de rétention)
```

## 📊 Espace Disque

### Dossier temp
- Utilisé temporairement pendant le backup
- Libéré immédiatement après
- ~1.6 MB pendant quelques secondes

### Dossier backups
- Stockage permanent
- ~1.5 MB par backup
- Avec 30 jours de rétention : ~45 MB

## 🎯 Résumé

**Problème** : Fichiers créés dans temp, pas dans backups

**Cause** : PgDumpCloner utilise son propre tempDir

**Solution** : Copier du temp vers backups après création

**Résultat** : Fichiers maintenant dans `/backups` ✅

## 🚀 Prochaine Utilisation

1. Créer un nouveau backup
2. Vérifier avec : `dir backups\*.sql`
3. Le fichier devrait apparaître ! ✅

---

**Fichiers créés** :
- `find-backup-files.bat` - Script de recherche
- `BACKUP_FILE_LOCATION.md` - Cette documentation
