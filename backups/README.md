# Système de Backup Complet

Ce dossier contient les backups complets de la base de données et des fichiers storage.

## 📦 Créer un Backup Complet

```bash
yarn backup:complete
```

Le backup inclut:
- ✅ Dump SQL complet (toutes les tables et schémas)
- ✅ Tous les fichiers storage (photos, documents, PDFs)
- ✅ Configuration et métadonnées
- ✅ Script de restauration automatique
- ✅ Checksums pour vérification d'intégrité

Le backup sera créé dans: `backups/complete_backup_[timestamp]/`

## 🔄 Restaurer un Backup

### Option 1: Commande rapide
```bash
yarn backup:restore complete_backup_2026-02-27T14-33-45-045Z
```

### Option 2: Depuis le dossier du backup
```bash
cd backups/complete_backup_2026-02-27T14-33-45-045Z
node restore.cjs
```

La restauration:
- ✅ Restaure la base de données SQL complète
- ✅ Upload tous les fichiers storage vers Supabase
- ✅ Vérifie l'intégrité avec les checksums
- ⚠️  ATTENTION: Écrase la base de données cible!

## 🔀 Cloner vers un Autre Environnement

### Cloner vers TEST
```bash
node scripts/clone-backup-to-env.cjs complete_backup_2026-02-27T14-33-45-045Z test
```

### Cloner vers DEV
```bash
node scripts/clone-backup-to-env.cjs complete_backup_2026-02-27T14-33-45-045Z dev
```

**Prérequis:**
- Fichier `.env.test` ou `.env.dev` avec les credentials de la cible
- Variables requises:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 📋 Structure d'un Backup

```
complete_backup_2026-02-27T14-33-45-045Z/
├── database.sql          # Dump SQL complet
├── storage/              # Fichiers storage
│   ├── loft-photos/      # Photos des lofts
│   ├── documents/        # Documents
│   ├── reports/          # Rapports
│   └── backups/          # Anciens backups SQL
├── config.json           # Métadonnées du backup
├── restore.cjs           # Script de restauration
├── checksums.json        # Checksums pour vérification
└── README.md             # Instructions
```

## ⚙️ Configuration Requise

### Variables d'environnement (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Outils requis
- Node.js (v18+)
- PostgreSQL client tools (`psql`, `pg_dump`)
- Yarn package manager

## 🚨 Important

1. **Ne jamais commiter les backups dans Git**
   - Les backups contiennent des données sensibles
   - Ils sont automatiquement exclus via `.gitignore`

2. **Backups en production (Vercel)**
   - Les backups automatiques ne fonctionnent PAS sur Vercel
   - Utilisez toujours la commande en LOCAL: `yarn backup:complete`

3. **Sécurité**
   - Les backups contiennent des tokens OAuth et données sensibles
   - Stockez-les dans un endroit sécurisé
   - Ne les partagez jamais publiquement

4. **Restauration**
   - La restauration ÉCRASE la base de données cible
   - Toujours faire un backup avant de restaurer
   - Testez d'abord sur l'environnement DEV ou TEST

## 📊 Historique des Backups

Les backups sont listés dans l'interface web:
- URL: `/admin/superuser/backup`
- Affiche les 10 derniers backups
- Statut, taille, date de création
- Détails complets de chaque backup

## 🔧 Dépannage

### Erreur: "pg_dump not found"
Installez PostgreSQL client tools:
- Windows: https://www.postgresql.org/download/windows/
- Ajoutez PostgreSQL bin au PATH

### Erreur: "Database credentials not found"
Vérifiez que `SUPABASE_DB_PASSWORD` est défini dans `.env.local`

### Erreur: "SUPABASE_SERVICE_ROLE_KEY not found"
Le service role key est requis pour uploader les fichiers storage.
Ajoutez-le dans `.env.local`

### Storage files not uploading
- Vérifiez que les buckets existent dans Supabase
- Vérifiez les permissions RLS sur les buckets
- Le script crée automatiquement les buckets manquants

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs de la commande
2. Consultez la documentation Supabase
3. Vérifiez les permissions de votre compte

---

**Dernière mise à jour:** 27/02/2026
