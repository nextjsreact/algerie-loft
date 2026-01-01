# 🔧 Guide Configuration OAuth Supabase - loftalgerie.com

## 🎯 Problème à Résoudre
OAuth redirige vers `localhost:3000` au lieu de `loftalgerie.com` car la configuration Supabase n'est pas mise à jour.

## 📍 Étapes de Configuration

### 1. **Accès Supabase Dashboard**
```
🌐 URL: https://supabase.com/dashboard
🏢 Organisation: Votre organisation
📁 Projet: mhngbluefyucoesgcjoy (Loft Algérie)
```

### 2. **Navigation dans l'Interface**
```
Authentication → URL Configuration
```

### 3. **Site URL (Configuration Principale)**
```
Champ: Site URL
❌ Valeur actuelle: http://localhost:3000
✅ Nouvelle valeur: https://loftalgerie.com
```

### 4. **Redirect URLs (URLs de Redirection)**

**Dans le champ "Redirect URLs", remplacez TOUT par :**

```
https://loftalgerie.com/api/auth/callback
https://loftalgerie.com/auth/callback
https://loftalgerie.com/api/auth/reset-password
https://loftalgerie.com/auth/reset-password
https://loftalgerie.com/login
https://loftalgerie.com/register
https://loftalgerie.com/dashboard
https://loftalgerie.com/client/dashboard
https://loftalgerie.com/partner/dashboard
```

### 5. **Configuration des Providers OAuth**

#### **Google OAuth Provider**
```
Navigation: Authentication → Providers → Google
Champ: Authorized redirect URIs
Valeur: https://loftalgerie.com/api/auth/callback
```

#### **GitHub OAuth Provider**
```
Navigation: Authentication → Providers → GitHub  
Champ: Authorization callback URL
Valeur: https://loftalgerie.com/api/auth/callback
```

### 6. **Configuration Avancée (Optionnel)**

#### **Additional Settings**
```
- JWT expiry: 3600 (1 heure)
- Refresh token rotation: Enabled
- Reuse interval: 10 (secondes)
```

## ✅ Checklist de Vérification

- [ ] Site URL mis à jour vers `https://loftalgerie.com`
- [ ] Toutes les URLs localhost supprimées des Redirect URLs
- [ ] Toutes les URLs loftalgerie.com ajoutées aux Redirect URLs
- [ ] Google OAuth redirect URI configuré
- [ ] GitHub OAuth callback URL configuré
- [ ] Configuration sauvegardée (bouton "Save")

## 🧪 Test Après Configuration

### Test 1: Connexion Google OAuth
```
1. Aller sur https://loftalgerie.com/login
2. Sélectionner un rôle (Client/Partner/Employee)
3. Cliquer sur "Google"
4. ✅ Doit rester sur loftalgerie.com (pas localhost)
5. ✅ Doit rediriger vers le dashboard approprié
```

### Test 2: Connexion GitHub OAuth
```
1. Même processus avec GitHub
2. ✅ Vérifier que la redirection reste sur loftalgerie.com
```

## 🚨 Points Critiques

### ⚠️ Erreurs Communes
- **Oublier de sauvegarder** après modification
- **Laisser des URLs localhost** dans la liste
- **Oublier de configurer les providers** individuellement

### 🔍 Debugging
Si ça ne marche toujours pas :
1. Vérifiez les logs Supabase (Authentication → Logs)
2. Vérifiez la console du navigateur pour les erreurs
3. Testez avec un navigateur en mode incognito

## 📱 Configuration Mobile (Si Applicable)
```
iOS: loftalgerie://auth/callback
Android: loftalgerie://auth/callback
```

## 🔗 URLs de Référence

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentation OAuth**: https://supabase.com/docs/guides/auth/social-login
- **Votre Site**: https://loftalgerie.com

---

## 🎯 Résultat Attendu

Après cette configuration, quand vous cliquez sur OAuth (Google/GitHub) depuis `https://loftalgerie.com/login`, vous devriez :

1. ✅ Rester sur le domaine `loftalgerie.com` 
2. ✅ Être redirigé vers le dashboard approprié
3. ✅ Ne plus voir `localhost:3000` nulle part

**C'est cette configuration Supabase qui est la vraie solution !** 🎉