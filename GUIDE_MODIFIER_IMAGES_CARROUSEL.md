# 🎠 Guide : Modifier les Images du Carrousel de la Page d'Accueil

## 📍 Où sont stockées les images ?

Les images du carrousel sont définies dans **deux endroits** :

### 1. **Carrousel Hero (Grand carrousel en haut)** 
📁 Fichier : `components/homepage/FusionDualAudienceHomepage.tsx`
📍 Ligne : 23-93

### 2. **Section Lofts Recommandés (Petites cartes)**
📁 Fichier : `config/featured-lofts-images.ts`

---

## 🎯 Comment Modifier les Images ?

### Option A : Modifier le Grand Carrousel Hero

**Étape 1 :** Ouvrez le fichier
```
components/homepage/FusionDualAudienceHomepage.tsx
```

**Étape 2 :** Trouvez la section `heroSlides` (ligne ~23)

**Étape 3 :** Modifiez les URLs des images :

```typescript
const heroSlides = [
  {
    id: 1,
    image: "VOTRE_NOUVELLE_IMAGE_ICI",  // ← Changez cette URL
    title: {
      fr: "Loft Moderne Hydra",
      en: "Modern Hydra Loft",
      ar: "شقة حديثة في حيدرة"
    },
    subtitle: {
      fr: "Vue panoramique sur la baie d'Alger",
      en: "Panoramic view of Algiers bay",
      ar: "إطلالة بانورامية على خليج الجزائر"
    },
    price: "25,000 DZD/nuit"
  },
  // ... autres slides
];
```

---

### Option B : Modifier les Lofts Recommandés

**Étape 1 :** Ouvrez le fichier
```
config/featured-lofts-images.ts
```

**Étape 2 :** Modifiez les URLs :

```typescript
export const featuredLoftsImages = {
  loft1: {
    current: "VOTRE_NOUVELLE_IMAGE_ICI",  // ← Changez ici
  },
  loft2: {
    current: "VOTRE_NOUVELLE_IMAGE_ICI",  // ← Changez ici
  },
  loft3: {
    current: "VOTRE_NOUVELLE_IMAGE_ICI",  // ← Changez ici
  },
};
```

---

## 📷 Deux Méthodes pour les Images

### Méthode 1 : Utiliser des URLs Unsplash (Rapide)

1. Allez sur https://unsplash.com
2. Recherchez "modern apartment" ou "luxury loft"
3. Cliquez sur une photo
4. Copiez l'URL
5. Ajoutez les paramètres de taille :

**Pour le grand carrousel :**
```typescript
image: "https://images.unsplash.com/photo-XXXXXX?w=1920&h=1080&fit=crop"
```

**Pour les petites cartes :**
```typescript
current: "https://images.unsplash.com/photo-XXXXXX?w=500&h=300&fit=crop"
```

---

### Méthode 2 : Utiliser vos propres photos (Recommandé)

**Étape 1 :** Placez vos photos dans le dossier
```
public/lofts/
```

**Étape 2 :** Nommez vos fichiers de manière descriptive
```
public/lofts/
├── hydra-loft-hero.jpg      (pour le grand carrousel)
├── oran-penthouse-hero.jpg
├── constantine-loft-hero.jpg
├── hydra-loft-card.jpg      (pour les petites cartes)
├── oran-penthouse-card.jpg
└── constantine-loft-card.jpg
```

**Étape 3 :** Référencez-les dans le code

**Pour le grand carrousel :**
```typescript
const heroSlides = [
  {
    id: 1,
    image: "/lofts/hydra-loft-hero.jpg",  // ← Votre photo locale
    // ...
  }
];
```

**Pour les petites cartes :**
```typescript
export const featuredLoftsImages = {
  loft1: {
    current: "/lofts/hydra-loft-card.jpg",  // ← Votre photo locale
  },
};
```

---

## 📐 Spécifications des Images

