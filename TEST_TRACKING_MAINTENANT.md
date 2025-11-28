# 🧪 Test du Tracking - Guide Rapide

## ✅ Debug Activé !

Le mode debug est maintenant **activé**. Vous allez voir des logs détaillés dans la console.

---

## 🔍 Ce Que Vous Allez Voir

### 1. Configuration du Tracking

```
🔍 [Tracking Config] {
  hasSession: false,
  userRole: undefined,
  pathname: "/",
  isSuperuserAdmin: false,
  shouldTrack: true,
  willBeTracked: "✅ OUI"
}
```

### 2. Tracking en Action

```
[Visitor Tracking] Session tracked successfully
```

---

## 🧪 Test Étape par Étape

### Étape 1 : Rafraîchir la Page

1. **Fermez complètement Chrome**
2. **Rouvrez Chrome**
3. **Allez sur `http://localhost:3000`**
4. **Ouvrez la console (F12)**
5. **Attendez 2-3 secondes**

**Vous devriez voir :**
```
🔍 [Tracking Config] { ... willBeTracked: "✅ OUI" }
[Visitor Tracking] Session tracked successfully
```

### Étape 2 : Vérifier dans Supabase

1. **Ouvrez Supabase Dashboard**
2. **SQL Editor**
3. **Exécutez :**

```sql
-- Voir le dernier visiteur
SELECT 
  session_id,
  device_type,
  browser,
  landing_page,
  first_visit
FROM visitors
ORDER BY first_visit DESC
LIMIT 1;
```

**Vous devriez voir :**
- Un nouveau visiteur
- device_type: "desktop"
- browser: "Chrome"
- landing_page: "/" ou "/fr"

### Étape 3 : Vérifier le Dashboard

1. **Connectez-vous en tant que superuser**
2. **Allez sur `/admin/superuser/dashboard`**
3. **Regardez les cartes en haut**

**Vous devriez voir :**
- Total Visiteurs : +1
- Visiteurs Aujourd'hui : +1

---

## 🔍 Logs Attendus

### Cas 1 : Visiteur Non Connecté (Homepage)

```javascript
🔍 [Tracking Config] {
  hasSession: false,
  userRole: undefined,
  pathname: "/",
  isSuperuserAdmin: false,
  shouldTrack: true,
  willBeTracked: "✅ OUI"
}

[Visitor Tracking] Session tracked successfully
```

### Cas 2 : Client Connecté (Dashboard)

```javascript
🔍 [Tracking Config] {
  hasSession: true,
  userRole: "client",
  pathname: "/fr/client/dashboard",
  isSuperuserAdmin: false,
  shouldTrack: true,
  willBeTracked: "✅ OUI"
}

[Visitor Tracking] Session tracked successfully
```

### Cas 3 : Superuser sur Admin (PAS tracké)

```javascript
🔍 [Tracking Config] {
  hasSession: true,
  userRole: "superuser",
  pathname: "/fr/admin/superuser/dashboard",
  isSuperuserAdmin: true,
  shouldTrack: false,
  willBeTracked: "❌ NON"
}

// Pas de tracking
```

---

## ❌ Problèmes Possibles

### Problème 1 : Aucun Log dans la Console

**Cause :** Le composant ne se charge pas

**Solution :**
1. Vérifiez qu'il n'y a pas d'erreurs dans la console
2. Vérifiez que le serveur dev tourne (`npm run dev`)
3. Rafraîchissez avec Ctrl+Shift+R (hard refresh)

### Problème 2 : "willBeTracked: ❌ NON"

**Cause :** Vous êtes superuser sur une page admin

**Solution :**
1. Déconnectez-vous
2. Ou allez sur une page publique (`/fr`)
3. Ou connectez-vous avec un compte client

### Problème 3 : "Failed to fetch"

**Cause :** L'API `/api/track-visitor` ne répond pas

**Solution :**
1. Vérifiez que le serveur dev tourne
2. Vérifiez que le fichier `app/api/track-visitor/route.ts` existe
3. Regardez les logs du serveur

### Problème 4 : "500 Internal Server Error"

**Cause :** Problème avec la fonction SQL `record_visitor`

