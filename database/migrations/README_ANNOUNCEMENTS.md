# 📁 MIGRATIONS - ANNONCES URGENTES

## 🎯 FICHIERS DANS CE DOSSIER

### ⭐ FICHIERS PRINCIPAUX (utilisez ceux-ci)

#### `test_announcements_quick.sql`
**Quoi:** Diagnostic complet automatique  
**Quand:** En premier, pour identifier le problème  
**Résultat:** Résumé avec ✅/❌ et instructions

#### `fix_announcements_policies_v2.sql`
**Quoi:** Fix complet des politiques RLS  
**Quand:** Si erreur de permissions  
**Résultat:** 5 politiques créées + diagnostics

#### `create_urgent_announcements.sql`
**Quoi:** Création de la table complète  
**Quand:** Si table n'existe pas  
**Résultat:** Table + index + politiques de base

---

### 📚 FICHIERS SECONDAIRES (anciennes versions)

#### `fix_announcements_policies.sql`
❌ Ancienne version → Utiliser `fix_announcements_policies_v2.sql`

#### `diagnose_announcements.sql`
❌ Diagnostic basique → Utiliser `test_announcements_quick.sql`

#### `diagnose_announcements_simple.sql`
❌ Diagnostic simple → Utiliser `test_announcements_quick.sql`

#### `fix_announcements_rls_final.sql`
❌ Ancienne version → Utiliser `fix_announcements_policies_v2.sql`

#### `test_insert_announcement.sql`
✅ Test manuel d'insertion (optionnel)

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

### Première installation:
```sql
-- 1. Créer la table
\i create_urgent_announcements.sql

-- 2. Fixer les politiques
\i fix_announcements_policies_v2.sql

-- 3. Tester
\i test_announcements_quick.sql
```

### Si problème existant:
```sql
-- 1. Diagnostiquer
\i test_announcements_quick.sql

-- 2. Suivre les instructions du résumé
-- (Le script vous dira quoi faire)
```

---

## 📋 GUIDE RAPIDE

### Scénario A: "Je pars de zéro"
```sql
\i create_urgent_announcements.sql
\i fix_announcements_policies_v2.sql
\i test_announcements_quick.sql
```

### Scénario B: "J'ai une erreur"
```sql
\i test_announcements_quick.sql
-- Puis suivre les instructions
```

### Scénario C: "Permissions refusées"
```sql
\i fix_announcements_policies_v2.sql
\i test_announcements_quick.sql
```

### Scénario D: "Tout réinitialiser"
```sql
DROP TABLE IF EXISTS urgent_announcements CASCADE;
\i create_urgent_announcements.sql
\i fix_announcements_policies_v2.sql
\i test_announcements_quick.sql
```

---

## 🔍 CONTENU DES FICHIERS

### `create_urgent_announcements.sql`
- Crée la table `urgent_announcements`
- Colonnes: messages (fr/en/ar), dates, couleurs, statut
- Index pour performance
- Active RLS
- Crée 4 politiques de base
- Fonction pour désactiver les annonces expirées

### `fix_announcements_policies_v2.sql`
- Supprime toutes les anciennes politiques
- Crée 5 nouvelles politiques:
  - `admins_read_all` - Admins lisent tout
  - `public_read_active` - Public lit les actives
  - `admins_insert` - Admins créent
  - `admins_update` - Admins modifient
  - `admins_delete` - Admins suppriment
- Diagnostics automatiques
- Vérification du rôle utilisateur

### `test_announcements_quick.sql`
- 7 tests automatiques:
  1. Table existe ?
  2. RLS activé ?
  3. Nombre de politiques ?
  4. Liste des politiques
  5. Votre identité
  6. Test de lecture
  7. Test d'insertion
- Résumé final avec instructions

---

## ✅ VÉRIFICATION

Après exécution, vous devriez voir:

```
✅ Table existe
✅ RLS activé
✅ Politiques: 5 ✅
✅ Votre rôle: admin
✅ Peut lire: ✅
✅ TEST INSERTION: RÉUSSI
🎉 TOUT EST OK! Vous pouvez créer des annonces.
```

---

## 🆘 PROBLÈMES COURANTS

### "Permission denied to create table"
**Cause:** Pas les droits de création  
**Solution:** Exécutez en tant que propriétaire de la base

### "Role 'authenticated' does not exist"
**Cause:** Supabase pas correctement configuré  
**Solution:** Vérifiez votre projet Supabase

### "Function auth.uid() does not exist"
**Cause:** Extensions Supabase manquantes  
**Solution:** Réinstallez les extensions Supabase

### "Syntax error near..."
**Cause:** Copier-coller incomplet  
**Solution:** Utilisez `\i` pour exécuter le fichier entier

---

## 📞 AIDE

Pour plus d'informations:
- Guide rapide: `../../DEBUG_ANNONCES_RAPIDE.md`
- Guide complet: `../../DEBUG_ANNONCES_GUIDE.md`
- Index: `../../INDEX_DEBUG_ANNONCES.md`
- Fix immédiat: `../../FIX_ANNONCES_MAINTENANT.md`

---

## 🎯 RÉSUMÉ EN 1 LIGNE

**Nouveau projet:** `create_urgent_announcements.sql` → `fix_announcements_policies_v2.sql` → `test_announcements_quick.sql`

**Problème existant:** `test_announcements_quick.sql` → Suivre les instructions
