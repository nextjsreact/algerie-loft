# 🔧 Fix : Colonnes Manquantes dans la Table Owners

## ❌ Erreur Rencontrée

```
Erreur réactivation partner: {
  code: 'P0001',
  message: 'column "rejected_at" of relation "owners" does not exist'
}
```

---

## 🔍 Cause

La table `owners` ne contient pas toutes les colonnes nécessaires pour gérer les statuts des partners :
- ❌ `rejected_at`
- ❌ `rejected_by`
- ❌ `rejection_reason`
- ❌ `approved_at`
- ❌ `approved_by`
- ❌ `admin_notes`
- ❌ `verification_status`

---

## ✅ Solution en 2 Étapes

### Étape 1 : Vérifier les Colonnes Existantes

**Exécutez dans Supabase SQL Editor :**

```sql
-- Fichier : check-owners-columns.sql
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'owners'
ORDER BY column_name;
```

---

### Étape 2 : Ajouter les Colonnes Manquantes

**Exécutez dans Supabase SQL Editor :**

```sql
-- Fichier : add-missing-owners-columns.sql
-- (Copiez tout le contenu du fichier)
```

Ou copiez-collez ce script :

```sql
-- Ajouter rejected_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE owners ADD COLUMN rejected_at TIMESTAMPTZ;
  END IF;
END $$;

-- Ajouter rejected_by
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE owners ADD COLUMN rejected_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Ajouter rejection_reason
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE owners ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Ajouter approved_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE owners ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Ajouter approved_by
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE owners ADD COLUMN approved_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Ajouter admin_notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE owners ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Ajouter verification_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE owners ADD COLUMN verification_status TEXT DEFAULT 'pending';
  END IF;
END $$;
```

**Résultat attendu :** Messages indiquant quelles colonnes ont été ajoutées

---

### Étape 3 : Recréer les Fonctions RPC

**Exécutez dans Supabase SQL Editor :**

```sql
-- Fichier : database/functions/reactivate-owner-partner.sql
-- (Copiez tout le contenu du fichier)
```

Cela va recréer les 3 fonctions :
- `reactivate_owner_partner()`
- `approve_owner_partner()`
- `reject_owner_partner()`

---

## 🧪 Vérification

### Test 1 : Vérifier les Colonnes

```sql
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'owners'
AND column_name IN (
  'verification_status',
  'approved_at',
  'approved_by',
  'rejected_at',
  'rejected_by',
  'rejection_reason',
  'admin_notes'
)
ORDER BY column_name;
```

**Résultat attendu :** 7 lignes

### Test 2 : Vérifier les Fonctions

```sql
SELECT 
  routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%owner_partner%'
ORDER BY routine_name;
```

**Résultat attendu :**
```
approve_owner_partner
reject_owner_partner
reactivate_owner_partner
```

---

## 🎯 Test Final

1. Retournez sur l'interface : `http://localhost:3000/fr/admin/partners`
2. Essayez de réactiver un partner rejeté
3. ✅ Ça devrait fonctionner !

---

## 📋 Structure Complète de la Table Owners

Après correction, la table `owners` devrait avoir :

### Colonnes de Base
- `id` (UUID, PK)
- `name` (TEXT)
- `business_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `user_id` (UUID, FK → profiles) - NULL = interne, UUID = partner

### Colonnes de Statut ⭐ (Ajoutées)
- `verification_status` (TEXT) - pending, verified, rejected, suspended
- `approved_at` (TIMESTAMPTZ)
- `approved_by` (UUID, FK → profiles)
- `rejected_at` (TIMESTAMPTZ)
- `rejected_by` (UUID, FK → profiles)
- `rejection_reason` (TEXT)
- `admin_notes` (TEXT)

### Colonnes Système
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 💡 Pourquoi Ces Colonnes Manquaient ?

Lors de la migration vers la table unifiée `owners`, ces colonnes n'ont probablement pas été créées ou ont été oubliées.

Les fonctions RPC ont été créées en supposant que ces colonnes existaient, d'où l'erreur.

---

## ✅ Checklist

- [ ] Étape 1 : Colonnes vérifiées
- [ ] Étape 2 : Colonnes manquantes ajoutées
- [ ] Étape 3 : Fonctions RPC recréées
- [ ] Test : Réactivation fonctionne

---

**Exécutez maintenant : `add-missing-owners-columns.sql`** 🚀

**Temps estimé : 2 minutes** ⏱️
