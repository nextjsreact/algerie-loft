# Migrations Airbnb - Guide d'Application

**Date:** 2026-05-17  
**Migrations:** 005 à 009  
**Objectif:** Intégration du système de scraping Airbnb Python v2.0.0

---

## 📋 Migrations Créées

| Fichier | Description | Tables Affectées |
|---------|-------------|------------------|
| `005_extend_reservations_for_airbnb.sql` | Ajoute 3 colonnes à `reservations` (source, airbnb_confirmation_code, synced_at) | `reservations` |
| `006_create_airbnb_staging.sql` | Crée table de staging pour validation | `airbnb_reservations_staging` |
| `007_add_airbnb_listing_id_to_lofts.sql` | Ajoute mapping listing_id dans lofts | `lofts` |
| `008_create_airbnb_sync_logs.sql` | Crée table de logs pour monitoring | `airbnb_sync_logs` |
| `009_create_airbnb_conflicts.sql` | Crée table de gestion des conflits | `airbnb_conflicts` |

**Note:** La table `reservations` contient déjà les champs `guest_email`, `guest_nationality`, `base_price`, `cleaning_fee`, `service_fee`, `taxes`, `special_requests`, et `currency_code`. La migration 005 ajoute seulement les 3 champs manquants.

---

## 🚀 Application des Migrations

### Option 1: Via Supabase Dashboard (Recommandé)

