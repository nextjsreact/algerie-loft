# 📂 Chemins des Dumps de Sauvegarde

## 🎯 Chemin de Destination

### Configuration par défaut :
```
storage_location: '/backups'
```

### Chemin absolu sur votre système :
```
Windows: C:\Users\VotreNom\votre-projet\backups\
Linux/Mac: /home/votrenom/votre-projet/backups/
```

## 📁 Structure Complète

```
votre-projet/                          # Racine du projet
├── backups/                           # ← DOSSIER DES DUMPS
│   ├── README.md                      # Documentation
│   ├── full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql
│   ├── incremental_2024-01-29T14-00-00-000Z_b2c3d4e5.sql
│   ├── manual_2024-01-29T16-45-00-000Z_c3d4e5f6.sql
│   └── clone-operations/              # Opérations de clonage
├── app/
├── components/
├── lib/
├── public/
└── ...
```

## 🔧 Comment ça fonctionne ?

### 1. Configuration dans la base de données
```sql
-- Table: system_configurations
-- Clé: storage_location
-- Valeur par défaut: '/backups'
```

### 2. Génération du chemin complet
```typescript
// Dans backup-service.ts
const filePath = `${config.storage_location}/${type}_${timestamp}_${random}.sql`;
// Exemple: /backups/full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql
```

### 3. Création du fichier
```typescript
// Le dossier est créé automatiquement si nécessaire
await fs.mkdir(backupDir, { recursive: true });

// pg_dump écrit directement dans ce fichier
pg_dump ... -f /backups/full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql
```

## 📍 Trouver vos dumps

### Méthode 1 : Via l'explorateur de fichiers
```
1. Ouvrir l'explorateur Windows
2. Naviguer vers votre dossier de projet
3. Ouvrir le dossier "backups"
```

### Méthode 2 : Via la ligne de commande
```bash
# Windows (PowerShell)
cd votre-projet
dir backups

# Linux/Mac
cd votre-projet
ls -lh backups/
```

### Méthode 3 : Via VS Code / Kiro
```
1. Ouvrir l'explorateur de fichiers (Ctrl+Shift+E)
2. Chercher le dossier "backups"
3. Les fichiers .sql y seront listés
```

## 🔄 Modifier le Chemin de Destination

### Option 1 : Via la base de données
```sql
-- Modifier la configuration
UPDATE system_configurations 
SET config_value = '/mon/nouveau/chemin/backups'
WHERE config_key = 'storage_location';
```

### Option 2 : Chemin absolu (recommandé pour production)
```sql
-- Windows
UPDATE system_configurations 
SET config_value = 'D:/Backups/LoftAlgerie'
WHERE config_key = 'storage_location';

-- Linux/Mac
UPDATE system_configurations 
SET config_value = '/var/backups/loft-algerie'
WHERE config_key = 'storage_location';
```

### Option 3 : Réseau / Cloud
```sql
-- Partage réseau Windows
UPDATE system_configurations 
SET config_value = '\\\\serveur\\backups\\loft-algerie'
WHERE config_key = 'storage_location';

-- Montage NFS Linux
UPDATE system_configurations 
SET config_value = '/mnt/nas/backups/loft-algerie'
WHERE config_key = 'storage_location';
```

## 📊 Vérifier l'Emplacement Actuel

### Via SQL
```sql
SELECT config_value 
FROM system_configurations 
WHERE config_key = 'storage_location';
```

### Via l'API
```bash
curl "http://localhost:3000/api/superuser/backup?action=configuration"
```

### Via les logs
```sql
SELECT file_path 
FROM backup_records 
ORDER BY started_at DESC 
LIMIT 1;
```

## 💾 Taille et Espace Disque

### Estimer l'espace nécessaire
```sql
-- Taille actuelle de la base de données
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Espace utilisé par les backups
SELECT 
    COUNT(*) as nombre_backups,
    pg_size_pretty(SUM(file_size)) as espace_total
FROM backup_records 
WHERE status = 'COMPLETED';
```

### Recommandations
- **Développement** : 5-10 GB minimum
- **Production** : 50-100 GB recommandé
- **Avec rétention 30 jours** : Taille DB × 30 × 1.2

## 🔐 Permissions Requises

### Windows
```powershell
# Vérifier les permissions
icacls backups

# Donner les permissions complètes
icacls backups /grant Users:F
```

### Linux/Mac
```bash
# Vérifier les permissions
ls -ld backups

# Donner les permissions
chmod 755 backups
chown $USER:$USER backups
```

## 🚨 Problèmes Courants

### Erreur : "Cannot create directory"
**Cause** : Permissions insuffisantes
**Solution** :
```bash
# Créer manuellement avec les bonnes permissions
mkdir -p backups
chmod 755 backups
```

### Erreur : "No space left on device"
**Cause** : Disque plein
**Solution** :
1. Vérifier l'espace : `df -h` (Linux) ou `Get-PSDrive` (Windows)
2. Nettoyer les anciens backups
3. Changer le `storage_location` vers un disque avec plus d'espace

### Erreur : "Path not found"
**Cause** : Chemin invalide ou inexistant
**Solution** :
```sql
-- Réinitialiser au chemin par défaut
UPDATE system_configurations 
SET config_value = '/backups'
WHERE config_key = 'storage_location';
```

## 📝 Exemples de Chemins

### Développement Local
```
/backups                           # Relatif au projet (par défaut)
./backups                          # Relatif au projet (explicite)
```

### Production Windows
```
D:/Backups/LoftAlgerie            # Disque dédié
C:/ProgramData/LoftAlgerie/Backups # Dossier système
\\\\nas-server\\backups\\loft      # Partage réseau
```

### Production Linux
```
/var/backups/loft-algerie         # Standard Linux
/mnt/backup-disk/loft-algerie     # Disque monté
/home/backups/loft-algerie        # Home directory
```

### Cloud Storage (futur)
```
s3://mon-bucket/backups           # AWS S3
gs://mon-bucket/backups           # Google Cloud Storage
supabase://storage/backups        # Supabase Storage
```

## 🔍 Monitoring

### Surveiller l'espace disque
```bash
# Windows PowerShell
Get-PSDrive C | Select-Object Used,Free

# Linux/Mac
df -h /backups
```

### Surveiller la taille des backups
```sql
SELECT 
    DATE(started_at) as date,
    COUNT(*) as nombre,
    pg_size_pretty(SUM(file_size)) as taille_totale,
    pg_size_pretty(AVG(file_size)) as taille_moyenne
FROM backup_records 
WHERE status = 'COMPLETED'
GROUP BY DATE(started_at)
ORDER BY date DESC
LIMIT 30;
```

## 📞 Résumé

**Chemin par défaut** : `/backups` (relatif à la racine du projet)

**Chemin absolu sur votre machine** :
- Ouvrez un terminal dans votre projet
- Exécutez : `pwd` (Linux/Mac) ou `cd` (Windows)
- Ajoutez `/backups` à la fin

**Exemple** :
```
Si votre projet est dans : C:\Users\John\Projects\loft-algerie
Alors les dumps sont dans : C:\Users\John\Projects\loft-algerie\backups\
```

**Pour vérifier** :
```bash
# Dans le terminal de votre projet
cd backups
ls -la    # Linux/Mac
dir       # Windows
```
