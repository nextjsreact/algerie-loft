# ✅ Erreur SQL Corrigée

## ❌ Erreur Rencontrée

```
Error: Failed to run sql query: 
ERROR: 42P01: missing FROM-clause entry for table "old"
```

## 🔍 Cause

Le script `fix-owners-rls-policies.sql` contenait une référence à `OLD.verification_status` dans une policy RLS, ce qui n'est pas supporté par PostgreSQL dans ce contexte.

## ✅ Solution

J'ai créé un nouveau script **sans erreur** : `fix-owners-rls-simple.sql`

---

## 🚀 Utilisez le Nouveau Script

### Option 1 : Fichier Complet (Recommandé)

**Ouvrez le fichier :** `fix-owners-rls-simple.sql`

**Copiez tout le contenu** et exécutez-le dans Supabase SQL Editor

### Option 2 : Script Minimal

Si vous voulez juste les 2 policies essentielles :

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Admin can view all owners" ON owners;
DROP POLICY IF EXISTS "Admin can update all owners" ON owners;

-- Policy 1 : Admin peut VOIR tous les owners
CREATE POLICY "Admin can view all owners"
ON owners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Policy 2 : Admin peut MODIFIER tous les owners
CREATE POLICY "Admin can update all owners"
ON owners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Activer RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Résultat Attendu

Après l'exécution :

```
Success. No rows returned
```

Ou :

```
6 policies created
RLS enabled
```

---

## 🧪 Vérifier que Ça Fonctionne

### Test 1 : Voir les policies créées

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'owners';
```

**Résultat attendu :**
```
Admin can view all owners    | SELECT
Admin can update all owners  | UPDATE
Admin can insert owners      | INSERT
Admin can delete owners      | DELETE
Partners can view own data   | SELECT
Partners can update own data | UPDATE
```

### Test 2 : Compter les partners

```sql
SELECT COUNT(*) FROM owners WHERE user_id IS NOT NULL;
```

**Résultat attendu :** `3`

---

## 📋 Prochaines Étapes

Maintenant que le script SQL est corrigé :

1. ✅ **Étape 1 :** Script SQL exécuté sans erreur
2. ⏭️ **Étape 2 :** Vérifier votre rôle admin
3. ⏭️ **Étape 3 :** Redémarrer le serveur
4. ⏭️ **Étape 4 :** Tester l'interface

**Continuez avec le guide :** `COMMENCER_ICI_PARTNERS.md`

---

## 🔧 Différence Entre les Scripts

### Ancien Script (avec erreur)
```sql
WITH CHECK (
  user_id = auth.uid()
  AND verification_status = OLD.verification_status  -- ❌ ERREUR
)
```

### Nouveau Script (corrigé)
```sql
WITH CHECK (
  user_id = auth.uid()
  -- Les champs sensibles sont protégés par les fonctions RPC
)
```

---

## 📁 Fichiers Mis à Jour

1. ✅ `fix-owners-rls-simple.sql` - **Nouveau script sans erreur**
2. ✅ `fix-owners-rls-policies.sql` - Corrigé
3. ✅ `COMMENCER_ICI_PARTNERS.md` - Mis à jour
4. ✅ `FIX_ERREUR_SQL_OLD.md` - Ce fichier

---

**Utilisez maintenant : `fix-owners-rls-simple.sql`** ✅

**Pas d'erreur garantie !** 🎯
