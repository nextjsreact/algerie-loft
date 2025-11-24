# 🚀 Installation : Système d'Annonces Urgentes

## ⚡ Installation Rapide (3 étapes)

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"** dans le menu de gauche
4. Cliquez sur **"New query"**

### Étape 2 : Copier le SQL

Ouvrez le fichier :
```
database/migrations/create_urgent_announcements.sql
```

Copiez **TOUT** le contenu (Ctrl+A puis Ctrl+C)

### Étape 3 : Exécuter

1. Collez le SQL dans l'éditeur Supabase
2. Cliquez sur **"Run"** (ou appuyez sur F5)
3. Attendez le message de succès ✅

**C'est tout !** 🎉

---

## 🧪 Vérifier l'installation

### Test 1 : Vérifier la table

Dans Supabase SQL Editor, exécutez :

```sql
SELECT * FROM urgent_announcements;
```

Résultat attendu : Table vide (0 rows)

### Test 2 : Créer une annonce de test

1. Connectez-vous en tant qu'admin
2. Allez sur `/admin/announcements`
3. Cliquez sur "Nouvelle annonce"
4. Remplissez le formulaire
5. Cliquez sur "Créer l'annonce"

Si ça fonctionne → ✅ Installation réussie !

---

## 🔍 Vérifier les permissions

### Vérifier votre rôle

Dans Supabase SQL Editor :

```sql
SELECT id, email, role 
FROM profiles 
WHERE id = auth.uid();
```

Votre rôle doit être **'admin'** ou **'superuser'**.

### Si vous n'êtes pas admin

Exécutez (remplacez YOUR_EMAIL) :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL@example.com';
```

---

## 🆘 Dépannage

### Erreur : "relation urgent_announcements does not exist"

**Cause :** La table n'a pas été créée

**Solution :**
1. Retournez à l'Étape 1
2. Exécutez le SQL dans Supabase
3. Vérifiez qu'il n'y a pas d'erreur

### Erreur : "permission denied"

**Cause :** Vous n'êtes pas admin/superuser

**Solution :**
```sql
-- Vérifiez votre rôle
SELECT role FROM profiles WHERE id = auth.uid();

-- Si nécessaire, changez-le
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
```

### Erreur : "new row violates row-level security policy"

**Cause :** Les politiques RLS bloquent l'insertion

**Solution :**
```sql
-- Vérifiez que les politiques existent
SELECT * FROM pg_policies WHERE tablename = 'urgent_announcements';

-- Si aucune politique, réexécutez le SQL complet
```

### L'annonce ne s'affiche pas sur la page

**Vérifiez :**
1. L'annonce est **Active** (statut vert)
2. La date de fin n'est pas dépassée
3. Les 3 langues sont remplies
4. Rechargez la page (Ctrl+Shift+R)

---

## 📊 Structure de la table

```sql
CREATE TABLE urgent_announcements (
  id UUID PRIMARY KEY,
  message_fr TEXT NOT NULL,
  message_en TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  background_color TEXT DEFAULT '#EF4444',
  text_color TEXT DEFAULT '#FFFFFF',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Politiques de sécurité (RLS)

| Action | Qui peut ? | Condition |
|--------|-----------|-----------|
| **SELECT** | Tout le monde | Annonces actives et non expirées |
| **INSERT** | Admin, Superuser | Vérifié via table profiles |
| **UPDATE** | Admin, Superuser | Vérifié via table profiles |
| **DELETE** | Admin, Superuser | Vérifié via table profiles |

---

## ✅ Checklist d'installation

- [ ] SQL exécuté dans Supabase
- [ ] Table créée (vérifiée avec SELECT)
- [ ] Rôle admin/superuser configuré
- [ ] Page `/admin/announcements` accessible
- [ ] Annonce de test créée
- [ ] Annonce visible sur la page d'accueil

---

## 🎓 Après l'installation

Une fois installé, consultez :
- **Guide d'utilisation** : `GUIDE_ANNONCES_URGENTES.md`
- **Interface admin** : `/admin/announcements`

---

## 💡 Astuce

Pour tester rapidement, créez une annonce avec :
- Durée : 1 jour
- Message : "🎉 Test : Le système fonctionne !"
- Couleur : Rouge (#EF4444)

Si elle apparaît en haut de la page d'accueil → Tout fonctionne ! ✨