### Grand Carrousel Hero
| Critère | Valeur |
|---------|--------|
| **Dimensions** | 1920x1080px |
| **Ratio** | 16:9 |
| **Format** | JPG ou WebP |
| **Taille max** | < 800 KB |
| **Qualité** | 85% |

### Petites Cartes Lofts
| Critère | Valeur |
|---------|--------|
| **Dimensions** | 1000x600px |
| **Ratio** | 5:3 |
| **Format** | JPG ou WebP |
| **Taille max** | < 500 KB |
| **Qualité** | 80% |

---

## ➕ Ajouter une Nouvelle Image au Carrousel

Pour ajouter une 6ème image au grand carrousel :

**Étape 1 :** Ouvrez `components/homepage/FusionDualAudienceHomepage.tsx`

**Étape 2 :** Ajoutez un nouvel objet dans `heroSlides` :

```typescript
const heroSlides = [
  // ... slides existants
  {
    id: 6,  // ← Nouveau numéro
    image: "/lofts/ma-nouvelle-image.jpg",  // ← Votre image
    title: {
      fr: "Titre en Français",
      en: "Title in English",
      ar: "العنوان بالعربية"
    },
    subtitle: {
      fr: "Sous-titre en français",
      en: "Subtitle in English",
      ar: "العنوان الفرعي بالعربية"
    },
    price: "30,000 DZD/nuit"
  }
];
```

**Étape 3 :** Sauvegardez le fichier

✅ Votre nouvelle image apparaîtra automatiquement dans le carrousel !

---

## 🗑️ Supprimer une Image du Carrousel

Pour retirer une image :

**Étape 1 :** Ouvrez `components/homepage/FusionDualAudienceHomepage.tsx`

**Étape 2 :** Supprimez l'objet complet de l'image :

```typescript
const heroSlides = [
  {
    id: 1,
    // ... garder
  },
  // {
  //   id: 2,
  //   ... supprimer tout ce bloc
  // },
  {
    id: 3,
    // ... garder
  }
];
```

---

## 🔧 Optimiser vos Photos

### Outils en ligne (Gratuits)

1. **TinyJPG** : https://tinyjpg.com
   - Compresse jusqu'à 70% sans perte visible
   - Glissez-déposez vos images

2. **Squoosh** : https://squoosh.app
   - Contrôle précis de la qualité
   - Comparaison avant/après

3. **Redimensionner** : https://www.iloveimg.com/resize-image
   - Ajustez aux dimensions exactes

---

## 🎨 Conseils pour de Belles Photos

### ✅ À faire
- 📸 Lumière naturelle abondante
- 🧹 Espaces propres et rangés
- 📐 Angles larges qui montrent l'espace
- 🎨 Couleurs vives et contrastées
- 🔍 Photos nettes et de haute qualité

### ❌ À éviter
- 🌑 Photos sombres ou sous-exposées
- 📦 Désordre visible
- 🔄 Angles déformés (fish-eye)
- 💡 Surexposition (trop de lumière)
- 🎭 Filtres Instagram excessifs

---

## 📊 Structure Complète des Fichiers

```
votre-projet/
├── components/
│   └── homepage/
│       └── FusionDualAudienceHomepage.tsx  ← Grand carrousel hero
├── config/
│   ├── featured-lofts-images.ts            ← Images des cartes lofts
│   └── featured-lofts-content.ts           ← Contenu des lofts
├── public/
│   └── lofts/                              ← Vos photos ici
│       ├── hydra-loft-hero.jpg
│       ├── oran-penthouse-hero.jpg
│       ├── hydra-loft-card.jpg
│       └── oran-penthouse-card.jpg
└── GUIDE_MODIFIER_IMAGES_CARROUSEL.md      ← Ce guide
```

---

## 🚀 Workflow Complet

### Pour changer une image existante

