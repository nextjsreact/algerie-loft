# 🎯 ACTION IMMÉDIATE

## 📋 À Faire Maintenant

### 1️⃣ Ouvrir Supabase
https://supabase.com/dashboard → SQL Editor

### 2️⃣ Exécuter Script 1
**Fichier:** `finalize-migration.sql`

**Ou copiez ceci :**
```sql
BEGIN;
ALTER TABLE lofts DROP COLUMN IF EXISTS owner_id CASCADE;
ALTER TABLE lofts DROP COLUMN IF EXISTS partner_id CASCADE;
ALTER TABLE lofts RENAME COLUMN new_owner_id TO owner_id;
DROP TABLE IF EXISTS loft_owners CASCADE;
DROP TABLE IF EXISTS partner_profiles CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
COMMIT;
```

### 3️⃣ Exécuter Script 2
**Fichier:** `database/functions/reactivate-owner-partner.sql`

### 4️⃣ Revenir Ici
Dites-moi **"C'est fait"**

---

## ✅ Résultat Attendu

Après les 2 scripts :
- ✅ Table `owners` (unifiée)
- ✅ Table `lofts` avec `owner_id`
- ❌ Tables `loft_owners`, `partner_profiles`, `partners` supprimées
- ✅ Fonctions SQL créées

---

## 🚀 Ensuite

Je modifierai automatiquement :
- 5 API routes
- 3 composants
- 1 fichier TypeScript

Pour utiliser la table `owners` avec distinction :
- `user_id IS NOT NULL` = Partner
- `user_id IS NULL` = Propriétaire interne

---

**Prêt ? Exécutez les 2 scripts et revenez!** 🎯
