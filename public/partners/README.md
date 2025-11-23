# Logos des Partenaires

Ce dossier contient les logos des partenaires affichés sur la page d'accueil.

## Format des logos

- **Format recommandé** : PNG avec fond transparent
- **Dimensions recommandées** : 200x80px (ratio 2.5:1)
- **Taille maximale** : 100 KB par logo
- **Résolution** : 2x pour les écrans Retina

## Nomenclature des fichiers

Utilisez le format suivant pour nommer vos fichiers :
- `nom-partenaire-logo.png`

Exemples :
- `airbnb-logo.png`
- `booking-logo.png`
- `expedia-logo.png`

## Comment ajouter un nouveau partenaire

1. **Ajoutez le logo** dans ce dossier (`public/partners/`)

2. **Modifiez le fichier** `components/homepage/PartnerLogos.tsx`

3. **Ajoutez une entrée** dans le tableau `partners` :

```typescript
{
  id: 'partner-nom',
  name: 'Nom du Partenaire',
  logo: '/partners/nom-partenaire-logo.png',
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

Les logos suivants sont des exemples. Remplacez-les par vos vrais logos de partenaires :

- `airbnb-logo.png` - Exemple
- `booking-logo.png` - Exemple
- `expedia-logo.png` - Exemple
- `tripadvisor-logo.png` - Exemple
- `hotels-logo.png` - Exemple
- `agoda-logo.png` - Exemple

## Notes

- Les logos s'affichent en niveaux de gris par défaut
- Au survol, ils reprennent leurs couleurs
- Cliquer sur un logo redirige vers le site du partenaire
- Les logos sont responsive et s'adaptent à toutes les tailles d'écran