**Solution :**
1. Ouvrez Supabase SQL Editor
2. Vérifiez que la fonction existe :
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'record_visitor';
```
3. Si elle n'existe pas, exécutez `database/visitor-tracking-schema.sql`

---

## 🎯 Test Complet

### Test 1 : Navigation Privée (Visiteur Anonyme)

1. **Ouvrez Chrome en navigation privée** (Ctrl+Shift+N)
2. **Allez sur `http://localhost:3000`**
3. **Ouvrez la console (F12)**
4. **Attendez 2 secondes**

**Attendu :**
```
🔍 [Tracking Config] { willBeTracked: "✅ OUI" }
[Visitor Tracking] Session tracked successfully
```

### Test 2 : Différents Navigateurs

1. **Chrome :** Visitez `http://localhost:3000`
2. **Firefox :** Visitez `http://localhost:3000`
3. **Edge :** Visitez `http://localhost:3000`
4. **Vérifiez Supabase :**

```sql
SELECT 
  browser,
  COUNT(*) as count
FROM visitors
WHERE first_visit::date = CURRENT_DATE
GROUP BY browser;
```

**Attendu :**
```
Chrome: 1
Firefox: 1
Edge: 1
```

### Test 3 : Client Connecté

1. **Connectez-vous avec un compte client**
2. **Visitez le dashboard client**
3. **Ouvrez la console (F12)**

**Attendu :**
```
🔍 [Tracking Config] { 
  userRole: "client",
  willBeTracked: "✅ OUI" 
}
[Visitor Tracking] Session tracked successfully
```

### Test 4 : Superuser sur Admin (Ne Doit PAS Tracker)

1. **Connectez-vous en tant que superuser**
2. **Allez sur `/admin/superuser/dashboard`**
3. **Ouvrez la console (F12)**

**Attendu :**
```
🔍 [Tracking Config] { 
  userRole: "superuser",
  isSuperuserAdmin: true,
  willBeTracked: "❌ NON" 
}
// Pas de message "Session tracked"
```

---

## 📊 Vérifier les Résultats

### Dans Supabase

```sql
-- Statistiques globales
SELECT * FROM get_visitor_stats();

-- Derniers visiteurs
SELECT 
  session_id,
  device_type,
  browser,
  landing_page,
  first_visit
FROM visitors
ORDER BY first_visit DESC
LIMIT 10;

-- Répartition par navigateur
SELECT 
  browser,
  COUNT(*) as count
FROM visitors
GROUP BY browser
ORDER BY count DESC;
```

### Dans le Dashboard

1. Allez sur `/admin/superuser/dashboard`
2. Regardez les 4 cartes en haut
3. Elles devraient afficher des nombres > 0

---

## 🔧 Désactiver le Debug Après

Une fois que tout fonctionne, désactivez le debug :

**Fichier :** `components/providers/client-providers-nextintl.tsx`

```typescript
useVisitorTracking({ 
  enabled: shouldTrack,
  debug: false  // ← Remettre à false
});

// Et commentez ou supprimez le useEffect de debug
```

---

## ✅ Checklist de Test

- [ ] Logs visibles dans la console
- [ ] "willBeTracked: ✅ OUI" pour visiteur anonyme
- [ ] "Session tracked successfully" apparaît
- [ ] Nouveau visiteur dans Supabase
- [ ] Dashboard affiche +1 visiteur
- [ ] Différents navigateurs = différents visiteurs
- [ ] Client connecté est tracké
- [ ] Superuser sur admin n'est PAS tracké

---

## 🎉 Si Tout Fonctionne

**Félicitations ! Le tracking fonctionne !**

### Prochaines étapes :

1. ✅ Désactivez le debug (`debug: false`)
2. ✅ Supprimez le `useEffect` de debug (optionnel)
3. ✅ Testez en production
4. ✅ Surveillez les statistiques

---

## 🆘 Besoin d'Aide ?

Si ça ne fonctionne toujours pas :

1. **Copiez les logs de la console**
2. **Copiez les erreurs (s'il y en a)**
3. **Vérifiez les logs du serveur dev**
4. **Exécutez le script de test SQL** (`scripts/test-visitor-tracking.sql`)

---

**Maintenant, rafraîchissez votre page et regardez la console ! 🔍**
