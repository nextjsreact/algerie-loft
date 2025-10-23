# 🎨 Guide d'Intégration du Logo - Loft Algérie

## 📁 **Où Placer Votre Logo**

### Structure Recommandée
```
public/
├── logo.jpg                    # ✅ Votre logo principal
├── logo-white.jpg             # 🔲 Version blanche (optionnel)
├── logo-dark.jpg              # ⚫ Version sombre (optionnel)
├── favicon.ico                # 🌐 Icône navigateur (optionnel)
└── loft-images/               # 🖼️ Images du carrousel
```

## 📏 **Spécifications Techniques**

### Formats Supportés
- ✅ **JPG** (recommandé pour photos)
- ✅ **PNG** (recommandé pour logos avec transparence)
- ✅ **WebP** (format moderne, plus léger)

### Tailles Recommandées
- **Logo principal** : 400x120px (ratio 3.33:1)
- **Minimum** : 200x60px
- **Maximum** : 600x180px
- **Poids** : < 500KB (idéal < 200KB)

### Qualité
- **Résolution** : 2x pour écrans Retina
- **Compression** : Équilibre qualité/poids
- **Arrière-plan** : Transparent (PNG) ou blanc/couleur unie

## 🚀 **Étapes d'Installation**

### 1. Placer le Logo
```bash
# Copiez votre logo dans le dossier public
cp votre-logo.jpg public/logo.jpg
```

### 2. Vérifier l'Installation
```bash
npm run setup:logo
```

### 3. Tester le Logo
```bash
# Démarrer le serveur
npm run dev

# Visiter la page de test
http://localhost:3000/fr/logo-test
```

### 4. Voir le Résultat
```bash
# Page publique avec logo
http://localhost:3000/fr/public
```

## 🎯 **Emplacements du Logo**

### 1. **Header** (Navigation)
- **Taille** : 180x54px
- **Position** : Coin supérieur gauche
- **Animation** : Hover avec scale
- **Fichier** : `components/public/PublicHeader.tsx`

### 2. **Hero Section** (Page d'accueil)
- **Taille** : 300x90px
- **Position** : Centre, au-dessus du titre
- **Animation** : Fade-in + glow effect
- **Fichier** : `components/futuristic/FuturisticHero.tsx`

### 3. **Footer** (Pied de page)
- **Taille** : 160x48px
- **Position** : Footer
- **Animation** : Opacity hover
- **Fichier** : `components/public/PublicFooter.tsx`

## ⚙️ **Personnalisation Avancée**

### Modifier les Tailles
```typescript
// Dans components/futuristic/AnimatedLogo.tsx
<HeaderLogo 
  width={200}        // Largeur personnalisée
  height={60}        // Hauteur personnalisée
  showGlow={true}    // Effet de glow
/>
```

### Changer les Animations
```typescript
// Modifier les variants d'animation
const logoVariants = {
  hover: {
    scale: 1.1,              // Zoom au hover
    rotate: 5,               // Rotation
    transition: { duration: 0.3 }
  }
};
```

### Ajouter des Effets
```typescript
// Activer le glow effect
<HeroLogo 
  showGlow={true}
  className="drop-shadow-2xl"
/>
```

## 🎨 **Variantes de Logo**

### Logo Blanc (Mode Sombre)
```typescript
// Utilisation conditionnelle selon le thème
const logoSrc = isDark ? '/logo-white.jpg' : '/logo.jpg';
```

### Logo Adaptatif
```typescript
// Différentes versions selon la taille d'écran
const logoSrc = isMobile ? '/logo-mobile.jpg' : '/logo.jpg';
```

## 🧪 **Page de Test**

Visitez `/logo-test` pour :
- ✅ Tester différentes tailles
- ✅ Voir les animations en action
- ✅ Comparer les variantes
- ✅ Ajuster les effets

### Fonctionnalités de Test
- **Sélecteur de source** : Testez différents fichiers
- **Toggle glow** : Activez/désactivez les effets
- **Aperçu temps réel** : Voir les changements instantanément
- **Tailles multiples** : Comparez toutes les variantes

## 🔧 **Dépannage**

### Logo ne s'affiche pas
```bash
# 1. Vérifiez le fichier
ls -la public/logo.jpg

# 2. Vérifiez les permissions
chmod 644 public/logo.jpg

# 3. Redémarrez le serveur
npm run dev
```

### Logo trop grand/petit
```typescript
// Ajustez dans AnimatedLogo.tsx
width={votre_largeur}
height={votre_hauteur}
```

### Logo pixelisé
- ✅ Utilisez une image 2x plus grande
- ✅ Format PNG pour la netteté
- ✅ Qualité 90+ pour JPG

### Animations lentes
- ✅ Réduisez la taille du fichier (< 200KB)
- ✅ Optimisez l'image
- ✅ Le système s'adapte automatiquement

## 📊 **Optimisation**

### Compression d'Image
```bash
# Avec ImageOptim (Mac)
imageoptim logo.jpg

# Avec TinyPNG (Web)
# https://tinypng.com/

# Avec CLI
npx imagemin logo.jpg --out-dir=public/
```

### Formats Modernes
```bash
# Convertir en WebP
npx @squoosh/cli --webp '{"quality":85}' logo.jpg
```

## 🎉 **Résultat Final**

Votre logo sera visible :
- 🌐 **Header** : Sur toutes les pages
- 🏠 **Hero** : Page d'accueil avec effets
- 📱 **Mobile** : Adapté automatiquement
- 🌙 **Dark mode** : Version appropriée
- ✨ **Animations** : Effets fluides et modernes

## 📋 **Checklist**

- [ ] Logo placé dans `public/logo.jpg`
- [ ] Taille optimale (400x120px max)
- [ ] Poids < 500KB
- [ ] Test sur `/logo-test`
- [ ] Vérification sur `/public`
- [ ] Test mobile et desktop
- [ ] Test mode sombre/clair

Votre logo est maintenant parfaitement intégré dans votre site futuriste ! 🚀