# 🔧 Dépannage : Annonces Urgentes

## 🎯 La table existe mais j'ai toujours une erreur

Si la table `urgent_announcements` existe mais vous avez une erreur, suivez ce guide.

---

## 📊 Étape 1 : Diagnostic

### Exécuter le script de diagnostic

1. Allez sur **Supabase → SQL Editor**
2. Copiez le contenu de `database/migrations/diagnose_announcements.sql`
3. Collez et cliquez sur **"Run"**

Le script va vérifier :
- ✅ Table existe
- ✅ RLS activé
- ✅ Politiques créées
- ✅ Votre profil existe
- ✅ Votre rôle est correct

---

## 🔍 Problèmes courants

### Problème 1 : Rôle insuffisant

**Symptôme :**
```
Error: new row violates row-level security policy
```

**Diagnostic :**
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

**Si le résultat est :**
- `NULL` → Rôle non défini
- `'client'` → Rôle insuffisant
- `'partner'` → Rôle insuffisant
- `'employee'` → Rôle insuffisant

**Solution :**
```sql
-- Changez votre rôle en admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();
```

---

### Problème 2 : Politiques manquantes

**Symptôme :**
```
Error: permission denied for table urgent_announcements
```

**Diagnostic :**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'urgent_announcements';
```

**Si le résultat est `0` :**

**Solution :**
1. Ouvrez `database/migrations/fix_announcements_policies.sql`
2. Copiez tout le contenu
3. Exécutez dans Supabase SQL Editor

---

### Problème 3 : Profil manquant

**Symptôme :**
```
Error: null value in column "created_by"
```

**Diagnostic :**
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

**Si aucun résultat :**

**Solution :**
```sql
-- Créez votre profil
INSERT INTO profiles (id, email, role)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'admin'
);
```

---

### Problème 4 : RLS trop restrictif

**Symptôme :**
L'annonce se crée mais ne s'affiche pas dans la liste

**Solution :**
```sql
-- Politique pour voir TOUTES les annonces (pas seulement actives)
-- Pour les admins dans l'interface d'administration
DROP POLICY IF EXISTS "Admins can view all announcements" ON urgent_announcements;

CREATE POLICY "Admins can view all announcements"
  ON urgent_announcements
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'superuser')
    )
  );
```

---

## 🚀 Solution Rapide (Tout réinitialiser)

Si rien ne fonctionne, réinitialisez tout :

```sql
-- 1. Supprimer toutes les politiques
DROP POLICY IF EXISTS "Anyone can view active announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can create announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can update announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admin and superuser can delete announcements" ON urgent_announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON urgent_announcements;

-- 2. Désactiver temporairement RLS (pour tester)
ALTER TABLE urgent_announcements DISABLE ROW LEVEL SECURITY;

-- 3. Tester la création d'une annonce
-- Si ça fonctionne, le problème vient des politiques

-- 4. Réactiver RLS
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;

-- 5. Créer des politiques simples
CREATE POLICY "Allow all for admins"
  ON urgent_announcements
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'superuser')
    )
  );

CREATE POLICY "Public can view active"
  ON urgent_announcements
  FOR SELECT
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );
```

---

## ✅ Vérification finale

Après avoir appliqué les corrections :

### Test 1 : Vérifier votre rôle
```sql
SELECT 
  email,
  role,
  CASE 
    WHEN role IN ('admin', 'superuser') THEN '✅ OK'
    ELSE '❌ Changez en admin'
  END as status
FROM profiles
WHERE id = auth.uid();
```

### Test 2 : Vérifier les politiques
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'urgent_announcements';
```

Vous devriez voir au moins 4 politiques (SELECT, INSERT, UPDATE, DELETE)

### Test 3 : Tester l'insertion
```sql
INSERT INTO urgent_announcements (
  message_fr,
  message_en,
  message_ar,
  start_date,
  end_date
) VALUES (
  'Test FR',
  'Test EN',
  'Test AR',
  NOW(),
  NOW() + INTERVAL '1 day'
);
```

Si ça fonctionne → ✅ Problème résolu !

---

## 🆘 Toujours bloqué ?

### Vérifiez ces points :

1. **Vous êtes bien connecté ?**
   ```sql
   SELECT auth.uid(); -- Ne doit pas être NULL
   ```

2. **Votre session est valide ?**
   - Déconnectez-vous et reconnectez-vous
   - Videz le cache du navigateur

3. **La table profiles existe ?**
   ```sql
   SELECT * FROM profiles LIMIT 1;
   ```

4. **Vous utilisez le bon projet Supabase ?**
   - Vérifiez l'URL dans `.env`
   - Vérifiez que vous êtes sur le bon projet dans le dashboard

---

## 📋 Checklist de dépannage

- [ ] Table `urgent_announcements` existe
- [ ] RLS est activé
- [ ] Au moins 4 politiques existent
- [ ] Votre profil existe dans `profiles`
- [ ] Votre rôle est `admin` ou `superuser`
- [ ] Vous êtes connecté (auth.uid() n'est pas NULL)
- [ ] Les variables d'environnement sont correctes

---

## 💡 Astuce : Mode Debug

Pour déboguer, désactivez temporairement RLS :

```sql
-- ⚠️ ATTENTION : À utiliser UNIQUEMENT en développement
ALTER TABLE urgent_announcements DISABLE ROW LEVEL SECURITY;

-- Testez votre application

-- Puis réactivez
ALTER TABLE urgent_announcements ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Scripts disponibles

| Script | Usage |
|--------|-------|
| `diagnose_announcements.sql` | Identifier le problème |
| `fix_announcements_policies.sql` | Corriger les politiques |
| `create_urgent_announcements.sql` | Créer la table (si manquante) |

---

## ✨ Après la correction

Une fois le problème résolu :
1. Rechargez `/admin/announcements`
2. Créez une annonce de test
3. Vérifiez qu'elle apparaît sur la page d'accueil

Tout devrait fonctionner ! 🎉
