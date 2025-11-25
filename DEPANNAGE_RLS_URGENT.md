# 🚨 Dépannage Urgent - Erreur RLS Annonces

## ✅ Statut Actuel

**Utilisateur détecté:** `6284d376-bcd2-454e-b57b-0a35474e223e`  
**Rôle détecté:** `superuser`  
**Problème:** Les politiques RLS bloquent toujours l'insertion

## 🔧 Solution en 3 Étapes

### Étape 1 : Exécuter le script de correction

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Exécutez le fichier `database/migrations/fix_rls_superuser.sql`
3. Vérifiez que tous les tests à la fin retournent "YES ✓"

### Étape 2 : Tester l'insertion directe

1. Exécutez le fichier `database/migrations/test_insert_announcement.sql`
2. Si ça fonctionne ✓, le problème vient du client JavaScript
3. Si ça échoue ✗, il y a un problème avec les politiques RLS

### Étape 3 : Rafraîchir l'application

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous**
3. Essayez de créer une annonce

## 🔍 Diagnostic Rapide

Si le problème persiste après ces étapes :

```sql
-- Vérifier que votre profil existe
SELECT * FROM profiles WHERE id = '6284d376-bcd2-454e-b57b-0a35474e223e';

-- Doit retourner une ligne avec role = 'superuser'
```

## 🎯 Causes Possibles

1. **Cache de session Supabase** - La session côté client n'est pas à jour
2. **Politiques RLS mal configurées** - Les politiques ne reconnaissent pas le rôle
3. **Profil manquant** - Le profil n'existe pas dans la table `profiles`

## 💡 Solution Alternative (Si rien ne fonctionne)

Désactiver temporairement RLS pour tester :

```sql
-- ⚠️ ATTENTION : À utiliser UNIQUEMENT en développement
ALTER TABLE urgent_announcements DISABLE ROW LEVEL SECURITY;

-- Tester l'insertion depuis l'application

-- Réactiver RLS après le test
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;
```

## 📝 Vérifications Post-Correction

Après avoir exécuté les scripts, vérifiez :

- [ ] Le profil existe avec `role = 'superuser'`
- [ ] Les politiques RLS sont actives
- [ ] L'insertion directe en SQL fonctionne
- [ ] L'insertion depuis l'application fonctionne

## 🆘 Si Ça Ne Fonctionne Toujours Pas

Exécutez ce diagnostic complet et partagez le résultat :

```sql
-- Diagnostic complet
SELECT 'User ID' as check_type, auth.uid()::text as value
UNION ALL SELECT 'User Email', auth.email()
UNION ALL SELECT 'Profile Exists', 
  CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
    THEN 'YES ✓' ELSE 'NO ✗' END
UNION ALL SELECT 'User Role',
  COALESCE((SELECT role::text FROM profiles WHERE id = auth.uid()), 'NO PROFILE')
UNION ALL SELECT 'RLS Enabled',
  CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'urgent_announcements')
    THEN 'YES ✓' ELSE 'NO ✗' END
UNION ALL SELECT 'Policies Count',
  (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'urgent_announcements')
UNION ALL SELECT 'Can Insert (Test)',
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superuser')
  ) THEN 'YES ✓' ELSE 'NO ✗' END;
```

## 🎉 Résultat Attendu

Après correction, vous devriez voir dans les logs :

```
✅ Announcement created successfully
```

Au lieu de :

```
❌ Error: new row violates row-level security policy
```
