# Guide de Gestion des Logos Partenaires

## Vue d'ensemble

Les logos des partenaires s'affichent sur la page d'accueil du site, juste avant le footer. Lorsqu'un utilisateur clique sur un logo, il est redirigé vers le site du partenaire dans un nouvel onglet.

## Emplacement

- **Page** : Page d'accueil (`/`)
- **Position** : Entre la section "Propriétaires" et le footer
- **Composant** : `components/homepage/PartnerLogos.tsx`

## Fonctionnalités

✅ **Affichage responsive** - S'adapte à toutes les tailles d'écran
✅ **Effet au survol** - Les logos passent de gris à couleur
✅ **Liens externes** - Ouvre le site du partenaire dans un nouvel onglet
✅ **Multilingue** - Titres traduits en français, anglais et arabe
✅ **Optimisé SEO** - Attributs alt et title pour chaque logo
✅ **Fallback** - Affiche le nom si l'image ne charge pas

## Comment ajouter un nouveau partenaire

### Étape 1 : Préparer le logo

1. **Format** : SVG (recommandé) ou PNG avec fond transparent
2. **Dimensions** : 200x80 pixels (ratio 2.5:1) pour PNG/JPG - SVG s'adapte automatiquement
3. **Taille** : Maximum 100 KB (SVG généralement < 10 KB)
4. **Nom du fichier** : `nom-partenaire-logo.svg` ou `.png`

### Étape 2 : Ajouter le logo au projet

Placez le fichier logo dans le dossier :
```
public/partners/nom-partenaire-logo.svg
```
ou
```
public/partners/nom-partenaire-logo.png
```

### Étape 3 : Modifier le code

Ouvrez le fichier `components/homepage/PartnerLogos.tsx` et ajoutez une entrée dans le tableau `partners` :

```typescript
const partners: Partner[] = [
  // ... partenaires existants
  {
    id: 'partner-nouveau',
    name: 'Nom du Partenaire',
    logo: '/partners/nom-partenaire-logo.svg',  // ou .png, .webp, .jpg
    website: 'https://www.site-partenaire.com',
    description: 'Description du partenaire'
  }
];
```

**Pour les logos avec texte blanc (mode dark) :**

Si votre logo a du texte blanc ou des couleurs claires, créez deux versions :

```typescript
{
  id: 'partner-nouveau',
  name: 'Nom du Partenaire',
  logo: '/partners/nom-partenaire-light.svg',      // Pour fond clair
  logoDark: '/partners/nom-partenaire-dark.svg',   // Pour fond sombre (optionnel)
  website: 'https://www.site-partenaire.com',
  description: 'Description du partenaire'
}
```

### Étape 4 : Tester

1. Lancez le serveur de développement : `npm run dev`
2. Allez sur la page d'accueil
3. Vérifiez que le logo s'affiche correctement
4. Testez le clic sur le logo
5. Vérifiez l'effet au survol

## Personnalisation

### Modifier le nombre de colonnes

Dans `PartnerLogos.tsx`, ligne avec `grid-cols-` :

```typescript
// 6 colonnes sur grand écran (actuel)
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"

// 4 colonnes sur grand écran
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
```

### Modifier les traductions

Dans `PartnerLogos.tsx`, section `translations` :

```typescript
const translations = {
  fr: {
    title: 'Nos Partenaires',
    subtitle: 'Ils nous font confiance'
  },
  en: {
    title: 'Our Partners',
    subtitle: 'They trust us'
  },
  ar: {
    title: 'شركاؤنا',
    subtitle: 'يثقون بنا'
  }
};
```

### Désactiver l'effet niveaux de gris

Dans `PartnerLogos.tsx`, retirez `grayscale` et `group-hover:grayscale-0` :

```typescript
// Avant
className="relative w-full h-16 grayscale group-hover:grayscale-0 transition-all"

// Après (toujours en couleur)
className="relative w-full h-16 transition-all"
```

### Modifier le style des cartes

Dans `PartnerLogos.tsx`, modifiez la classe du lien :

```typescript
className="group flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-100 dark:border-gray-700"
```

## Exemples de logos

### Logos SVG (recommandé - qualité parfaite)

```
✅ airbnb-logo.svg (vectoriel, léger, parfait)
✅ booking-logo.svg (s'adapte à toutes les tailles)
✅ expedia-logo.svg (poids minimal)
```

### Logos PNG (acceptable - avec transparence)

```
✅ tripadvisor-logo.png (fond transparent)
✅ hotels-logo.png (fond transparent)
```

### Logos avec fond blanc (à éviter)

```
⚠️ partner-logo.jpg (fond blanc, moins flexible)
```

## Optimisation des images

### Optimiser les SVG (recommandé)

