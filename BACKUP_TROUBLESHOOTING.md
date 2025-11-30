# 🔍 Dépannage : Fichiers de Backup Introuvables

## ❌ Problèmes Identifiés

1. **Taille N/A** dans l'interface
2. **Fichier introuvable** dans `/backups`
3. **Pas de chemin affiché** dans les détails

## 🔧 Corrections Appliquées

### 1. Ajout du Chemin dans le Dialogue
```typescript
// Maintenant affiche :
- Emplacement du Fichier
- Checksum SHA-256
```

### 2. Logs Détaillés
```typescript
console.log(`📝 Creating dump in temp file: ${tempFile}`);
console.log(`✅ Temp file created: ${tempFile} (X MB)`);
console.log(`📋 Copying backup from ${tempFile} to ${outputFile}...`);
console.log(`✅ Final file created: ${outputFile} (X MB)`);
console.log(`📊 File size: ${fileSize} bytes`);
console.log(`🔐 Calculating checksum...`);
console.log(`✅ Checksum: ${checksum}`);
```

## 🔍 Diagnostic

### Étape 1 : Vérifier la Base de Données

Exécuter `check-last-backup.sql` :
```sql
SELECT 
    id,
    file_path,
    file_size,
    checksum,
    status,
    error_message
FROM backup_records 
WHERE id = '51f761f9-55be-454f-86a0-bde8c9c3f140';
```

**Vérifier** :
- `file_path` est-il rempli ?
- `file_size` est-il NULL ou 0 ?
- `status` est-il COMPLETED ?
- Y a-t-il un `error_message` ?

### Étape 2 : Chercher les Fichiers

**Script PowerShell** :
```powershell
.\search-all-backups.ps1
```

**Ou manuellement** :
```powershell
# Dossier backups
Get-ChildItem backups\*.sql

# Dossier temp
Get-ChildItem "$env:TEMP\supabase-cloner\*.sql"

# Recherche globale (dernières 24h)
Get-ChildItem C:\ -Filter "*.sql" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -like "full_*" -and $_.LastWriteTime -gt (Get-Date).AddDays(-1) }
```

### Étape 3 : Vérifier les Logs du Serveur

Chercher dans les logs :
```
🚀 Starting backup using PgDumpCloner
📝 Creating dump in temp file
✅ Temp file created
📋 Copying backup from
✅ Final file created
📊 File size
🔐 Calculating checksum
✅ Checksum
✅ Backup completed successfully
```

**Si manquant** : Le backup a échoué avant la création du fichier.

### Étape 4 : Vérifier les Permissions

```powershell
# Tester l'écriture dans backups
"test" | Out-File backups\test.txt
Remove-Item backups\test.txt

# Si erreur : Problème de permissions
```

## 🐛 Causes Possibles

### 1. Backup Échoue Avant la Création du Fichier

**Symptômes** :
- Status: FAILED
- file_size: NULL
- error_message rempli

**Solution** :
- Vérifier l'error_message
- Vérifier les credentials
- Vérifier pg_dump est installé

### 2. Fichier Créé Mais Pas Copié

**Symptômes** :
- Fichier dans `%TEMP%\supabase-cloner\`
- Pas dans `/backups`
- Status: COMPLETED mais file_size: NULL

**Solution** :
- Vérifier les permissions sur `/backups`
- Vérifier l'espace disque

### 3. Chemin Incorrect dans la Base

**Symptômes** :
- file_path pointe vers un mauvais emplacement
- Fichier existe mais ailleurs

**Solution** :
- Vérifier la configuration `storage_location`
- Chercher le fichier avec le script PowerShell

### 4. Backup Asynchrone Pas Terminé

**Symptômes** :
- Status: IN_PROGRESS ou PENDING
- Pas de file_size
- completed_at NULL

**Solution** :
- Attendre la fin du backup
- Vérifier les logs du serveur
- Le polling devrait détecter la completion

## 🧪 Test Complet

### Créer un Nouveau Backup avec Logs

1. **Ouvrir la console du serveur** (terminal où Next.js tourne)

2. **Aller sur** `/fr/admin/superuser/backup`

3. **Cliquer** sur "Sauvegarde Complète Immédiate"

4. **Observer les logs** :
   ```
   🚀 Starting backup using PgDumpCloner for mhngbluefyucoesgcjoy...
   📝 Creating dump in temp file: C:\Users\...\Temp\supabase-cloner\backup_xxx.sql
   [INFO] [Dumping] Running: pg_dump -h aws-0-eu-central-1.pooler.supabase.com ...
   [INFO] [Dumping] pg_dump: reading extensions
   ...
   ✅ Temp file created: C:\Users\...\Temp\supabase-cloner\backup_xxx.sql (1.55 MB)
   📋 Copying backup from ... to /backups/full_xxx.sql...
   ✅ Final file created: /backups/full_xxx.sql (1.55 MB)
   📊 File size: 1625609 bytes (1.55 MB)
   🔐 Calculating checksum...
   ✅ Checksum: abc123...
   ✅ Backup completed successfully: /backups/full_xxx.sql (1.55 MB)
   ```

5. **Vérifier le fichier** :
   ```powershell
   dir backups\full_*.sql
   ```

6. **Vérifier dans l'interface** :
   - Rafraîchir la page
   - Le backup devrait apparaître avec la taille
   - Cliquer sur "👁️ Voir"
   - Vérifier que le chemin est affiché

## 📊 Checklist de Vérification

- [ ] pg_dump est installé : `pg_dump --version`
- [ ] Credentials dans .env.local : `SUPABASE_DB_PASSWORD`
- [ ] Dossier backups existe : `Test-Path backups`
- [ ] Permissions d'écriture : `"test" | Out-File backups\test.txt`
- [ ] Espace disque disponible : `Get-PSDrive C`
- [ ] Logs du serveur visibles
- [ ] Polling fonctionne (interface se met à jour)

## 🔧 Solutions Rapides

### Si file_size est NULL

```sql
-- Vérifier si le fichier existe vraiment
-- Puis mettre à jour manuellement
UPDATE backup_records 
SET file_size = 1625609,  -- Taille réelle en bytes
    checksum = 'abc123...'  -- Checksum réel
WHERE id = '51f761f9-55be-454f-86a0-bde8c9c3f140';
```

### Si fichier dans temp mais pas dans backups

```powershell
# Copier manuellement
Copy-Item "$env:TEMP\supabase-cloner\dump_user_*.sql" backups\manual_backup.sql
```

### Si permissions refusées

```powershell
# Donner les permissions
icacls backups /grant Users:F
```

## 📝 Fichiers Créés

- `check-last-backup.sql` - Requête SQL de vérification
- `search-all-backups.ps1` - Script de recherche PowerShell
- `BACKUP_TROUBLESHOOTING.md` - Ce guide

## 🎯 Prochaines Étapes

1. **Exécuter** : `.\search-all-backups.ps1`
2. **Vérifier** : La base de données avec `check-last-backup.sql`
3. **Créer** : Un nouveau backup en observant les logs
4. **Confirmer** : Le fichier apparaît dans `/backups`

---

**Si le problème persiste**, partagez :
- Les logs du serveur
- Le résultat de `check-last-backup.sql`
- Le résultat de `search-all-backups.ps1`
