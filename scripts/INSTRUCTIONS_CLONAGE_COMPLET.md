# 🚀 INSTRUCTIONS POUR CLONAGE COMPLET

## Problème identifié
La table `customers` (et d'autres) n'existent pas dans l'environnement DEV. Le clonage ne peut pas fonctionner sans recréer d'abord toutes les tables.

## Solution en 2 étapes

### Étape 1: Créer les tables manquantes dans DEV

1. **Aller dans Supabase Dashboard DEV**
   - Ouvrir https://supabase.com/dashboard
   - Sélectionner le projet DEV
   - Aller dans "SQL Editor"

2. **Exécuter ce SQL** (copier-coller tout) :

```sql
-- CRÉATION DES TABLES MANQUANTES DANS DEV

-- Table customers (MANQUANTE)
CREATE TABLE IF NOT EXISTS "customers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" TEXT,
  "last_name" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "status" TEXT,
  "notes" TEXT,
  "current_loft_id" UUID,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  "created_by" UUID,
  "nationality" TEXT
);

-- Table loft_photos (MANQUANTE)
CREATE TABLE IF NOT EXISTS "loft_photos" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loft_id" UUID,
  "file_name" TEXT,
  "file_path" TEXT,
  "file_size" INTEGER,
  "mime_type" TEXT,
  "url" TEXT,
  "uploaded_by" UUID,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes aux tables existantes
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "decimal_digits" INTEGER;
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE "zone_areas" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE "payment_methods" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN DEFAULT FALSE;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMPTZ;

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "amount" DECIMAL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "currency" TEXT;

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "user_id" UUID;

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message_key" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title_payload" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message_payload" TEXT;

-- Supprimer la contrainte NOT NULL sur price_per_month si elle existe
ALTER TABLE "lofts" ALTER COLUMN "price_per_month" DROP NOT NULL;
```

3. **Cliquer sur "Run"** pour exécuter le SQL

### Étape 2: Relancer le clonage

Une fois les tables créées, relancer le clonage :

```bash
npm run clone:auto-true
```

## Vérification

Pour vérifier que tout fonctionne :

```bash
npm run validate:clone-full
```

## Si ça ne marche toujours pas

Utiliser l'approche manuelle :

1. **Exporter depuis PROD** :
   - Aller dans Supabase PROD > Settings > Database
   - Faire un backup/export

2. **Importer dans DEV** :
   - Aller dans Supabase DEV > Settings > Database  
   - Restaurer le backup

## Tables qui seront clonées après correction

✅ **currencies** (4 enregistrements)
✅ **categories** (15 enregistrements)  
✅ **zone_areas** (8 enregistrements)
✅ **internet_connection_types** (5 enregistrements)
✅ **payment_methods** (4 enregistrements)
✅ **loft_owners** (10 enregistrements)
✅ **teams** (2 enregistrements)
✅ **profiles** (11 enregistrements)
✅ **lofts** (18 enregistrements)
✅ **tasks** (96 enregistrements)
✅ **transactions** (1 enregistrement)
✅ **transaction_category_references** (19 enregistrements)
✅ **settings** (2 enregistrements)
✅ **notifications** (17 enregistrements)
✅ **customers** (8 enregistrements) ← CETTE TABLE SERA CRÉÉE
✅ **loft_photos** (15 enregistrements) ← CETTE TABLE SERA CRÉÉE

**Total : ~235 enregistrements**