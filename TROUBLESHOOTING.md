# 🔧 Guide de Dépannage - Page Futuriste

## 🚨 Problèmes Courants et Solutions

### 1. Erreur "hostname not configured" pour les images

**Problème :** `Invalid src prop, hostname "images.unsplash.com" is not configured`

**Solution :**
```bash
# 1. Vérifiez que next.config.mjs contient :
# images: {
#   remotePatterns: [
#     {
#       protocol: 'https',
#       hostname: 'images.unsplash.com',
#       port: '',
#       pathname: '/**',
#     }
#   ]
# }

# 2. Redémarrez le serveur
npm run restart:info
# Puis Ctrl+C et npm run dev
```

### 2. Images ne s'affichent pas

**Solutions par ordre de priorité :**

1. **Vérifiez vos images locales :**
   ```bash
   # Placez vos images dans public/loft-images/
   ls public/loft-images/
   ```

2. **Installez les images placeholder :**
   ```bash
   npm run setup:loft-images
   ```

3. **Vérifiez la console :**
   - Ouvrez F12 → Console
   - Recherchez les erreurs d'images

### 3. Animations lentes ou saccadées

**Diagnostic :**
```javascript
// Dans la console du navigateur
console.log('Performance:', navigator.hardwareConcurrency, 'cores');
console.log('Memory:', navigator.deviceMemory, 'GB');
```

**Solutions :**
- Le système s'adapte automatiquement
- Vérifiez `prefers-reduced-motion` dans les paramètres système
- Sur mobile : animations simplifiées automatiquement

### 4. Erreurs d'import de composants

**Problème :** `Element type is invalid`

**Solution :**
```bash
# Vérifiez les imports
npm run test:futuristic

# Si erreur, vérifiez :
# - Exports par défaut vs nommés
# - Chemins d'import corrects
# - Composants bien exportés
```

### 5. Page blanche ou erreur de build

**Solutions :**
```bash
# 1. Nettoyer le cache
rm -rf .next node_modules/.cache

# 2. Réinstaller les dépendances
npm install

# 3. Rebuild
npm run build

# 4. Si problème persiste
npm run dev
```

### 6. Problèmes de performance

**Vérifications :**
1. **FPS en temps réel :**
   ```javascript
   // Console navigateur
   const { fps } = useAnimationPerformance();
   console.log('FPS:', fps);
   ```

2. **Capacités détectées :**
   ```javascript
   const { deviceCapabilities } = useResponsiveAnimations();
   console.log('Device:', deviceCapabilities);
   ```

**Optimisations automatiques :**
- **Mobile** : Pas de particules, animations réduites
- **Low performance** : Durées raccourcies, pas de blur
- **Reduced motion** : Animations désactivées

### 7. Problèmes multilingues

**Vérifications :**
- URL correcte : `/fr/public`, `/en/public`, `/ar/public`
- Direction RTL pour l'arabe
- Textes traduits dans `FuturisticPublicPage.tsx`

### 8. Carrousel ne fonctionne pas

**Solutions :**
1. **Vérifiez les images :**
   ```bash
   # Images présentes ?
   ls public/loft-images/
   
   # Formats supportés ?
   # JPG, JPEG, PNG, WebP
   ```

2. **Console errors :**
   - F12 → Console
   - Recherchez erreurs de chargement

3. **Navigation :**
   - Flèches : Clic
   - Points : Clic
   - Mobile : Swipe
   - Auto-play : Se pause au hover

## 🛠️ Commandes de Debug

```bash
# Tester tous les composants
npm run test:futuristic

# Installer les images
npm run setup:loft-images

# Informations de redémarrage
npm run restart:info

# Diagnostics Next.js
npm run build 2>&1 | grep -i error

# Vérifier la configuration
cat next.config.mjs | grep -A 10 "images:"
```

## 📊 Métriques de Performance

### Dans la Console Navigateur :
```javascript
// FPS actuel
performance.now()

// Mémoire utilisée
performance.memory?.usedJSHeapSize

// Capacités réseau
navigator.connection?.effectiveType

// Cores CPU
navigator.hardwareConcurrency

// RAM estimée
navigator.deviceMemory
```

## 🔍 Logs Utiles

### Console Navigateur :
- `🖼️ Downloaded: loft-1.jpg` → Images téléchargées
- `⏭️ Skipped: loft-1.jpg (already exists)` → Images existantes
- `✅ Component structure test passed` → Composants OK

### Console Serveur :
- `Ready in Xms` → Serveur démarré
- `Compiled successfully` → Build OK
- `Error: Invalid src prop` → Problème d'images

## 🆘 Support d'Urgence

Si rien ne fonctionne :

1. **Revenir à l'ancienne version :**
   ```bash
   git checkout HEAD~1 app/[locale]/public/page.tsx
   ```

2. **Mode de secours :**
   - Commentez l'import `FuturisticPublicPage`
   - Utilisez l'ancien code statique

3. **Reset complet :**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

La page futuriste est conçue pour être robuste avec des fallbacks à chaque niveau ! 🚀