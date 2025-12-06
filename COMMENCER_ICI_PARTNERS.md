# 🎯 COMMENCER ICI : Interface Partners Vide

## ⚡ Solution Rapide (5 minutes)

---

## 📋 Étape 1 : Corriger les Permissions

### Ouvrez Supabase SQL Editor

### Option A : Copier le fichier complet

**Ouvrez le fichier :** `fix-owners-rls-simple.sql`

**Copiez tout le contenu** et collez-le dans Supabase SQL Editor

### Option B : Copier-Coller ce Script :

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Admin can view all owners" ON owners;
DROP POLICY IF EXISTS "Admin can update all owners" ON owners;
DROP POLICY IF EXISTS "Admin can insert owners" ON owners;
DROP POLICY IF EXISTS "Admin can delete owners" ON owners;
DROP POLICY IF EXISTS "Partners can view own data" ON owners;
DROP POLICY IF EXISTS "Partners can update own data" ON owners;

-- Créer la policy pour VOIR les données
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

-- Créer la policy pour MODIFIER les données
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

### Cliquez sur "Run" ▶️

✅ **Résultat :** "Success. No rows returned"

---

## 📋 Étape 2 : Vérifier Votre Rôle

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

## 📋 Étape 3 : Redémarrer le Serveur

### Option A : Script Automatique

```bash
fix-partners-interface.bat
```

### Option B : Manuel

**PowerShell :**
```powershell
# 1. Arrêter le serveur (Ctrl+C)

# 2. Supprimer le cache
Remove-Item -Recurse -Force .next

# 3. Redémarrer
npm run dev
```

**CMD :**
```cmd
# 1. Arrêter le serveur (Ctrl+C)

# 2. Supprimer le cache
rmdir /s /q .next

# 3. Redémarrer
npm run dev
```

✅ **Résultat :** Serveur redémarré

---

## 🧪 Étape 4 : Tester

### Ouvrez dans le navigateur :

```
http://localhost:3000/fr/admin/partners
```

### Vous devriez voir :

```
┌─────────────────────────────────────┐
│  Gestion des Partenaires           │
├─────────────────────────────────────┤
│  En attente: X                      │
│  Vérifiés: X                        │
│  Rejetés: X                         │
│                                     │
│  ┌──────────┐ ┌──────────┐         │
│  │ Partner 1│ │ Partner 2│ ...     │
│  └──────────┘ └──────────┘         │
└─────────────────────────────────────┘
```

✅ **Résultat :** 3 partners affichés !

---

## ❌ Si Ça Ne Fonctionne Pas

### Test 1 : Vérifier l'API

Ouvrez :
```
http://localhost:3000/api/admin/partners
```

**Vous devriez voir un JSON avec les 3 partners.**

### Test 2 : Voir les Erreurs

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

## 📁 Autres Fichiers Utiles

Si vous voulez plus de détails :

- `ACTION_PARTNERS_VIDE.md` - Guide simple
- `INTERFACE_PARTNERS_VIDE_SOLUTION.md` - Guide détaillé
- `DEBUG_PARTNERS_INTERFACE_VIDE.md` - Debug complet
- `fix-owners-rls-policies.sql` - Script SQL complet

---

## ✅ Checklist

- [ ] Étape 1 : Script SQL exécuté
- [ ] Étape 2 : Je suis admin
- [ ] Étape 3 : Serveur redémarré
- [ ] Étape 4 : Interface fonctionne !

---

## 💡 Pourquoi C'Est Vide ?

**Problème :** Supabase utilise RLS (Row Level Security) pour protéger les données.

**Solution :** Le script SQL crée les permissions pour que les admins puissent voir les partners.

---

## 🚀 COMMENCEZ MAINTENANT !

**Étape 1 → Ouvrez Supabase SQL Editor**

**Temps estimé : 5 minutes** ⏱️

---

**Questions ? Envoyez-moi les résultats de chaque étape !** 💬
