# 🔍 Test de l'API Notifications Airbnb

## Problème Actuel

L'erreur `{}` lors du marquage comme lu indique que l'API retourne une réponse vide.

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier Votre Rôle Admin

```sql
-- Dans Supabase SQL Editor
SELECT 
  p.id,
  p.email,
  p.role,
  u.email as auth_email,
  auth.uid() as current_user_id
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.id = auth.uid();
```

**Résultat attendu :** `role = 'admin'`

**Si ce n'est pas le cas :**
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
```

---

### Test 2 : Vérifier les Politiques RLS

```sql
-- Vérifier que vous pouvez voir les notifications
SELECT COUNT(*) as total
FROM airbnb_notifications;

-- Vérifier que vous pouvez mettre à jour
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ) THEN 'Vous POUVEZ mettre à jour ✅'
    ELSE 'Vous NE POUVEZ PAS mettre à jour ❌'
  END as can_update;
```

---

### Test 3 : Tester l'API Directement

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Récupérer l'ID de la notification de test
const notificationId = '12112303e-feb1-40da-836d-396bd7a40570'

// Tester l'API
fetch(`/api/airbnb/notifications/${notificationId}/read`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(res => {
  console.log('Status:', res.status)
  console.log('Status Text:', res.statusText)
  return res.json()
})
.then(data => {
  console.log('Response:', data)
})
.catch(err => {
  console.error('Error:', err)
})
```

---

### Test 4 : Vérifier les Logs de l'API

Dans le terminal où tourne votre serveur Next.js, regardez les logs quand vous cliquez sur "Marquer comme lu".

Vous devriez voir :
- ✅ `[Airbnb Notifications] Marking notification as read: [id]`
- ✅ `[Airbnb Notifications] Successfully marked as read`

Ou des erreurs :
- ❌ `Non authentifié`
- ❌ `Accès refusé - Admin uniquement`
- ❌ `Notification non trouvée`

---

## 🔧 Solutions Possibles

### Solution 1 : Vous N'êtes Pas Admin

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
```

Puis rafraîchissez la page (F5).

---

### Solution 2 : Problème de Session

Déconnectez-vous et reconnectez-vous :
1. Cliquez sur votre avatar → Déconnexion
2. Reconnectez-vous
3. Testez à nouveau

---

### Solution 3 : Problème de RLS

Vérifiez que les politiques RLS sont bien créées :

```sql
-- Lister les politiques
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'airbnb_notifications';
```

**Résultat attendu :** 3 politiques
- `Admins can view all notifications` (SELECT)
- `Admins can update notifications` (UPDATE)
- `System can insert notifications` (INSERT)

**Si manquantes, réappliquez la migration :**
```sql
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can view all notifications" ON airbnb_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON airbnb_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON airbnb_notifications;

-- Recréer les politiques
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

CREATE POLICY "Admins can update notifications"
ON airbnb_notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can insert notifications"
ON airbnb_notifications FOR INSERT
TO authenticated
WITH CHECK (true);
```

---

### Solution 4 : Cache du Navigateur

1. Ouvrez la console (F12)
2. Onglet "Application" (Chrome) ou "Stockage" (Firefox)
3. Cliquez sur "Clear site data" ou "Effacer les données du site"
4. Rafraîchissez (F5)
5. Reconnectez-vous

---

## 📊 Résultat Attendu

Après avoir appliqué les solutions, vous devriez :

1. ✅ Voir le badge rouge "1" sur la cloche
2. ✅ Cliquer sur la cloche → Panel s'ouvre
3. ✅ Voir la notification "🎉 TEST"
4. ✅ Cliquer sur la notification → Elle disparaît
5. ✅ Le badge passe à "0"
6. ✅ Pas d'erreur dans la console

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

Envoyez-moi :

1. **Le résultat du Test 1** (votre rôle)
2. **Le résultat du Test 2** (can_update)
3. **Le résultat du Test 3** (réponse de l'API)
4. **Les logs du serveur** (terminal Next.js)
5. **Les erreurs de la console** (F12 → Console)

Je pourrai alors diagnostiquer le problème exact.

---

**Date :** 2026-06-01  
**Fichier :** TEST_API_NOTIFICATIONS.md