1. **Se connecter à Supabase**
   - Aller sur [supabase.com](https://supabase.com)
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Menu latéral → SQL Editor
   - Cliquer sur "New query"

3. **Appliquer chaque migration**
   
   **Migration 005:**
   ```sql
   -- Copier le contenu de 005_extend_reservations_for_airbnb.sql
   -- Coller dans SQL Editor
   -- Cliquer sur "Run"
   ```
   
   **Migration 006:**
   ```sql
   -- Copier le contenu de 006_create_airbnb_staging.sql
   -- Coller dans SQL Editor
   -- Cliquer sur "Run"
   ```
   
   **Migration 007:**
   ```sql
   -- Copier le contenu de 007_add_airbnb_listing_id_to_lofts.sql
   -- Coller dans SQL Editor
   -- Cliquer sur "Run"
   ```
   
   **Migration 008:**
   ```sql
   -- Copier le contenu de 008_create_airbnb_sync_logs.sql
   -- Coller dans SQL Editor
   -- Cliquer sur "Run"
   ```
   
   **Migration 009:**
   ```sql
   -- Copier le contenu de 009_create_airbnb_conflicts.sql
   -- Coller dans SQL Editor
   -- Cliquer sur "Run"
   ```

4. **Vérifier l'application**
   ```sql
   -- Vérifier les nouvelles colonnes dans reservations (4 colonnes ajoutées)
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'reservations' 
   AND column_name IN ('source', 'airbnb_confirmation_code', 'currency_code', 'synced_at');
   
   -- Note: Les colonnes suivantes existaient déjà:
   -- guest_email, guest_nationality, base_price, cleaning_fee, 
   -- service_fee, taxes, special_requests
   
   -- Vérifier les nouvelles tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'airbnb%'
   ORDER BY table_name;
   
   -- Résultat attendu:
   -- airbnb_conflicts
   -- airbnb_reservations_staging
   -- airbnb_sync_logs
   
   -- Vérifier la colonne dans lofts
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'lofts' 
   AND column_name = 'airbnb_listing_id';
   ```

### Option 2: Via Supabase CLI (Avancé)

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push

# Vérifier le statut
supabase migration list
```

---

## ✅ Vérification Post-Migration

### 1. Vérifier les Colonnes de `reservations`

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN (
  'source', 
  'airbnb_confirmation_code',
  'currency_code',
  'synced_at'
)
ORDER BY column_name;
```

**Résultat attendu:** 4 colonnes (les 7 autres existaient déjà)

### 2. Vérifier les Nouvelles Tables

```sql
-- Compter les tables Airbnb
SELECT COUNT(*) as airbnb_tables_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'airbnb%';
```

**Résultat attendu:** 3 tables

### 3. Vérifier les Indexes

```sql
-- Vérifier les indexes créés
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE tablename IN (
  'reservations', 
  'lofts', 
  'airbnb_reservations_staging', 
  'airbnb_sync_logs', 
  'airbnb_conflicts'
)
AND indexname LIKE '%airbnb%'
ORDER BY tablename, indexname;
```

**Résultat attendu:** ~15 indexes

### 4. Test d'Insertion

```sql
-- Test: Insérer une réservation Airbnb dans staging
INSERT INTO airbnb_reservations_staging (
  airbnb_id,
  listing_id,
  raw_data,
  guest_name,
  guest_count,
  check_in_date,
  check_out_date,
  nights,
  total_amount,
  currency_code,
  status,
  sync_type,
  sync_batch_id
) VALUES (
  'HMTEST123',
  '12345678',
  '{"test": true}'::jsonb,
  'John Doe',
  2,
  '2026-06-01',
  '2026-06-05',
  4,
  40000.00,
  'DZD',
  'confirmed',
  'manual',
  gen_random_uuid()
);

-- Vérifier l'insertion
SELECT * FROM airbnb_reservations_staging WHERE airbnb_id = 'HMTEST123';

-- Nettoyer le test
DELETE FROM airbnb_reservations_staging WHERE airbnb_id = 'HMTEST123';
```

---

## 🔄 Rollback (Si Nécessaire)

Si vous devez annuler les migrations:

```sql
-- Supprimer les tables créées
DROP TABLE IF EXISTS airbnb_conflicts CASCADE;
DROP TABLE IF EXISTS airbnb_sync_logs CASCADE;
DROP TABLE IF EXISTS airbnb_reservations_staging CASCADE;

-- Supprimer la colonne de lofts
ALTER TABLE lofts DROP COLUMN IF EXISTS airbnb_listing_id;

-- Supprimer les colonnes de reservations
ALTER TABLE reservations 
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS airbnb_confirmation_code,
  DROP COLUMN IF EXISTS base_price,
  DROP COLUMN IF EXISTS cleaning_fee,
  DROP COLUMN IF EXISTS service_fee,
  DROP COLUMN IF EXISTS taxes,
  DROP COLUMN IF EXISTS guest_email,
  DROP COLUMN IF EXISTS guest_nationality,
  DROP COLUMN IF EXISTS special_requests,
  DROP COLUMN IF EXISTS synced_at;
```

---

## 📊 Schéma Final

Après application des migrations, votre schéma DB contiendra:

### Tables Principales
- ✅ `reservations` (étendue avec 4 nouvelles colonnes Airbnb)
- ✅ `lofts` (étendue avec `airbnb_listing_id`)

**Note:** 7 colonnes existaient déjà dans `reservations` (guest_email, guest_nationality, base_price, cleaning_fee, service_fee, taxes, special_requests)

### Tables Airbnb
- ✅ `airbnb_reservations_staging` (validation et réconciliation)
- ✅ `airbnb_sync_logs` (monitoring)
- ✅ `airbnb_conflicts` (gestion des conflits)

### Indexes
- ✅ ~15 indexes pour performance

---

## 🎯 Prochaines Étapes

Une fois les migrations appliquées:

1. ✅ **Vérifier le schéma** (requêtes ci-dessus)
2. ➡️ **Créer l'API endpoint** (`app/api/airbnb/sync/route.ts`)
3. ➡️ **Adapter le script Python** (envoyer vers l'API)
4. ➡️ **Tester le flux complet**

---

## ❓ Troubleshooting

### Erreur: "column already exists"

Si vous obtenez cette erreur, c'est que la colonne existe déjà. Pas de problème, la migration utilise `IF NOT EXISTS`.

### Erreur: "relation already exists"

Si vous obtenez cette erreur pour une table, c'est qu'elle existe déjà. Vous pouvez:
- Ignorer l'erreur (la migration utilise `IF NOT EXISTS`)
- Ou supprimer la table et réappliquer

### Erreur: "constraint already exists"

Ignorer cette erreur, la contrainte existe déjà.

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifier les logs Supabase
2. Consulter le fichier `design.md` pour plus de détails
3. Demander à Kiro AI

---

**Migrations créées par:** Kiro AI  
**Date:** 2026-05-17  
**Version:** 1.0.0