**Outils en ligne :**
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - Optimisation SVG interactive
- [SVG Optimizer](https://svgoptimizer.com/) - Compression SVG

**Ligne de commande :**
```bash
# Installer SVGO
npm install -g svgo

# Optimiser un SVG
svgo logo.svg -o logo-optimise.svg
```

### Optimiser les PNG

**Avec ImageMagick :**
```bash
# Redimensionner
convert logo.png -resize 200x80 logo-optimise.png

# Optimiser la taille
convert logo.png -quality 85 -strip logo-optimise.png

# Les deux en une commande
convert logo.png -resize 200x80 -quality 85 -strip logo-optimise.png
```

**Outils en ligne :**
- [TinyPNG](https://tinypng.com/) - Compression PNG
- [Squoosh](https://squoosh.app/) - Optimisation d'images
- [Remove.bg](https://www.remove.bg/) - Supprimer le fond

## Structure du composant

```
PartnerLogos
├── Header (Titre + Sous-titre)
├── Grid de logos (2-3-6 colonnes responsive)
│   └── Carte partenaire (x6)
│       ├── Lien externe
│       ├── Image logo
│       └── Effet hover
└── CTA "Devenir partenaire"
```

## Ordre d'affichage

Les partenaires s'affichent dans l'ordre défini dans le tableau `partners`. Pour réorganiser :

```typescript
const partners: Partner[] = [
  { id: 'partner-1', ... },  // Première position
  { id: 'partner-2', ... },  // Deuxième position
  { id: 'partner-3', ... },  // Troisième position
  // etc.
];
```

## Supprimer un partenaire

1. Ouvrez `components/homepage/PartnerLogos.tsx`
2. Supprimez l'entrée du partenaire dans le tableau `partners`
3. (Optionnel) Supprimez le fichier logo de `public/partners/`

## Masquer la section partenaires

Pour masquer temporairement la section sans supprimer le code :

Dans `components/homepage/DualAudienceHomepage.tsx`, commentez :

```typescript
{/* Partner Logos Section */}
{/* <PartnerLogos locale={locale} /> */}
```

## 🌓 Gestion du mode Dark

### Pourquoi deux versions ?

Les logos avec texte blanc ou couleurs claires ne sont pas visibles sur fond sombre. Le système supporte deux versions :

- **logo** : Version pour mode light (fond clair)
- **logoDark** : Version pour mode dark (fond sombre) - optionnel

### Comment créer une version dark ?

**Option 1 : Modifier le SVG**

Changez les couleurs dans le fichier SVG :
```xml
<!-- Version light (texte blanc) -->
<text fill="#ffffff">Mon Logo</text>

<!-- Version dark (texte gris clair) -->
<text fill="#e5e7eb">Mon Logo</text>
```

**Option 2 : Utiliser un éditeur**

1. Ouvrez le SVG dans Figma, Illustrator ou Inkscape
2. Changez les couleurs claires en couleurs plus foncées
3. Exportez sous un nouveau nom : `logo-dark.svg`

### Exemple complet

**Fichiers :**
- `destination-algerie-blanc-logo.svg` (texte blanc)
- `destination-algerie-dark-logo.svg` (texte gris clair)

**Code :**
```typescript
{
  id: 'destination-algeria',
  name: 'Destination Algeria',
  logo: '/partners/destination-algerie-blanc-logo.svg',
  logoDark: '/partners/destination-algerie-dark-logo.svg',
  website: 'https://www.destination-algeria.com'
}
```

**Résultat :** Le logo bascule automatiquement selon le thème !

### Si vous n'avez qu'une version

Pas de problème ! Si vous ne spécifiez pas `logoDark`, le même logo sera utilisé dans les deux modes. L'effet grayscale aide à l'adapter visuellement.

## Dépannage

### Le logo ne s'affiche pas

1. Vérifiez que le fichier existe dans `public/partners/`
2. Vérifiez le nom du fichier (sensible à la casse)
3. Vérifiez le chemin dans le code : `/partners/nom-fichier.png`
4. Videz le cache du navigateur (Ctrl+Shift+R)

### Le logo est déformé

1. Vérifiez les dimensions du logo (ratio 2.5:1 recommandé)
2. Utilisez `object-contain` au lieu de `object-cover`

### Le lien ne fonctionne pas

1. Vérifiez l'URL du site partenaire
2. Assurez-vous qu'elle commence par `https://`
3. Testez l'URL dans un navigateur

## Accessibilité

Le composant respecte les bonnes pratiques d'accessibilité :

- ✅ Attribut `alt` sur toutes les images
- ✅ Attribut `title` pour les infobulles
- ✅ `rel="noopener noreferrer"` pour les liens externes
- ✅ Contraste suffisant
- ✅ Taille de clic suffisante (minimum 44x44px)

## Performance

- Images optimisées avec Next.js Image
- Lazy loading automatique
- Tailles d'image responsive
- Fallback en cas d'erreur de chargement

## Support

Pour toute question ou problème, consultez :
- Ce guide
- Le README dans `public/partners/`
- Le code source dans `components/homepage/PartnerLogos.tsx`
