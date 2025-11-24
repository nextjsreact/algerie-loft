# ⚡ Fix Rapide : Erreur "relation does not exist"

## 🎯 Problème

Vous voyez cette erreur :
```
Error saving announcement: relation "urgent_announcements" does not exist
```

## ✅ Solution (2 minutes)

### 1. Ouvrir Supabase

Allez sur : https://supabase.com/dashboard

### 2. SQL Editor

1. Sélectionnez votre projet
2. Cliquez sur **"SQL Editor"** (menu gauche)
3. Cliquez sur **"New query"**

### 3. Copier le SQL

Ouvrez ce fichier dans votre projet :
```
database/migrations/create_urgent_announcements.sql
```

**Copiez TOUT** (Ctrl+A puis Ctrl+C)

### 4. Exécuter

1. **Collez** dans Supabase SQL Editor
2. **Cliquez** sur "Run" (ou F5)
3. **Attendez** le message "Success"

### 5. Tester

1. Retournez sur `/admin/announcements`
2. Créez une nouvelle annonce
3. Ça devrait fonctionner ! ✨

---

## 🔍 Vérification rapide

Dans Supabase SQL Editor, exécutez :

```sql
SELECT COUNT(*) FROM urgent_announcements;
```

Si ça retourne `0` → ✅ Table créée !

Si erreur → ❌ Recommencez l'étape 3

---

## 🆘 Toujours une erreur ?

### Erreur de permission

Si vous voyez "permission denied" :

```sql
-- Vérifiez votre rôle
SELECT role FROM profiles WHERE id = auth.uid();

-- Changez-le en admin
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
```

### Autre erreur

Consultez : `INSTALLATION_ANNONCES.md` (guide complet)

---

## 📞 Résumé

1. ✅ Supabase → SQL Editor
2. ✅ Copier `create_urgent_announcements.sql`
3. ✅ Coller et Run
4. ✅ Tester sur `/admin/announcements`

**Temps estimé : 2 minutes** ⏱️
