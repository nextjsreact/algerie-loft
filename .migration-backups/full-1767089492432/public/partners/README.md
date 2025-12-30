# Logos des Partenaires

Ce dossier contient les logos des partenaires affichés sur la page d'accueil.

## Format des logos

- **Format recommandé** : SVG (vectoriel, qualité parfaite)
- **Formats acceptés** : SVG, PNG, WebP, JPG
- **Dimensions recommandées** : 200x80px (ratio 2.5:1) pour PNG/JPG
- **Taille maximale** : 100 KB par logo (SVG souvent < 10 KB)
- **Résolution** : SVG = parfait à toutes tailles, PNG = 2x pour Retina

## Nomenclature des fichiers

Utilisez le format suivant pour nommer vos fichiers :
- `nom-partenaire-logo.svg` (recommandé)
- `nom-partenaire-logo.png`

Exemples :
- `airbnb-logo.svg` ← Recommandé
- `booking-logo.png`
- `expedia-logo.webp`

## Comment ajouter un nouveau partenaire

1. **Ajoutez le logo** dans ce dossier (`public/partners/`)

2. **Modifiez le fichier** `components/homepage/PartnerLogos.tsx`

3. **Ajoutez une entrée** dans le tableau `partners` :

```typescript
{
  id: 'partner-nom',
  name: 'Nom du Partenaire',
  logo: '/partners/nom-partenaire-logo.svg',  // ou .png, .webp
  website: 'https://www.site-partenaire.com',
  description: 'Description du partenaire'
}
```

## Optimisation des images

Pour optimiser les logos :

```bash
# Installer imagemagick (si pas déjà installé)
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Redimensionner et optimiser
convert logo-original.png -resize 200x80 -quality 85 logo-optimise.png
```

## Logos actuels

Actuellement, le composant utilise des placeholders SVG colorés en base64.
Remplacez-les par vos vrais logos :

**Formats recommandés par ordre de préférence :**
1. **SVG** - Qualité parfaite, poids minimal
2. **PNG** - Avec fond transparent
3. **WebP** - Format moderne, bonne compression
4. **JPG** - Uniquement si fond uni

Exemples de noms de fichiers :
- `airbnb-logo.svg` ← Meilleur choix
- `booking-logo.png`
- `expedia-logo.webp`

## Exemple de logo SVG

Un fichier exemple est fourni : `example-logo.svg`

Pour créer votre propre logo SVG :
1. Exportez depuis Illustrator, Figma, ou Inkscape
2. Optimisez avec [SVGOMG](https://jakearchibald.github.io/svgomg/)
3. Placez dans ce dossier
4. Référencez dans le code : `/partners/votre-logo.svg`

## Notes

- Les logos s'affichent en niveaux de gris par défaut
- Au survol, ils reprennent leurs couleurs
- Cliquer sur un logo redirige vers le site du partenaire
- Les logos sont responsive et s'adaptent à toutes les tailles d'écran
- **SVG recommandé** : qualité parfaite, poids minimal, scalable
