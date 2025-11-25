# ⚡ FIX ANNONCES - SOLUTION IMMÉDIATE

## 🎯 3 COMMANDES, 2 MINUTES

### ÉTAPE 1: Diagnostic (30 secondes)
```sql
-- Copiez-collez dans Supabase SQL Editor:
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'urgent_announcements')
    THEN '✅ Table OK' ELSE '❌ Table manquante' END as table_status,
  CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'urgent_announcements') >= 5
    THEN '✅ Politiques OK' ELSE '❌ Politiques manquantes' END as policies_status,
  CASE WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superuser')
    THEN '✅ Rôle OK' ELSE '❌ Rôle insuffisant' END as role_status;
```

### ÉTAPE 2: Fix (1 minute)

#### Si "Table manquante" ❌
```sql
-- Exécutez le contenu de:
database/migrations/create_urgent_announcements.sql
```

#### Si "Politiques manquantes" ❌
```sql
-- Exécutez le contenu de:
database/migrations/fix_announcements_policies_v2.sql
```

#### Si "Rôle insuffisant" ❌
```sql
-- Remplacez YOUR_EMAIL:
UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
```

### ÉTAPE 3: Test (30 secondes)
1. Videz le cache: `Ctrl+Shift+Del` → Tout supprimer
2. Reconnectez-vous
3. Allez sur `/admin/announcements`
4. Créez une annonce

---

## ✅ C'EST TOUT !

Si ça ne marche pas → `DEBUG_ANNONCES_RAPIDE.md`

---

## 🔥 ULTRA-RAPIDE (copier-coller)

```sql
-- 1. Vérifier
SELECT 
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'urgent_announcements') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'urgent_announcements') as policy_count,
  (SELECT role FROM profiles WHERE id = auth.uid()) as your_role;

-- 2. Si besoin, forcer admin
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();

-- 3. Tester
SELECT COUNT(*) FROM urgent_announcements;
```

Puis dans le navigateur:
```javascript
// Console (F12):
localStorage.clear(); location.reload();
```

---

## 📞 AIDE

Ça ne marche toujours pas ?

1. **Exécutez:** `database/migrations/test_announcements_quick.sql`
2. **Lisez:** Le résumé à la fin
3. **Suivez:** Les instructions données

Ou consultez: `INDEX_DEBUG_ANNONCES.md` pour tous les fichiers disponibles.
