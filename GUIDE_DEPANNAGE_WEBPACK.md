# 🔧 GUIDE DE DÉPANNAGE WEBPACK
## Résolution des Erreurs de Développement

Ce guide vous aide à résoudre rapidement les erreurs webpack et de développement courantes.

## ⚡ Solution Rapide (Recommandée)

### 1. Script Automatique de Correction
```bash
# Correction automatique de tous les problèmes courants
npm run fix:webpack
```

### 2. Redémarrage Propre
```bash
# Nettoyage et redémarrage
npm run dev:clean
```

## 🚨 Erreurs Courantes et Solutions

### Erreur: "webpack-internal" ou "next-devtools"
```
Symptômes: Erreurs dans la console avec des références à webpack-internal
Cause: Problèmes de cache ou configuration webpack
```

**Solution:**
```bash
# 1. Nettoyer le cache
rmdir /s /q .next
rmdir /s /q node_modules\.cache
npm cache clean --force

# 2. Redémarrer
npm run dev
```

### Erreur: "Module not found: Can't resolve 'fs'"
```
Symptômes: Erreurs lors de l'utilisation de jsPDF ou autres libs client-side
Cause: Tentative d'utilisation de modules Node.js côté client
```

**Solution:** ✅ Déjà corrigée dans `next.config.mjs`
```javascript
// Configuration webpack automatique
config.resolve.fallback = {
  fs: false,
  net: false,
  tls: false,
  // ... autres modules Node.js
}
```

### Erreur: "Critical dependency: the request of a dependency is an expression"
```
Symptômes: Warnings lors de la compilation
Cause: Dépendances dynamiques dans les modules
```

**Solution:** ✅ Déjà corrigée - warnings ignorés automatiquement

### Erreur: Compilation lente ou qui plante
```
Symptômes: npm run dev très lent ou qui s'arrête
Cause: Problèmes de cache ou de surveillance des fichiers
```

**Solution:**
```bash
# Nettoyage complet
npm run fix:webpack

# Ou manuellement:
rmdir /s /q .next
rmdir /s /q node_modules
npm install
npm run dev
```

## 🛠️ Étapes de Dépannage Complètes

### Niveau 1: Nettoyage Rapide
```bash
# Arrêter le serveur (Ctrl+C)
rmdir /s /q .next
npm run dev
```

### Niveau 2: Nettoyage Cache
```bash
rmdir /s /q .next
rmdir /s /q node_modules\.cache
npm cache clean --force
npm run dev
```

### Niveau 3: Réinstallation Partielle
```bash
npm run fix:webpack
# Ou manuellement:
npm install next@latest react@latest react-dom@latest
npm run dev
```

### Niveau 4: Réinstallation Complète
```bash
rmdir /s /q node_modules
rmdir /s /q .next
npm install
npm run dev
```

### Niveau 5: Reset Complet
```bash
# Sauvegarder vos modifications git d'abord!
git stash
rmdir /s /q node_modules
rmdir /s /q .next
del package-lock.json
npm install
npm run dev
git stash pop
```

## 📊 Test des Fonctionnalités

### Après Correction, Testez:

#### 1. Application de Base
```bash
npm run dev
# Vérifiez que l'app démarre sans erreurs
```

#### 2. Rapports PDF
```bash
npm run reports:test
# Vérifiez que les PDFs se génèrent
```

#### 3. Base de Données
```bash
npm run test-env
# Vérifiez la connexion DB
```

#### 4. Fonctionnalités Complètes
- Naviguez vers `/reports`
- Testez la génération de rapports
- Vérifiez les autres pages de l'app

## 🔍 Diagnostic Avancé

### Vérifier les Versions
```bash
node --version    # Doit être >= 18.0.0
npm --version     # Doit être >= 8.0.0
```

### Vérifier les Dépendances Critiques
```bash
npm list next react react-dom jspdf
```

### Logs Détaillés
```bash
# Activer les logs détaillés
set NEXT_PUBLIC_DEBUG_MODE=true
npm run dev
```

### Vérifier la Configuration
```bash
# Vérifier next.config.mjs
type next.config.mjs

# Vérifier package.json
type package.json | findstr "next\|react\|jspdf"
```

## 🚀 Optimisations de Performance

### Configuration Recommandée pour le Développement
```javascript
// Dans next.config.mjs (déjà appliquée)
const nextConfig = {
  // Désactiver le mode strict en dev pour éviter les erreurs
  reactStrictMode: false,
  
  // Optimiser la surveillance des fichiers
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  }
}
```

### Variables d'Environnement Utiles
```env
# Dans .env.local pour le debug
NEXT_PUBLIC_DEBUG_MODE=true
NODE_OPTIONS="--max-old-space-size=4096"
```

## 🔧 Scripts Utiles

### Scripts Disponibles
```bash
npm run fix:webpack        # Correction automatique
npm run dev:clean         # Nettoyage et redémarrage
npm run reports:test      # Test des rapports PDF
npm run test-env          # Test environnement
```

### Scripts Personnalisés
```bash
# Ajoutez dans package.json si nécessaire
"debug:dev": "cross-env NODE_OPTIONS='--inspect' npm run dev"
"dev:verbose": "cross-env DEBUG=* npm run dev"
```

## 📞 Support Supplémentaire

### Si les Problèmes Persistent

1. **Vérifiez votre environnement:**
   - Windows 10/11 à jour
   - Node.js >= 18.0.0
   - npm >= 8.0.0

2. **Redémarrez complètement:**
   - Fermez VS Code / votre IDE
   - Redémarrez le terminal
   - Relancez l'application

3. **Vérifiez les conflits:**
   - Désactivez temporairement les extensions VS Code
   - Fermez les autres applications Node.js
   - Vérifiez qu'aucun autre serveur n'utilise le port 3000

4. **Logs détaillés:**
   ```bash
   # Capturez les logs complets
   npm run dev > debug.log 2>&1
   # Puis examinez debug.log
   ```

## ✅ Checklist de Vérification

Après correction, vérifiez que:

- [ ] `npm run dev` démarre sans erreurs
- [ ] L'application s'ouvre dans le navigateur
- [ ] Aucune erreur dans la console du navigateur
- [ ] `npm run reports:test` fonctionne
- [ ] La page `/reports` est accessible
- [ ] Les rapports PDF se génèrent correctement

---

**💡 Conseil:** En cas de doute, utilisez toujours `npm run fix:webpack` qui applique automatiquement toutes les corrections connues.