# 🔍 Debug : Interface Partners Vide

## 📊 Situation

Vous avez **3 partners** dans la base de données mais l'interface `/admin/partners` est vide.

---

## 🎯 Plan de Debug en 4 Étapes

### Étape 1 : Vérifier les Données SQL ✅

**Exécutez dans Supabase SQL Editor :**

```sql
-- Voir les 3 partners
SELECT 
  id,
  name,
  business_name,
  email,
  phone,
  verification_status,
  user_id,
  created_at
FROM owners 
WHERE user_id IS NOT NULL
ORDER BY created_at DESC;
```

**Résultat attendu :** 3 lignes avec les détails des partners

---

### Étape 2 : Tester l'API Directement 🌐

**Option A : Dans le navigateur**

1. Ouvrez : `http://localhost:3000/api/admin/partners`
2. Vous devriez voir un JSON avec les 3 partners

**Option B : Avec le fichier de test**

1. Ouvrez : `http://localhost:3000/test-partners-api-direct.html`
2. Cliquez sur "🚀 Tester l'API"
3. Regardez le résultat

**Résultats possibles :**

✅ **Succès :**
```json
{
  "partners": [
    { "id": "...", "name": "...", ... },
    { "id": "...", "name": "...", ... },
    { "id": "...", "name": "...", ... }
  ]
}
```

❌ **Erreur 401 :**
```json
{ "error": "Non authentifié" }
```
→ **Solution :** Connectez-vous d'abord en tant qu'admin

❌ **Erreur 403 :**
```json
{ "error": "Permissions insuffisantes" }
```
→ **Solution :** Votre compte n'a pas le rôle admin/manager/superuser

❌ **Erreur 500 :**
```json
{ "error": "..." }
```
→ **Solution :** Problème de base de données (voir Étape 3)

---

### Étape 3 : Vérifier les Permissions RLS 🔒

**Exécutez dans Supabase :**

```sql
-- Fichier : check-owners-rls-policies.sql

-- 1. RLS activé ?
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'owners';

-- 2. Quelles policies ?
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'owners';
```

**Problème possible :** Les policies RLS bloquent l'accès aux données

**Solution temporaire :**
```sql
-- DÉSACTIVER RLS temporairement pour tester
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;

-- Puis retestez l'API
-- Si ça fonctionne, le problème vient des policies RLS
```

---

### Étape 4 : Vérifier la Console du Navigateur 🖥️

1. Ouvrez `/fr/admin/partners`
2. Appuyez sur **F12** (DevTools)
3. Allez dans **Console**
4. Regardez les erreurs

**Erreurs possibles :**

❌ **Network Error :**
```
Failed to fetch
```
→ Le serveur ne répond pas

❌ **CORS Error :**
```
Access-Control-Allow-Origin
```
→ Problème de configuration

❌ **404 Not Found :**
```
GET /api/admin/partners 404
```
→ La route n'existe pas

5. Allez dans **Network** → **XHR**
6. Cherchez `/api/admin/partners`
7. Cliquez dessus et regardez :
   - **Status** : 200, 401, 403, 500 ?
   - **Response** : Quel JSON est retourné ?

---

## 🔧 Solutions Rapides

### Solution 1 : Problème d'Authentification

**Symptôme :** Erreur 401 ou 403

**Action :**
1. Déconnectez-vous
2. Reconnectez-vous avec un compte admin
3. Vérifiez votre rôle :

```sql
SELECT id, email, role 
FROM profiles 
WHERE email = 'votre-email@example.com';
```

4. Si le rôle n'est pas admin/manager/superuser :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';
```

---

### Solution 2 : Problème de RLS

**Symptôme :** API retourne `{ "partners": [] }` (tableau vide)

**Action :**
```sql
-- Désactiver RLS temporairement
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;

-- Retester l'interface
-- Si ça fonctionne, créer une policy admin :

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

-- Réactiver RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
```

---

### Solution 3 : Problème de Foreign Key

**Symptôme :** Erreur SQL dans les logs

**Action :** J'ai déjà simplifié la requête pour éviter ce problème. Si ça persiste :

```typescript
// Dans app/api/admin/partners/route.ts
// Remplacer par une requête encore plus simple :

const { data: partners, error } = await supabase
  .from('owners')
  .select('id, name, business_name, email, phone, verification_status, user_id, created_at')
  .not('user_id', 'is', null)
  .order('created_at', { ascending: false });
```

---

## 📝 Checklist de Debug

Cochez au fur et à mesure :

- [ ] **Étape 1 :** SQL retourne 3 partners ✅
- [ ] **Étape 2 :** API `/api/admin/partners` retourne les données
- [ ] **Étape 3 :** RLS n'est pas le problème
- [ ] **Étape 4 :** Pas d'erreur dans la console
- [ ] **Étape 5 :** Je suis connecté en tant qu'admin
- [ ] **Étape 6 :** L'interface affiche les 3 partners

---

## 🆘 Si Rien ne Fonctionne

**Envoyez-moi :**

1. **Résultat SQL :**
```sql
SELECT COUNT(*) FROM owners WHERE user_id IS NOT NULL;
```

2. **Résultat API :**
```
http://localhost:3000/api/admin/partners
```
(Copiez le JSON complet)

3. **Erreurs Console :**
(Capture d'écran ou copie des erreurs)

4. **Votre rôle :**
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

---

## 🎯 Fichiers de Debug Créés

1. `debug-partners-details.sql` - Voir les détails des 3 partners
2. `test-partners-api-direct.html` - Tester l'API dans le navigateur
3. `check-owners-rls-policies.sql` - Vérifier les permissions RLS

---

**Commencez par l'Étape 1 et dites-moi ce que vous trouvez !** 🚀
