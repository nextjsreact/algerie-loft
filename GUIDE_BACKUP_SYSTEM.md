# 🔐 Guide du Système de Backup Superuser

## 📋 Vue d'ensemble

Le système de backup permet aux superusers de créer, gérer et restaurer des sauvegardes complètes de la base de données PostgreSQL.

## ✨ Fonctionnalités

### ✅ Implémenté
- ✅ Création de sauvegardes complètes (FULL)
- ✅ Création de sauvegardes incrémentales (INCREMENTAL)
- ✅ Création de sauvegardes manuelles (MANUAL)
- ✅ Historique des sauvegardes
- ✅ Vérification d'intégrité (checksum SHA-256)
- ✅ Statistiques en temps réel
- ✅ Export des sauvegardes
- ✅ Utilisation de `pg_dump` (réutilisation du code de clonage)
- ✅ Stockage local dans `/backups`
- ✅ Suivi de progression
- ✅ Gestion des erreurs
- ✅ Logs d'audit

### 🚧 À venir
- 🚧 Restauration via l'interface web
- 🚧 Compression automatique (gzip)
- 🚧 Chiffrement des backups
- 🚧 Upload vers Supabase Storage
- 🚧 Sauvegardes programmées (cron)
- 🚧 Notifications par email

## 🚀 Utilisation

### Via l'Interface Web

1. **Accéder à la page de backup**
   ```
   http://localhost:3000/fr/admin/superuser/backup
   ```

2. **Créer une sauvegarde**
   - Cliquer sur "Sauvegarde Complète Immédiate"
   - Ou "Sauvegarde Incrémentale"
   - Ou "Sauvegarde Manuelle"

3. **Voir l'historique**
   - Les sauvegardes apparaissent dans la liste
   - Statut en temps réel (En cours, Terminé, Échoué)

4. **Voir les détails**
   - Cliquer sur l'icône "👁️ Voir"
   - Affiche : ID, Type, Taille, Dates, Checksum

5. **Vérifier l'intégrité**
   - Dans les détails, cliquer sur "Vérifier l'Intégrité"

### Via l'API

#### Créer une sauvegarde
```bash
curl -X POST http://localhost:3000/api/superuser/backup \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "type": "FULL",
    "compression": true,
    "tables": ["users", "lofts"]
  }'
```

#### Obtenir l'historique
```bash
curl "http://localhost:3000/api/superuser/backup?action=history&limit=10"
```

#### Vérifier une sauvegarde
```bash
curl "http://localhost:3000/api/superuser/backup?action=verify&backup_id=UUID"
```

## 📁 Emplacement des Fichiers

Les sauvegardes sont stockées dans :
```
/backups/
├── full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql
├── incremental_2024-01-29T14-00-00-000Z_b2c3d4e5.sql
└── manual_2024-01-29T16-45-00-000Z_c3d4e5f6.sql
```

## 🔧 Configuration Requise

### 1. Variables d'environnement

Ajouter dans `.env.local` :
```env
# URL Supabase (déjà présent)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Mot de passe PostgreSQL (REQUIS pour pg_dump)
SUPABASE_DB_PASSWORD=votre_mot_de_passe_postgres
# OU
DATABASE_PASSWORD=votre_mot_de_passe_postgres
```

### 2. PostgreSQL Client Tools

**Windows :**
```bash
# Télécharger depuis postgresql.org
# Ou via Chocolatey
choco install postgresql

# Vérifier l'installation
pg_dump --version
```

**macOS :**
```bash
brew install postgresql
pg_dump --version
```

**Linux :**
```bash
sudo apt-get install postgresql-client
pg_dump --version
```

### 3. Permissions

Le dossier `backups/` doit être accessible en écriture :
```bash
mkdir -p backups
chmod 755 backups
```

## 🔐 Sécurité

### Permissions
- Seuls les **superusers** peuvent créer des sauvegardes
- Permission requise : `BACKUP_MANAGEMENT`
- Toutes les actions sont auditées dans `superuser_audit_logs`

### Données Sensibles
- ⚠️ Les fichiers `.sql` contiennent TOUTES les données
- ⚠️ Ne JAMAIS commiter dans Git (déjà dans `.gitignore`)
- ⚠️ Stocker dans un emplacement sécurisé
- ✅ Chiffrement recommandé pour la production

