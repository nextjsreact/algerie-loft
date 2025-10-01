# Guide de Test - Réinitialisation de Mot de Passe

## ✅ Corrections Appliquées

Le système de réinitialisation de mot de passe a été complètement corrigé avec une architecture à deux étapes :

### Architecture :
1. **API Route** (`/api/auth/reset-password`) - Gère les tokens et la session
2. **Page UI** (`/reset-password`) - Interface de saisie du nouveau mot de passe

## 🧪 Guide de Test Étape par Étape

### 1. Préparation
```bash
# Démarrer le serveur
npm run dev
# Le serveur devrait démarrer sur http://localhost:3000
```

### 2. Test du Flux Complet

#### Étape 1 : Demande de Réinitialisation
1. **Aller sur :** `http://localhost:3000/fr/forgot-password`
2. **Saisir une adresse email** valide (utilisez une vraie adresse que vous contrôlez)
3. **Cliquer sur "Send Reset Link"**
4. **Vérifier dans les logs serveur** que l'email est "envoyé" (simulation)

#### Étape 2 : Simulation du Lien Email
Puisque nous sommes en développement, simulez le clic sur le lien email en allant directement sur :
```
http://localhost:3000/api/auth/reset-password?code=test&type=recovery
```

#### Étape 3 : Vérification de la Redirection
L'API devrait :
1. **Traiter le code** de réinitialisation
2. **Rediriger vers** `/fr/reset-password?access_token=...&refresh_token=...`
3. **Afficher la page** de saisie du nouveau mot de passe

#### Étape 4 : Saisie du Nouveau Mot de Passe
1. **Saisir un nouveau mot de passe** (minimum 6 caractères)
2. **Confirmer le mot de passe**
3. **Cliquer sur "Update Password"**
4. **Vérifier la redirection** vers la page de login

## 🔍 Debugging

### Si le système ne fonctionne pas :

#### 1. Vérifier les Logs Serveur
Regardez la console du serveur pour voir :
```
Reset password GET request: { code: 'test-code', type: 'recovery' }
Code exchange successful, redirecting to reset password page
```

#### 2. Vérifier les Paramètres URL
Sur la page `/fr/reset-password`, cliquez sur "Show Technical Details" pour voir :
- URL complète
- Présence des tokens
- Paramètres reçus

#### 3. Erreurs Courantes
- **"Invalid reset link"** : Vérifiez que `type=recovery` est présent
- **"Missing tokens"** : Vérifiez que l'échange de code a fonctionné
- **"Session error"** : Vérifiez la configuration Supabase

## ⚙️ Configuration Supabase Requise

Dans votre dashboard Supabase (`Authentication > URL Configuration`) :

### Redirect URLs :
```
http://localhost:3000/api/auth/reset-password
```

### Site URL :
```
http://localhost:3000
```

## 🚨 Note Importante

Le système est maintenant configuré pour fonctionner sur le **port 3000** standard :

### Ce qui a été corrigé :
- ✅ `.env` remis sur le port 3000 (configuration standard)
- ✅ Supabase configuré pour le port 3000
- ✅ Architecture complète créée pour la réinitialisation

### Action Requise :
- ✅ **Redémarrer le serveur** pour qu'il utilise le port 3000
- ✅ **Configurer Supabase** avec les URLs du port 3000

## 📝 Résolution du Problème Initial

**Problème :** L'utilisateur cliquait sur le lien de réinitialisation et était redirigé vers la page de login avec l'ancien mot de passe.

**Solution :** Création d'une architecture complète avec :
- ✅ Gestion automatique des sessions
- ✅ Échange sécurisé des codes
- ✅ Interface dédiée pour le nouveau mot de passe
- ✅ Redirections intelligentes

Le système devrait maintenant fonctionner correctement ! 🎉