1. ✅ Trouvez ou créez votre nouvelle image
2. ✅ Optimisez-la avec TinyJPG
3. ✅ Redimensionnez aux bonnes dimensions
4. ✅ Placez-la dans `public/lofts/`
5. ✅ Modifiez le fichier correspondant :
   - Grand carrousel → `FusionDualAudienceHomepage.tsx`
   - Cartes lofts → `featured-lofts-images.ts`
6. ✅ Sauvegardez
7. ✅ Testez sur http://localhost:3000

### Pour ajouter une nouvelle image

1. ✅ Suivez les étapes ci-dessus
2. ✅ Ajoutez un nouvel objet dans `heroSlides`
3. ✅ Incrémentez le `id`
4. ✅ Ajoutez les traductions (FR, EN, AR)

---

## 🆘 Problèmes Courants

### ❌ L'image ne s'affiche pas

**Solutions :**
- Vérifiez le chemin : `/lofts/nom-exact.jpg`
- Vérifiez que le fichier existe dans `public/lofts/`
- Videz le cache : `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- Redémarrez le serveur : `npm run dev`

### ❌ L'image est déformée

**Solutions :**
- Utilisez les bonnes dimensions (1920x1080 ou 1000x600)
- Respectez le ratio (16:9 ou 5:3)
- Ajoutez `?fit=crop` aux URLs Unsplash

### ❌ La page charge lentement

**Solutions :**
- Compressez vos images (< 800 KB pour hero, < 500 KB pour cartes)
- Utilisez le format WebP au lieu de JPG
- Optimisez avec TinyJPG

### ❌ Le carrousel ne défile pas

**Solutions :**
- Vérifiez que tous les objets ont un `id` unique
- Vérifiez qu'il n'y a pas d'erreurs de syntaxe
- Ouvrez la console du navigateur (F12) pour voir les erreurs

---

## 📚 Ressources Utiles

- **Photos gratuites** : https://unsplash.com
- **Compression** : https://tinyjpg.com
- **Optimisation** : https://squoosh.app
- **Redimensionnement** : https://www.iloveimg.com
- **Guide photos lofts** : `GUIDE_PHOTOS_LOFTS.md`
- **Guide logos partenaires** : `GUIDE_PARTENAIRES_LOGOS.md`

---

## 📝 Exemple Complet

### Avant

```typescript
const heroSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&h=1080&fit=crop",
    title: {
      fr: "Loft Moderne Hydra",
      en: "Modern Hydra Loft",
      ar: "شقة حديثة في حيدرة"
    },
    subtitle: {
      fr: "Vue panoramique sur la baie d'Alger",
      en: "Panoramic view of Algiers bay",
      ar: "إطلالة بانورامية على خليج الجزائر"
    },
    price: "25,000 DZD/nuit"
  }
];
```

### Après (avec votre photo)

```typescript
const heroSlides = [
  {
    id: 1,
    image: "/lofts/mon-magnifique-loft-hydra.jpg",  // ← Votre photo !
    title: {
      fr: "Loft Moderne Hydra",
      en: "Modern Hydra Loft",
      ar: "شقة حديثة في حيدرة"
    },
    subtitle: {
      fr: "Vue panoramique sur la baie d'Alger",
      en: "Panoramic view of Algiers bay",
      ar: "إطلالة بانورامية على خليج الجزائر"
    },
    price: "25,000 DZD/nuit"
  }
];
```

---

## ✨ Résumé Rapide

**Pour modifier les images du carrousel :**

1. **Grand carrousel** → `components/homepage/FusionDualAudienceHomepage.tsx` (ligne ~23)
2. **Cartes lofts** → `config/featured-lofts-images.ts`
3. **Vos photos** → `public/lofts/`

**Dimensions :**
- Grand carrousel : 1920x1080px
- Cartes lofts : 1000x600px

**C'est tout !** 🎉

---

**Questions ?** Consultez les autres guides :
- `GUIDE_PHOTOS_LOFTS.md` - Guide détaillé photos
- `GUIDE_PARTENAIRES_LOGOS.md` - Guide logos partenaires
- `public/lofts/README.md` - Documentation complète
