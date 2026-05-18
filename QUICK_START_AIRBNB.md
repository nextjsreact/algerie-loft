# 🚀 Quick Start - Intégration Airbnb

## ⚡ 3 Étapes pour Démarrer (30 min)

### 1️⃣ Appliquer les Migrations SQL (15 min)

```bash
# Ouvrir Supabase Dashboard
https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk

# SQL Editor → Exécuter dans l'ordre :
supabase/migrations/005_extend_reservations_for_airbnb.sql
supabase/migrations/006_create_airbnb_staging.sql
supabase/migrations/007_add_airbnb_listing_id_to_lofts.sql
supabase/migrations/008_create_airbnb_sync_logs.sql
supabase/migrations/009_create_airbnb_conflicts.sql

# Vérifier
supabase/migrations/check_airbnb_tables.sql
```

### 2️⃣ Tester l'API (10 min)

```powershell
# Terminal 1
npm run dev

# Terminal 2
.\test-airbnb-sync.ps1
```

**Résultat attendu :** Warning "Listing ID not mapped" (normal)

### 3️⃣ Configurer 1 Loft de Test (5 min)

```sql
-- Dans Supabase SQL Editor
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE name = 'Votre Loft de Test';
```

Puis relancer : `.\test-airbnb-sync.ps1`

**Résultat attendu :** ✓ 1 réservation créée

---

## 🔑 Informations Clés

| Item | Valeur |
|------|--------|
| **API Key** | `NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=` |
| **API URL (local)** | `http://localhost:3000/api/airbnb/sync` |
| **Supabase DEV** | https://zlpzuyctjhajdwlxzdzk.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk |

---

## 📚 Documentation Complète

- **Guide détaillé :** `AIRBNB_INTEGRATION_NEXT_STEPS.md`
- **Configuration :** `CONFIGURATION_COMPLETE.md`
- **API Docs :** `app/api/airbnb/sync/README.md`
- **Spec complète :** `.kiro/specs/airbnb-python-scraper-integration/`

---

## 🆘 Problème ?

```sql
-- Vérifier les logs
SELECT * FROM airbnb_sync_logs ORDER BY started_at DESC LIMIT 5;

-- Vérifier les tables
-- Exécuter : supabase/migrations/check_airbnb_tables.sql
```

**Troubleshooting complet :** Voir `AIRBNB_INTEGRATION_NEXT_STEPS.md`
