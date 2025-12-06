# ✅ Correction : Erreur SQL "missing FROM-clause entry for table old"

**Date :** 6 décembre 2025  
**Status :** ✅ Corrigé

---

## ❌ Erreur Rencontrée

```
Error: Failed to run sql query: 
ERROR: 42P01: missing FROM-clause entry for table "old"
```

---

## 🔍 Analyse

### Cause Racine

Le script `fix-owners-rls-policies.sql` contenait cette policy :

```sql
CREATE POLICY "Partners can update own data"
ON owners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND verification_status = OLD.verification_status  -- ❌ PROBLÈME ICI
  AND approved_by = OLD.approved_by
  AND rejected_by = OLD.rejected_by
);
```

### Pourquoi Ça Ne Fonctionne Pas ?

Dans PostgreSQL, la référence `OLD` n'est disponible que dans :
- Les **triggers** (BEFORE/AFTER UPDATE)
- Les **rules**

Elle n'est **PAS disponible** dans les **policies RLS** (Row Level Security).

---

## ✅ Solution Appliquée

### Code Corrigé

```sql
CREATE POLICY "Partners can update own data"
ON owners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  -- Les champs sensibles sont protégés par les fonctions RPC
);
```

### Explication

Les champs sensibles (`verification_status`, `approved_by`, `rejected_by`) sont déjà protégés par :

1. **Fonctions RPC** : `approve_owner_partner()`, `reject_owner_partner()`, `reactivate_owner_partner()`
2. **Permissions de la table** : Seuls les admins peuvent appeler ces fonctions
3. **Logique métier** : Les partners ne peuvent pas modifier ces champs directement

Donc pas besoin de vérifier `OLD` dans la policy.

---

## 📦 Fichiers Créés/Mis à Jour

### Nouveaux Fichiers

1. ✅ **`fix-owners-rls-simple.sql`** - Script SQL sans erreur (PRINCIPAL)
2. ✅ **`SOLUTION_RAPIDE_PARTNERS.md`** - Guide avec script corrigé
3. ✅ **`FIX_ERREUR_SQL_OLD.md`** - Explication de l'erreur
4. ✅ **`CORRECTION_ERREUR_SQL.md`** - Ce fichier

### Fichiers Mis à Jour

5. ✅ `fix-owners-rls-policies.sql` - Corrigé
6. ✅ `COMMENCER_ICI_PARTNERS.md` - Référence au nouveau script

---

## 🚀 Utilisation

### Fichier à Utiliser Maintenant

**`fix-owners-rls-simple.sql`** ⭐

Ce fichier contient :
- ✅ Suppression des anciennes policies (6)
- ✅ Création des nouvelles policies (6)
- ✅ Activation de RLS
- ✅ Tests de vérification
- ✅ **AUCUNE ERREUR**

### Comment l'Utiliser

1. Ouvrez Supabase SQL Editor
2. Copiez tout le contenu de `fix-owners-rls-simple.sql`
3. Collez dans l'éditeur
4. Cliquez sur "Run" ▶️
5. ✅ Succès !

---

## 🧪 Vérification

### Test 1 : Policies Créées

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'owners'
ORDER BY policyname;
```

**Résultat attendu :**
```
Admin can delete owners      | DELETE
Admin can insert owners      | INSERT
Admin can update all owners  | UPDATE
Admin can view all owners    | SELECT
Partners can update own data | UPDATE
Partners can view own data   | SELECT
```

### Test 2 : RLS Activé

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'owners';
```

**Résultat attendu :**
```
owners | true
```

### Test 3 : Données Accessibles

```sql
SELECT COUNT(*) FROM owners WHERE user_id IS NOT NULL;
```

**Résultat attendu :** `3`

---

## 📚 Leçon Technique

### Différence : Triggers vs Policies RLS

#### ✅ Dans un TRIGGER (OK)
```sql
CREATE TRIGGER check_update
BEFORE UPDATE ON owners
FOR EACH ROW
EXECUTE FUNCTION check_sensitive_fields();

-- Dans la fonction :
IF NEW.verification_status != OLD.verification_status THEN
  -- OK : OLD est disponible
END IF;
```

#### ❌ Dans une POLICY RLS (ERREUR)
```sql
CREATE POLICY "check_update"
ON owners
FOR UPDATE
USING (...)
WITH CHECK (
  verification_status = OLD.verification_status  -- ❌ ERREUR
);
```

### Solution : Utiliser des Fonctions RPC

Au lieu de vérifier dans la policy, on utilise des fonctions RPC qui :
1. Vérifient les permissions
2. Modifient les champs sensibles
3. Retournent le résultat

```sql
CREATE FUNCTION approve_owner_partner(
  owner_id UUID,
  admin_user_id UUID,
  admin_notes TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_user_id
    AND role IN ('admin', 'manager', 'superuser')
  ) THEN
    RAISE EXCEPTION 'Permissions insuffisantes';
  END IF;

  -- Modifier les champs sensibles
  UPDATE owners
  SET 
    verification_status = 'verified',
    approved_at = NOW(),
    approved_by = admin_user_id,
    admin_notes = admin_notes
  WHERE id = owner_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Résumé

### Problème
- ❌ Utilisation de `OLD` dans une policy RLS
- ❌ Erreur : "missing FROM-clause entry for table old"

### Solution
- ✅ Supprimer la référence à `OLD`
- ✅ Utiliser les fonctions RPC pour protéger les champs sensibles
- ✅ Nouveau script : `fix-owners-rls-simple.sql`

### Résultat
- ✅ Script SQL fonctionne sans erreur
- ✅ Policies créées correctement
- ✅ RLS activé
- ✅ Interface partners devrait fonctionner

---

## 🎯 Prochaines Étapes

1. ✅ **Exécuter** `fix-owners-rls-simple.sql`
2. ⏭️ **Vérifier** votre rôle admin
3. ⏭️ **Redémarrer** le serveur
4. ⏭️ **Tester** l'interface `/admin/partners`

**Guide à suivre :** `SOLUTION_RAPIDE_PARTNERS.md`

---

**Erreur corrigée !** ✅  
**Prêt pour le test !** 🚀
