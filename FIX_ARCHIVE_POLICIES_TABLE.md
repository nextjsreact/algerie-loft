# 🔧 Fix Archive Policies Table

## Problème
```
Error: column archive_policies.archived_count does not exist
```

## Solution Rapide

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez et exécutez le contenu de : `database/migrations/add-archive-policies-columns.sql`
5. Cliquez sur **Run**

### Option 2 : Via psql

```bash
psql -U postgres -d votre_base -f database/migrations/add-archive-policies-columns.sql
```

### Option 3 : Exécution manuelle SQL

Copiez et exécutez ce SQL dans votre éditeur SQL :

```sql
-- Add archived_count column
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS archived_count INTEGER DEFAULT 0;

-- Add archived_size_mb column
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS archived_size_mb NUMERIC(10, 2) DEFAULT 0;

-- Add last_run column
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS last_run TIMESTAMPTZ;

-- Add next_run column
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS next_run TIMESTAMPTZ;

-- Add updated_at column
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_archive_policies_enabled ON archive_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_archive_policies_next_run ON archive_policies(next_run) WHERE enabled = true;
```

## Vérification

Après l'exécution, vérifiez que les colonnes existent :

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'archive_policies'
ORDER BY ordinal_position;
```

Vous devriez voir :
- `id`
- `table_name`
- `enabled`
- `retention_days`
- `frequency`
- `created_at`
- `last_run` ✅
- `next_run` ✅
- `archived_count` ✅
- `archived_size_mb` ✅
- `updated_at` ✅

## Test

Après la migration, testez la page :
```
http://localhost:3000/fr/admin/superuser/archives
```

L'erreur devrait disparaître ! ✅
