# ⚡ SOLUTION RAPIDE : Interface Partners Vide

## 🎯 3 Étapes - 5 Minutes

---

## ✅ Étape 1 : Exécuter le Script SQL

### Ouvrez Supabase SQL Editor

### Copiez-Collez ce Script :

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Admin can view all owners" ON owners;
DROP POLICY IF EXISTS "Admin can update all owners" ON owners;
DROP POLICY IF EXISTS "Admin can insert owners" ON owners;
DROP POLICY IF EXISTS "Admin can delete owners" ON owners;
DROP POLICY IF EXISTS "Partners can view own data" ON owners;
DROP POLICY IF EXISTS "Partners can update own data" ON owners;

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

-- Policy 3 : Admin peut INSÉRER
CREATE POLICY "Admin can insert owners"
ON owners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'superuser')
  )
);

-- Policy 4 : Partners peuvent VOIR leurs données
CREATE POLICY "Partners can view own data"
ON owners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 5 : Partners peuvent MODIFIER leurs données
CREATE POLICY "Partners can update own data"
ON owners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Activer RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
```

### Cliquez sur "Run" ▶️

✅ **Résultat attendu :** "Success. No rows returned"

---

## ✅ Étape 2 : Vérifier Votre Rôle

### Dans Supabase SQL Editor :

```sql
-- Remplacez par votre email
SELECT email, role FROM profiles WHERE email = 'VOTRE_EMAIL@example.com';
```

### Si le rôle n'est pas "admin" :

```sql
-- Remplacez par votre email
UPDATE profiles SET role = 'admin' WHERE email = 'VOTRE_EMAIL@example.com';
```

✅ **Résultat :** Vous êtes admin

---

## ✅ Étape 3 : Redémarrer

### Dans votre terminal :

**PowerShell :**
```powershell
# Arrêter le serveur (Ctrl+C)

# Supprimer le cache
Remove-Item -Recurse -Force .next

# Redémarrer
npm run dev
```

**CMD :**
```cmd
# Arrêter le serveur (Ctrl+C)

# Supprimer le cache
rmdir /s /q .next

# Redémarrer
npm run dev
```

### Ou utilisez le script automatique :

```bash
fix-partners-interface.bat
```

✅ **Résultat :** Serveur redémarré

---

## 🧪 TEST FINAL

### Ouvrez dans le navigateur :

```
http://localhost:3000/fr/admin/partners
```

### Vous devriez voir vos 3 partners ! 🎉

---

## ❌ Si Ça Ne Fonctionne Toujours Pas

### Test 1 : Vérifier l'API

Ouvrez :
```
http://localhost:3000/api/admin/partners
```

**Vous devriez voir un JSON avec les 3 partners.**

### Test 2 : Console du Navigateur

1. Ouvrez `/fr/admin/partners`
2. Appuyez sur **F12**
3. Allez dans **Console**
4. Copiez les erreurs et envoyez-les moi

### Test 3 : Test Server-Side

```bash
npx tsx test-partners-server-side.ts
```

Envoyez-moi toute la sortie.

---

## 📝 Checklist

- [ ] Script SQL exécuté sans erreur
- [ ] Je suis admin
- [ ] Serveur redémarré
- [ ] Interface affiche les 3 partners

---

## 💡 Note sur l'Erreur SQL

Si vous aviez l'erreur `missing FROM-clause entry for table "old"`, c'est corrigé dans ce script.

Le problème venait d'une référence à `OLD.verification_status` qui n'est pas supportée dans les policies RLS.

---

## 📁 Fichiers Utiles

- `fix-owners-rls-simple.sql` - Script SQL complet (sans erreur)
- `test-partners-api-direct.html` - Test de l'API
- `test-partners-server-side.ts` - Test server-side
- `fix-partners-interface.bat` - Redémarrage automatique

---

**COMMENCEZ MAINTENANT !** 🚀

**Temps estimé : 5 minutes** ⏱️