### Checksums
- Chaque backup a un checksum SHA-256
- Permet de détecter la corruption des fichiers
- Vérification automatique disponible

## 📊 Base de Données

### Table `backup_records`

```sql
CREATE TABLE backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(20) NOT NULL,  -- FULL, INCREMENTAL, MANUAL
    status VARCHAR(20) NOT NULL,        -- PENDING, IN_PROGRESS, COMPLETED, FAILED
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    file_size BIGINT,                   -- Taille en octets
    file_path TEXT NOT NULL,
    checksum TEXT,                      -- SHA-256
    compression_ratio NUMERIC,
    tables_included TEXT[],
    error_message TEXT,
    retention_until TIMESTAMP,
    metadata JSONB
);
```

### Requêtes Utiles

```sql
-- Dernières sauvegardes
SELECT * FROM backup_records 
ORDER BY started_at DESC 
LIMIT 10;

-- Sauvegardes réussies
SELECT * FROM backup_records 
WHERE status = 'COMPLETED'
ORDER BY started_at DESC;

-- Espace total utilisé
SELECT 
    COUNT(*) as total_backups,
    SUM(file_size) / 1024 / 1024 / 1024 as total_gb
FROM backup_records 
WHERE status = 'COMPLETED';

-- Taux de réussite
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM backup_records
GROUP BY status;
```

## 🔄 Restauration

### Méthode 1 : Via psql (Ligne de commande)

```bash
# Restaurer une sauvegarde complète
psql "postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres" \
  < backups/full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql

# Ou avec variables d'environnement
export PGPASSWORD="votre_password"
psql -h db.xxxxx.supabase.co \
     -U postgres \
     -d postgres \
     -f backups/full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql
```

### Méthode 2 : Via l'interface (à venir)

L'interface de restauration sera ajoutée dans une future version.

## 🐛 Dépannage

### Erreur : "pg_dump not found"

**Solution :**
```bash
# Vérifier l'installation
pg_dump --version

# Si non installé, installer PostgreSQL client
# Windows: choco install postgresql
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql-client
```

### Erreur : "Database credentials not found"

**Solution :**
Ajouter dans `.env.local` :
```env
SUPABASE_DB_PASSWORD=votre_mot_de_passe
```

### Erreur : "Permission denied" sur le dossier backups

**Solution :**
```bash
# Windows (PowerShell en admin)
icacls backups /grant Users:F

# Linux/macOS
chmod 755 backups
```

### Sauvegarde bloquée en "IN_PROGRESS"

**Solution :**
```sql
-- Vérifier les sauvegardes bloquées
SELECT * FROM backup_records 
WHERE status = 'IN_PROGRESS' 
AND started_at < NOW() - INTERVAL '1 hour';

-- Marquer comme échouée
UPDATE backup_records 
SET status = 'FAILED', 
    error_message = 'Timeout - manually marked as failed'
WHERE id = 'UUID_DE_LA_SAUVEGARDE';
```

## 📈 Bonnes Pratiques

### Fréquence Recommandée
- **Production** : 
  - Sauvegarde complète : 1x par jour (nuit)
  - Sauvegarde incrémentale : 4x par jour
- **Développement** :
  - Sauvegarde manuelle avant modifications importantes

### Rétention
- **Court terme** : 7 jours (quotidien)
- **Moyen terme** : 4 semaines (hebdomadaire)
- **Long terme** : 12 mois (mensuel)

### Vérification
- Vérifier l'intégrité : 1x par semaine
- Tester la restauration : 1x par mois
- Documenter les procédures de restauration

### Stockage
- Garder les backups sur un disque séparé
- Copier vers un stockage cloud (S3, Supabase Storage)
- Chiffrer les backups sensibles

## 🔗 Liens Utiles

- [Documentation PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Guide de restauration PostgreSQL](https://www.postgresql.org/docs/current/backup-dump.html)

## 📞 Support

En cas de problème :
1. Consulter les logs : `superuser_audit_logs`
2. Vérifier la table : `backup_records`
3. Consulter ce guide
4. Contacter l'équipe technique
