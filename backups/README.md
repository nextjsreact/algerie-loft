# 📦 Répertoire des Sauvegardes

Ce dossier contient les sauvegardes de la base de données créées par le système de backup superuser.

## 📁 Structure

```
backups/
├── full_2024-01-29T10-30-00-000Z_a1b2c3d4.sql      # Sauvegarde complète
├── incremental_2024-01-29T14-00-00-000Z_b2c3d4e5.sql  # Sauvegarde incrémentale
├── manual_2024-01-29T16-45-00-000Z_c3d4e5f6.sql    # Sauvegarde manuelle
└── clone-operations/                                # Opérations de clonage
```

## 🔧 Format des Fichiers

- **Nom** : `{type}_{timestamp}_{random}.sql`
- **Type** : `full`, `incremental`, `manual`
- **Format** : SQL dump créé avec `pg_dump`
- **Compression** : Optionnelle (gzip)

## 📊 Types de Sauvegardes

### 1. Sauvegarde Complète (FULL)
- Exporte toutes les tables de la base de données
- Inclut le schéma et les données
- Recommandé : quotidien

### 2. Sauvegarde Incrémentale (INCREMENTAL)
- Exporte uniquement les modifications depuis la dernière sauvegarde
- Plus rapide et moins volumineuse
- Recommandé : plusieurs fois par jour

### 3. Sauvegarde Manuelle (MANUAL)
- Déclenchée manuellement par un superuser
- Utile avant des opérations critiques
- Peut cibler des tables spécifiques

## 🔐 Sécurité

- ⚠️ **Ne jamais commiter ce dossier dans Git**
- Les fichiers contiennent des données sensibles
- Accès restreint aux superusers uniquement
- Chiffrement optionnel disponible

## 🗑️ Rétention

- **Par défaut** : 30 jours
- **Configurable** : via `system_configurations`
- **Nettoyage automatique** : des sauvegardes expirées

## 📝 Utilisation

### Créer une sauvegarde
```bash
# Via l'interface web
http://localhost:3000/fr/admin/superuser/backup

# Via l'API
POST /api/superuser/backup
{
  "action": "create",
  "type": "FULL",
  "compression": true
}
```

### Restaurer une sauvegarde
```bash
# Avec psql
psql "postgresql://user:pass@host:5432/db" < backup_file.sql

# Ou via l'interface web (à venir)
```

## 🛠️ Prérequis

- PostgreSQL client tools installés (`pg_dump`, `psql`)
- Variables d'environnement configurées :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_DB_PASSWORD` ou `DATABASE_PASSWORD`

## 📈 Monitoring

Les sauvegardes sont enregistrées dans la table `backup_records` :
- Statut en temps réel
- Taille des fichiers
- Checksums pour vérification d'intégrité
- Logs d'erreurs

## 🔍 Vérification d'Intégrité

Chaque sauvegarde inclut :
- **Checksum SHA-256** : pour détecter la corruption
- **Taille du fichier** : pour validation
- **Ratio de compression** : pour statistiques

## 📞 Support

En cas de problème :
1. Vérifier les logs dans `superuser_audit_logs`
2. Consulter la table `backup_records`
3. Vérifier que `pg_dump` est installé et accessible
4. Vérifier les permissions du dossier `backups/`
