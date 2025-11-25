# 🔧 Guide de Résolution - Erreur RLS Annonces Urgentes

## 🔴 Problème Identifié

**Erreur:** `new row violates row-level security policy for table "urgent_announcements"`

**Cause:** Les politiques RLS (Row Level Security) bloquent l'insertion car :
- Votre profil utilisateur n'existe pas dans la table `profiles`
- OU votre profil n'a pas le rôle `admin` ou `superuser`

## ✅ Solution en 3 Étapes

### Étape 1 : Vérifier votre utilisateur actuel

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Exécutez le fichier `database/migrations/check_my_user.sql`
3. Notez votre `user_id` et vérifiez si un profil existe

### Étape 2 : Corriger les politiques RLS

1. Ouvrez le fichier `database/migrations/fix_announcements_rls_final.sql`
2. **IMPORTANT:** Remplacez `'nextjsreact@gmail.com'` par votre email réel (3 occurrences)
3. Exécutez le script dans **Supabase SQL Editor**

### Étape 3 : Vérifier que ça fonctionne

1. Rafraîchissez la page `/fr/admin/announcements`
2. Essayez de créer une nouvelle annonce
3. Si ça fonctionne ✓, le problème est résolu !

## 🔍 Diagnostic Rapide

Si le problème persiste, vérifiez :

```sql
-- Votre profil existe-t-il ?
SELECT * FROM profiles WHERE id = auth.uid();

-- Avez-vous le bon rôle ?
SELECT role FROM profiles WHERE id = auth.uid();
-- Doit retourner 'admin' ou 'superuser'

-- Les politiques sont-elles actives ?
SELECT * FROM pg_policies WHERE tablename = 'urgent_announcements';
```

## 🚨 Erreurs Secondaires (Non Bloquantes)

Les erreurs suivantes dans la console sont **normales en développement** :

- ❌ `Content Security Policy` violations pour websockets → Console Ninja
- ❌ `Failed to parse cookie string` → Supabase auth en développement
- ❌ `Slow resource` warnings → Monitoring de performance

**Ces erreurs n'empêchent PAS l'application de fonctionner.**

## 📝 Notes Importantes

1. **Email à remplacer:** Cherchez votre email dans Supabase Dashboard → Authentication → Users
2. **Rôles valides:** `admin`, `superuser`, `employee`, `partner`, `client`
3. **Test rapide:** Après correction, déconnectez-vous et reconnectez-vous

## 🎯 Résultat Attendu

Après correction, vous devriez pouvoir :
- ✅ Créer des annonces urgentes
- ✅ Modifier des annonces existantes
- ✅ Supprimer des annonces
- ✅ Voir toutes les annonces (actives et inactives)

## 🆘 Si Ça Ne Fonctionne Toujours Pas

Exécutez ce diagnostic complet :

```sql
-- Diagnostic complet
SELECT 
  'User ID' as check_type,
  auth.uid()::text as value
UNION ALL
SELECT 
  'User Email',
  auth.email()
UNION ALL
SELECT 
  'Profile Exists',
  CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
    THEN 'YES ✓' 
    ELSE 'NO ✗' 
  END
UNION ALL
SELECT 
  'User Role',
  COALESCE((SELECT role FROM profiles WHERE id = auth.uid()), 'NO PROFILE')
UNION ALL
SELECT 
  'Can Insert',
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superuser')
  ) THEN 'YES ✓' ELSE 'NO ✗' END;
```

Si "Can Insert" retourne "NO ✗", votre profil n'a pas les bonnes permissions.
