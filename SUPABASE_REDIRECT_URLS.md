# 🔗 Configuration Supabase Redirect URLs - loftalgerie.com

## 📍 Site URL (URL principale)
```
https://loftalgerie.com
```

## 🔄 Redirect URLs (copier-coller dans Supabase)

```
https://loftalgerie.com/auth/callback
https://loftalgerie.com/api/auth/callback
https://loftalgerie.com/api/auth/reset-password
https://loftalgerie.com/auth/reset-password
https://loftalgerie.com/login
https://loftalgerie.com/register
https://loftalgerie.com/dashboard
```

## 🌐 Avec www (optionnel)
```
https://www.loftalgerie.com/auth/callback
https://www.loftalgerie.com/api/auth/callback
https://www.loftalgerie.com/api/auth/reset-password
```

## 🚨 URLs à SUPPRIMER (localhost)
```
❌ http://localhost:3000/api/auth/reset-password
❌ http://localhost:3000/auth/callback
❌ http://localhost:3000/api/auth/callback
❌ http://localhost:3000/login
❌ http://localhost:3000/register
```

## 📋 Checklist de configuration

- [ ] Site URL mis à jour vers `https://loftalgerie.com`
- [ ] Toutes les URLs localhost supprimées
- [ ] Toutes les URLs loftalgerie.com ajoutées
- [ ] Configuration sauvegardée dans Supabase
- [ ] Test OAuth fonctionnel

## 🔧 Où configurer dans Supabase

1. **Dashboard** : https://supabase.com/dashboard
2. **Projet** : `mhngbluefyucoesgcjoy`
3. **Menu** : Authentication → URL Configuration
4. **Champs** :
   - Site URL : `https://loftalgerie.com`
   - Redirect URLs : (coller toutes les URLs ci-dessus)

## ✅ Test après configuration

Une fois configuré, testez :
1. Connexion Google/Facebook depuis https://loftalgerie.com
2. Reset password depuis https://loftalgerie.com
3. Vérifiez que la redirection se fait vers loftalgerie.com (pas localhost)

---

**Important** : Après cette configuration, vous n'aurez plus jamais le problème de redirection vers localhost ! 🎉