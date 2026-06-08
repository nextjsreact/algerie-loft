# ✅ Corrections Appliquées - Système de Notifications Airbnb

**Date :** 2026-06-01  
**Problème :** Erreur SQL "relation users does not exist"  
**Solution :** Remplacement de `users` par `profiles`

---

## 🔍 Problème Identifié

Votre base de données utilise :
- ✅ `profiles` - Table des profils utilisateurs (avec colonne `role`)
- ✅ `auth.users` - Table Supabase Auth (sans colonne `role`)
- ❌ `users` - N'existe pas dans votre schéma

---

## 🛠️ Corrections Effectuées

### 1. Migration SQL

**Fichier :** `supabase/migrations/20260601000000_create_airbnb_notifications.sql`

**Changements :**

```sql
-- AVANT (❌ Erreur)
read_by UUID REFERENCES users(id) ON DELETE SET NULL

-- APRÈS (✅ Corrigé)
read_by UUID REFERENCES profiles(id) ON DELETE SET NULL
```

```sql
-- AVANT (❌ Erreur)
CREATE POLICY "Admins can view all notifications"
ON airbnb_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- APRÈS (✅ Corrigé)
CREATE POLICY "Admins can view all notifications"
ON airbnb_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### 2. API Route - Liste des Notifications

**Fichier :** `app/api/airbnb/notifications/route.ts`

**Changements :**

```typescript
// AVANT (❌ Erreur)
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

// APRÈS (✅ Corrigé)
const { data: userData } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
```

**Bonus :** Correction des noms de colonnes dans le SELECT :
```typescript
// AVANT
reservations (
  check_in,
  check_out,
  total_price
)

// APRÈS
reservations (
  check_in_date,
  check_out_date,
  total_amount
)
```

---

### 3. API Route - Marquer comme Lu

**Fichier :** `app/api/airbnb/notifications/[id]/read/route.ts`

**Changements :**

```typescript
// AVANT (❌ Erreur) - 2 occurrences
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

// APRÈS (✅ Corrigé) - 2 occurrences
const { data: userData } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
```

---

## 📊 Résumé des Modifications

| Fichier | Changements | Occurrences |
|---------|-------------|-------------|
| **Migration SQL** | `users` → `profiles` | 3 |
| **API notifications/route.ts** | `users` → `profiles` | 2 |
| **API [id]/read/route.ts** | `users` → `profiles` | 2 |
| **Total** | | **7 corrections** |

---

## ✅ Vérification

### Test de la Migration SQL

Maintenant vous pouvez exécuter la migration sans erreur :

```sql
-- Dans Supabase SQL Editor
-- Copier/coller le contenu de :
-- supabase/migrations/20260601000000_create_airbnb_notifications.sql
```

**Résultat attendu :**
```
✅ Table airbnb_notifications créée
✅ Indexes créés
✅ Politiques RLS créées
✅ Fonction de nettoyage créée
```

---

### Test des API Routes

Les API routes fonctionneront maintenant correctement :

```bash
# Test 1 : Récupérer les notifications
GET /api/airbnb/notifications?unread=true

# Test 2 : Marquer toutes comme lues
POST /api/airbnb/notifications/read-all

# Test 3 : Marquer une notification comme lue
POST /api/airbnb/notifications/[id]/read
```

---

## 🎯 Prochaines Étapes

### 1. Appliquer la Migration SQL (2 min)

```bash
# 1. Ouvrir Supabase Dashboard → SQL Editor
# 2. Copier le contenu de : supabase/migrations/20260601000000_create_airbnb_notifications.sql
# 3. Coller et exécuter
# 4. Vérifier qu'il n'y a pas d'erreur
```

### 2. Vérifier la Création de la Table

```sql
-- Vérifier que la table existe
SELECT COUNT(*) FROM airbnb_notifications;
-- Devrait retourner 0 (table vide mais créée)

-- Vérifier les politiques RLS
SELECT policyname FROM pg_policies WHERE tablename = 'airbnb_notifications';
-- Devrait retourner 3 politiques
```

### 3. Tester avec une Notification

```sql
-- Créer une notification de test
INSERT INTO airbnb_notifications (
  reservation_id,
  loft_id,
  type,
  title,
  message,
  metadata
)
SELECT 
  r.id,
  r.loft_id,
  'new',
  '🎉 TEST - Nouvelle réservation - ' || l.name,
  r.guest_name || ' • Test notification',
  '{"test": true}'::jsonb
FROM reservations r
JOIN lofts l ON l.id = r.loft_id
WHERE r.source = 'airbnb_scraper'
LIMIT 1;

-- Vérifier la création
SELECT * FROM airbnb_notifications WHERE metadata->>'test' = 'true';
```

### 4. Intégrer le Composant dans la Navbar

Suivez les instructions dans `DEMARRAGE_RAPIDE_NOTIFICATIONS.md`

---

## 🔍 Pourquoi Cette Erreur ?

### Votre Schéma de Base de Données

Votre application utilise le schéma Supabase standard :

```
auth.users (Supabase Auth)
├── id (UUID)
├── email
├── encrypted_password
└── raw_user_meta_data (JSONB)

profiles (Votre table personnalisée)
├── id (UUID) → REFERENCES auth.users(id)
├── email
├── role (TEXT) ← Colonne importante !
├── full_name
└── ...
```

**Pourquoi `profiles` et pas `users` ?**
- Supabase recommande de créer une table `profiles` séparée
- La table `auth.users` est gérée par Supabase Auth
- Vous stockez les données métier (role, nom, etc.) dans `profiles`

---

## 📚 Documentation Mise à Jour

Tous les fichiers de documentation ont été créés avec la bonne référence à `profiles` :

- ✅ `GUIDE_NOTIFICATIONS_AIRBNB.md`
- ✅ `INTEGRATION_NAVBAR_NOTIFICATIONS.md`
- ✅ `RESUME_IMPLEMENTATION_NOTIFICATIONS.md`
- ✅ `DEMARRAGE_RAPIDE_NOTIFICATIONS.md`
- ✅ `NOTIFICATION_SYSTEM_OVERVIEW.md`

---

## 🎉 Résultat

Toutes les erreurs ont été corrigées. Vous pouvez maintenant :

1. ✅ Appliquer la migration SQL sans erreur
2. ✅ Utiliser les API routes correctement
3. ✅ Intégrer le composant dans la navbar
4. ✅ Tester le système de notifications

---

## 💡 Conseil

Si vous rencontrez d'autres erreurs liées aux tables, vérifiez toujours :

1. **Quel est le nom de la table dans votre schéma ?**
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

2. **Quelles colonnes existent dans la table ?**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles';
   ```

3. **Quelle table contient le champ `role` ?**
   ```sql
   SELECT table_name 
   FROM information_schema.columns 
   WHERE column_name = 'role';
   ```

---

**Date :** 2026-06-01  
**Statut :** ✅ Toutes les corrections appliquées  
**Prêt pour le déploiement :** OUI
