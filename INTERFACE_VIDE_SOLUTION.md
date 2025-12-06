# 🔍 Interface Vide - Solution

## ❓ Pourquoi l'interface `/admin/partners` est vide ?

**Réponse :** L'interface affiche **UNIQUEMENT** les partners (owners avec `user_id`).

Si vous n'avez que des propriétaires internes (sans `user_id`), l'interface sera vide.

---

## 🎯 Solution Rapide

### Étape 1 : Vérifier les Données

**Exécutez dans Supabase SQL Editor :**

```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as internes,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as partners
FROM owners;
```

**Résultat attendu :**
```
total: 26
internes: 26
partners: 0  ← Voilà pourquoi c'est vide!
```

---

## ✅ Solution : Créer un Partner de Test

### Option A : Via Interface Supabase (Recommandé)

#### 1. Créer un User
1. Supabase Dashboard
2. **Authentication** → **Users**
3. **Add User**
4. Email: `partner-test@example.com`
5. Password: `Test123456!`
6. **Copiez l'UUID** du user créé

#### 2. Exécuter le Script
Fichier: `create-test-partner.sql`

**Remplacez** `'USER_UUID_ICI'` par l'UUID copié (3 endroits)

Puis exécutez dans SQL Editor.

---

### Option B : Script Complet (Plus Rapide)

**Exécutez ceci dans Supabase SQL Editor :**

```sql
-- Créer un owner/partner de test
-- Note: Vous devez d'abord créer le user dans Authentication

-- Après avoir créé le user, remplacez 'USER_UUID' ci-dessous
DO $$
DECLARE
  test_user_id UUID := 'REMPLACEZ_PAR_UUID_DU_USER';
BEGIN
  -- Créer le profil
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    test_user_id,
    'partner-test@example.com',
    'Partner Test',
    'partner'
  )
  ON CONFLICT (id) DO UPDATE SET role = 'partner';
  
  -- Créer l'owner/partner
  INSERT INTO owners (
    user_id, name, business_name, email, phone, 
    address, business_type, verification_status
  ) VALUES (
    test_user_id,
    'Partner Test',
    'Test Business SARL',
    'partner-test@example.com',
    '+213 555 123 456',
    'Alger, Algérie',
    'company',
    'pending'
  );
  
  RAISE NOTICE 'Partner de test créé!';
END $$;
```

---

## 🧪 Vérifier

```sql
-- Voir le partner créé
SELECT * FROM owners WHERE user_id IS NOT NULL;
```

**Résultat attendu :**
```
1 ligne avec:
- name: Partner Test
- business_name: Test Business SARL
- verification_status: pending
- user_id: (UUID du user)
```

---

## 🔄 Rafraîchir l'Interface

1. Allez sur `http://localhost:3000/fr/admin/partners`
2. Rafraîchissez la page (F5)
3. Vous devriez voir le partner de test!

---

## 🎯 Résumé

```
Problème: Interface vide
Cause: Pas de partners (user_id = NULL pour tous)
Solution: Créer un partner de test
Résultat: Interface affiche le partner
```

---

## 📝 Étapes Complètes

1. ✅ Vérifier les données (`check-owners-data.sql`)
2. ✅ Créer un user dans Authentication
3. ✅ Exécuter `create-test-partner.sql`
4. ✅ Rafraîchir `/admin/partners`
5. ✅ Tester les actions (approuver, rejeter, etc.)

---

**Exécutez `check-owners-data.sql` et dites-moi les résultats!** 🎯
