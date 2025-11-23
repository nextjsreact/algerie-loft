# Photos des Lofts Recommandés

Ce dossier contient les photos affichées dans la section "Lofts Recommandés" de la page d'accueil.

## 📸 Format des photos

- **Format recommandé** : JPG ou WebP
- **Dimensions recommandées** : 1000x600px (ratio 5:3)
- **Taille maximale** : 500 KB par photo
- **Résolution** : Optimisée pour le web

## 📁 Organisation

Placez vos photos ici avec des noms descriptifs :

```
public/lofts/
├── hydra-loft-1.jpg
├── hydra-loft-2.jpg
├── oran-penthouse-1.jpg
├── oran-penthouse-2.jpg
├── constantine-loft-1.jpg
└── constantine-loft-2.jpg
```

## 🔄 Comment changer les photos

### Option 1 : Utiliser vos propres photos (Recommandé)

1. **Préparez vos photos**
   - Prenez des photos de qualité de vos lofts
   - Redimensionnez-les à 1000x600px
   - Optimisez-les (voir section Optimisation)

2. **Uploadez dans ce dossier**
   ```
   public/lofts/votre-photo.jpg
   ```

3. **Modifiez le fichier de configuration**
   - Ouvrez `config/featured-lofts-images.ts`
   - Changez `current` pour pointer vers votre photo :
   ```typescript
   loft1: {
     current: "/lofts/hydra-loft-1.jpg",  // Votre photo locale
   }
   ```

4. **Sauvegardez** - Les changements apparaissent automatiquement !

### Option 2 : Utiliser Unsplash (Photos gratuites)

1. **Trouvez une photo sur Unsplash**
   - Allez sur https://unsplash.com
   - Recherchez "modern apartment", "loft", "penthouse", etc.
   - Cliquez sur une photo qui vous plaît

2. **Copiez l'URL**
   - Clic droit sur la photo → "Copier l'adresse de l'image"
   - Ou utilisez le format : `https://images.unsplash.com/photo-XXXXX?w=1000&h=600&fit=crop`

3. **Modifiez le fichier de configuration**
   - Ouvrez `config/featured-lofts-images.ts`
   - Remplacez l'URL dans `current` :
   ```typescript
   loft1: {
     current: "https://images.unsplash.com/photo-VOTRE-ID?w=1000&h=600&fit=crop",
   }
   ```

## 🎨 Optimisation des photos

### Avec des outils en ligne

- [TinyJPG](https://tinyjpg.com/) - Compression JPG/PNG
- [Squoosh](https://squoosh.app/) - Optimisation avancée
- [Compressor.io](https://compressor.io/) - Compression rapide

### Avec ImageMagick (ligne de commande)

```bash
# Redimensionner et optimiser
magick votre-photo.jpg -resize 1000x600^ -gravity center -extent 1000x600 -quality 85 photo-optimisee.jpg
```

### Avec Photoshop

1. Fichier → Exporter → Enregistrer pour le web
2. Format : JPEG
3. Qualité : 80-85%
4. Dimensions : 1000x600px

## 📋 Checklist avant d'uploader

- [ ] Photo de bonne qualité (nette, bien éclairée)
- [ ] Dimensions : 1000x600px (ou ratio 5:3)
- [ ] Taille : < 500 KB
- [ ] Format : JPG ou WebP
- [ ] Nom descriptif : `lieu-type-numero.jpg`

## 🔍 Exemples de bonnes photos

### ✅ Bonnes pratiques

- Lumière naturelle abondante
- Pièce bien rangée et propre
- Angle qui montre l'espace
- Couleurs vives et attrayantes
- Mise au point nette

### ❌ À éviter

- Photos floues ou sombres
- Pièces en désordre
- Angles étranges
- Surexposition ou sous-exposition
- Filtres excessifs

## 🗂️ Rotation des photos

Pour faire tourner les photos régulièrement :

1. **Préparez plusieurs photos** pour chaque loft
2. **Nommez-les avec des numéros** : `hydra-loft-1.jpg`, `hydra-loft-2.jpg`, etc.
3. **Changez dans la config** quand vous voulez :
   ```typescript
   loft1: {
     current: "/lofts/hydra-loft-2.jpg",  // Nouvelle photo
   }
   ```

## 📊 Photos actuelles

| Loft | Photo actuelle | Source |
|------|---------------|--------|
| Hydra, Alger | Unsplash | Photo d'exemple |
| Oran Centre | Unsplash | Photo d'exemple |
| Constantine | Unsplash | Photo d'exemple |

**Remplacez ces photos d'exemple par vos vraies photos de lofts !**

## 🆘 Dépannage

### La photo ne s'affiche pas

1. Vérifiez que le fichier existe dans `public/lofts/`
2. Vérifiez le nom du fichier (sensible à la casse)
3. Vérifiez le chemin dans `config/featured-lofts-images.ts`
4. Videz le cache du navigateur (Ctrl+Shift+R)

### La photo est déformée

1. Vérifiez les dimensions (ratio 5:3 recommandé)
2. Utilisez `fit=crop` dans l'URL Unsplash
3. Redimensionnez la photo avant de l'uploader

### La photo est trop lourde

1. Compressez avec TinyJPG ou Squoosh
2. Réduisez la qualité à 80-85%
3. Vérifiez que les dimensions sont correctes (1000x600px)

## 📞 Support

Pour toute question :
- Consultez `config/featured-lofts-images.ts` pour la configuration
- Voir ce README pour les instructions
- Testez sur http://localhost:3000 après chaque changement
