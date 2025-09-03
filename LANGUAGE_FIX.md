# 🌍 Configuration de la Langue par Défaut

## 🔍 Problème Identifié

L'interface affiche du texte en arabe alors que l'utilisateur préfère le français :
- Navigation : "لوحة التحكم" au lieu de "Tableau de Bord"
- Menus : "المحادثات" au lieu de "Conversations"  
- Boutons : "تسجيل الخروج" au lieu de "Se Déconnecter"

**Note :** L'arabe reste une langue supportée, nous définissons simplement le français comme langue par défaut.

## 🛠️ Solutions Disponibles

### Solution 1 : Page de Réinitialisation Automatique
1. **Ouvrir dans le navigateur** : `http://localhost:3000/reset-language.html`
2. **Attendre** la redirection automatique (2 secondes)
3. **Vider le cache** : `Ctrl+Shift+R` ou `Cmd+Shift+R`

### Solution 2 : Sélecteur de Langue
1. **Ouvrir** : `scripts/set-default-french.html` dans le navigateur
2. **Choisir** votre langue préférée (🇫🇷 Français recommandé)
3. **Attendre** la redirection vers `/dashboard`

### Solution 3 : Script de Force Français (Ancien)
1. **Ouvrir** : `scripts/force-french-language.html` dans le navigateur
2. **Cliquer** sur "🇫🇷 Forcer le Français"
3. **Attendre** la redirection vers `/dashboard`

### Solution 3 : Manuel (Console du Navigateur)
```javascript
// Nettoyer les cookies de langue
document.cookie = 'language=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
document.cookie = 'i18nextLng=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

// Définir le français
document.cookie = 'language=fr; path=/; max-age=31536000; SameSite=Lax';
localStorage.setItem('i18nextLng', 'fr');

// Recharger
location.reload();
```

### Solution 4 : Redémarrage Complet
1. **Arrêter le serveur** : `Ctrl+C`
2. **Redémarrer** : `npm run dev`
3. **Ouvrir** : `http://localhost:3000/reset-language.html`
4. **Vider le cache** du navigateur

## 🔧 Modifications Effectuées

### Middleware (`middleware.ts`)
- Force le français si la langue est arabe
- Définit des cookies avec une durée d'un an
- Utilise `SameSite=Lax` pour la compatibilité

### Contexte i18n (`lib/i18n/context.tsx`)
- Exclut l'arabe comme langue par défaut
- Force le français si aucune langue valide n'est détectée

### Scripts de Maintenance
- `scripts/diagnose-language.mjs` : Diagnostic complet
- `scripts/reset-to-french.mjs` : Réinitialisation automatique
- `scripts/force-french-language.html` : Interface graphique
- `public/reset-language.html` : Page de réinitialisation web

## 📋 Vérification

Après avoir appliqué une solution, vérifiez que :
- ✅ Navigation affiche "Tableau de Bord"
- ✅ Menu affiche "Conversations"
- ✅ Bouton affiche "Se Déconnecter"
- ✅ Sélecteur de langue montre le drapeau français 🇫🇷

## 🐛 Dépannage

### Si le problème persiste :

1. **Vider complètement le cache** :
   - Chrome : `Ctrl+Shift+Delete` → Tout effacer
   - Firefox : `Ctrl+Shift+Delete` → Tout effacer
   - Safari : `Cmd+Option+E`

2. **Mode navigation privée** :
   - Tester dans un onglet privé/incognito
   - Si ça fonctionne, le problème vient du cache

3. **Cookies tiers** :
   - Désactiver les extensions de navigateur
   - Vérifier les paramètres de cookies

4. **Redémarrage serveur** :
   ```bash
   # Arrêter le serveur
   Ctrl+C
   
   # Nettoyer le cache Next.js
   rm -rf .next
   
   # Redémarrer
   npm run dev
   ```

### Vérification des cookies :
```javascript
// Dans la console du navigateur
console.log('Langue actuelle:', document.cookie.split(';').find(c => c.includes('language')));
console.log('LocalStorage:', localStorage.getItem('i18nextLng'));
```

## 🎯 Résultat Attendu

Après correction, l'interface doit afficher :
- 🇫🇷 **Navigation** : "Tableau de Bord", "Conversations", "Tâches"
- 🇫🇷 **Boutons** : "Se Déconnecter", "Nouvelle conversation"
- 🇫🇷 **Messages** : "Aucun message", "Rechercher des conversations"
- 🇫🇷 **Statuts** : "En ligne", "Hors ligne"

## 📞 Support

Si aucune solution ne fonctionne :
1. Vérifier les logs du serveur
2. Tester avec un autre navigateur
3. Vérifier les fichiers de traduction dans `public/locales/fr/`
4. Contacter l'équipe de développement avec les détails du navigateur et de l'OS