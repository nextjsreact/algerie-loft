# 🔧 Diagnostic: Erreur Notification Airbnb

## ❌ Problème Actuel

Vous voyez l'erreur suivante dans la console :
```
Error marking Airbnb notification as read: {}
```

La notification reste visible et n'est pas marquée comme lue.

---

## ✅ Corrections Appliquées

### 1. **API Route Améliorée** ✓
- Ajout de logs détaillés à chaque étape
- Messages d'erreur plus explicites
- Meilleure gestion des cas d'erreur

### 2. **Badge Sidebar** ✓
- Le menu "Notifications" dans le sidebar affiche maintenant le badge rouge
- Compte combiné : notifications normales + Airbnb

### 3. **Cloche Unifiée** ✓
- Une seule cloche dans le header (pas de doublon)
- Affiche les notifications normales ET Airbnb

---

## 🔍 Étapes de Diagnostic

### Étape 1 : Vérifier Votre Rôle Admin

**Dans Supabase SQL Editor**, exécutez :

```sql
SELECT 
  p.id,
  p.email,
  p.role,
  auth.uid() as current_user_id
FROM profiles p
WHERE p.id = auth.uid();
```

**Résultat attendu :**
```
role = 'admin'
```

**Si votre rôle n'est PAS 'admin', exécutez :**
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
```

---

### Étape 2 : Vérifier les Logs du Serveur

1. Ouvrez votre terminal où Next.js tourne
2. Rafraîchissez la page (F5)
3. Cliquez sur la notification pour la marquer comme lue
4. Regardez les logs dans le terminal

**Logs attendus :**
```
[Airbnb Notifications] Marking notification as read: 12112303e-feb1-40da-836d-396bd7a40570
[Airbnb Notifications] User ID: [votre-id]
[Airbnb Notifications] User role: admin
[Airbnb Notifications] Notification found, is_read: false
[Airbnb Notifications] Successfully marked as read
```

**Si vous voyez une erreur, notez-la !**

---

### Étape 3 : Tester l'API Directement

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Remplacez par l'ID de votre notification
const notificationId = '12112303e-feb1-40da-836d-396bd7a40570'

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

**Résultats possibles :**

| Status | Message | Cause | Solution |
|--------|---------|-------|----------|
| 200 | `success: true` | ✅ Tout fonctionne | Rafraîchir la page |
| 401 | `Non authentifié` | Session expirée | Se reconnecter |
| 403 | `Accès refusé - Admin uniquement` | Pas admin | Étape 1 |
| 404 | `Notification non trouvée` | ID invalide | Vérifier l'ID |
| 500 | `Erreur lors de la mise à jour` | Problème RLS | Étape 4 |

---

### Étape 4 : Vérifier les Politiques RLS

```sql
-- Lister les politiques
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lecture'
    WHEN cmd = 'UPDATE' THEN 'Mise à jour'
    WHEN cmd = 'INSERT' THEN 'Création'
    ELSE cmd
  END as operation
FROM pg_policies
WHERE tablename = 'airbnb_notifications'
ORDER BY cmd;
```

**Résultat attendu : 3 politiques**
1. `Admins can view all notifications` (SELECT)
2. `Admins can update notifications` (UPDATE)
3. `System can insert notifications` (INSERT)

**Si des politiques manquent, réappliquez-les :**

```sql
-- Supprimer les anciennes
DROP POLICY IF EXISTS "Admins can view all notifications" ON airbnb_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON airbnb_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON airbnb_notifications;

-- Recréer
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

### Étape 5 : Tester la Mise à Jour Directement

```sql
-- Vérifier que vous pouvez mettre à jour
UPDATE airbnb_notifications
SET is_read = true,
    read_at = NOW(),
    read_by = auth.uid()
WHERE id = '12112303e-feb1-40da-836d-396bd7a40570';

-- Vérifier le résultat
SELECT id, is_read, read_at, read_by
FROM airbnb_notifications
WHERE id = '12112303e-feb1-40da-836d-396bd7a40570';
```

**Si ça fonctionne dans SQL mais pas dans l'API :**
- Problème de session Next.js
- Solution : Se déconnecter et se reconnecter

---

## 🎯 Checklist de Vérification

Cochez au fur et à mesure :

- [ ] **Étape 1** : Je suis admin (`role = 'admin'`)
- [ ] **Étape 2** : Les logs du serveur s'affichent correctement
- [ ] **Étape 3** : L'API retourne `status: 200` et `success: true`
- [ ] **Étape 4** : Les 3 politiques RLS existent
- [ ] **Étape 5** : La mise à jour SQL fonctionne
- [ ] **Résultat** : La notification disparaît quand je clique dessus

---

## 🚀 Test Final

1. Rafraîchissez la page (F5)
2. Ouvrez la cloche de notification
3. Vous devriez voir :
   - Badge rouge "1" sur la cloche
   - Section "🏠 Airbnb (1 non lues)"
   - Notification "🎉 TEST"
4. Cliquez sur la notification
5. Elle devrait disparaître immédiatement
6. Le badge passe à "0"

---

## 📝 Informations à Fournir

Si le problème persiste, envoyez-moi :

1. **Résultat Étape 1** (votre rôle)
2. **Logs du serveur** (terminal Next.js)
3. **Résultat Étape 3** (réponse API)
4. **Résultat Étape 4** (nombre de politiques)
5. **Capture d'écran** de l'erreur dans la console

---

## 🔄 Redémarrage Complet

Si rien ne fonctionne, essayez un redémarrage complet :

```bash
# 1. Arrêter le serveur Next.js (Ctrl+C)

# 2. Nettoyer le cache
rm -rf .next
npm run build

# 3. Redémarrer
npm run dev
```

Puis :
1. Déconnexion de l'application
2. Fermer tous les onglets
3. Rouvrir et se reconnecter
4. Tester à nouveau

---

**Date :** 2026-06-01  
**Version :** 2.0 (avec logs détaillés)
