# 📏 Guide des Tailles de Logo - Loft Algérie

## 🎯 Tailles Disponibles

| Composant | Dimensions | Usage Recommandé | Timeout |
|-----------|------------|------------------|---------|
| `CompactLogo` | 80x24px | Navigation mobile, sidebar étroite | 2s |
| `HeaderLogo` | 120x36px | Barre de navigation desktop | 3s |
| `FooterLogo` | 160x48px | Pied de page | 4s |
| `HeroLogo` | 350x140px | Section hero, landing page | 6s |

## 🚀 Utilisation

### Navigation Desktop Standard
```tsx
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';

<nav className="h-16 flex items-center">
  <HeaderLogo />
  {/* Menu items */}
</nav>
```

### Navigation Mobile Compacte
```tsx
import { CompactLogo } from '@/components/futuristic/AnimatedLogo';

<nav className="h-12 flex items-center md:hidden">
  <CompactLogo />
  {/* Mobile menu button */}
</nav>
```

### Navigation Responsive
```tsx
import { HeaderLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';

<nav className="flex items-center">
  {/* Desktop */}
  <HeaderLogo className="hidden md:block" />
  
  {/* Mobile */}
  <CompactLogo className="md:hidden" />
</nav>
```

### Sidebar Admin
```tsx
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';

<aside className="w-64 bg-gray-900">
  <div className="p-4">
    <HeaderLogo />
  </div>
  {/* Sidebar content */}
</aside>
```

## 📱 Recommandations par Contexte

### 🖥️ Desktop
- **Barre de navigation principale** : `HeaderLogo` (120x36px)
- **Sidebar large (>200px)** : `HeaderLogo` (120x36px)
- **Sidebar étroite (<150px)** : `CompactLogo` (80x24px)

### 📱 Mobile
- **Navigation mobile** : `CompactLogo` (80x24px)
- **Menu hamburger** : `CompactLogo` (80x24px)
- **Bottom navigation** : `CompactLogo` (80x24px)

### 🎨 Pages Spéciales
- **Landing page** : `HeroLogo` (350x140px)
- **Page d'accueil** : `HeroLogo` (350x140px)
- **Pied de page** : `FooterLogo` (160x48px)

## 🎛️ Personnalisation

### Taille Custom
```tsx
import AnimatedLogo from '@/components/futuristic/AnimatedLogo';

<AnimatedLogo
  variant="header"
  width={100}
  height={30}
  className="custom-logo"
/>
```

### Gestion d'Erreurs
```tsx
<HeaderLogo 
  onLoadError={(error) => {
    console.error('Logo failed to load:', error);
    // Handle error (analytics, fallback, etc.)
  }}
/>
```

### Fallbacks Personnalisés
```tsx
<HeaderLogo 
  fallbackSources={['/custom-logo.svg', '/backup-logo.png']}
  loadingTimeout={2000}
/>
```

## 🎨 Intégration CSS

### Classes Utilitaires
```css
/* Hauteur maximale pour navigation */
.nav-logo { max-height: 2.25rem; } /* 36px */

/* Hauteur maximale pour mobile */
.mobile-logo { max-height: 1.5rem; } /* 24px */

/* Responsive */
@media (max-width: 768px) {
  .responsive-logo {
    max-height: 1.5rem;
  }
}
```

### Alignement Vertical
```tsx
<div className="flex items-center h-16">
  <HeaderLogo className="mr-4" />
  <span>Menu Items</span>
</div>
```

## 🔧 Dépannage

### Logo Trop Grand
- Utilisez `CompactLogo` au lieu de `HeaderLogo`
- Ajoutez `max-h-6` ou `max-h-9` en className
- Vérifiez les contraintes de hauteur du conteneur parent

### Logo Trop Petit
- Utilisez `HeaderLogo` au lieu de `CompactLogo`
- Augmentez les dimensions avec des props custom
- Vérifiez que le conteneur a assez d'espace

### Performance
- `CompactLogo` a le timeout le plus court (2s)
- `HeaderLogo` est optimisé pour la navigation (3s)
- Utilisez `priority={true}` pour les logos above-the-fold

## 📊 Tests

### Pages de Test Disponibles
- `/fr/test-logo-fix` - Test de tous les variants
- `/fr/logo-menu-demo` - Démonstration d'intégration menu
- `/fr/logo-diagnostic` - Diagnostic complet

### Vérification Rapide
```bash
# Serveur de développement
npm run dev

# Test des tailles
curl -I http://localhost:3001/fr/test-logo-fix
```

## 🎯 Résumé

✅ **CompactLogo (80x24px)** - Parfait pour les barres de menu étroites  
✅ **HeaderLogo (120x36px)** - Taille optimale pour navigation desktop  
✅ **Système responsive** - Adaptation automatique selon l'écran  
✅ **Performance optimisée** - Timeouts adaptés par usage  

Le logo s'intègre maintenant parfaitement dans toutes les barres de menu ! 🚀