# 📸 Guide Rapide : Changer les Photos des Lofts

## 🎯 Méthode Simple (3 étapes)

### Étape 1 : Ouvrez le fichier de configuration

```
config/featured-lofts-images.ts
```

### Étape 2 : Modifiez l'URL de la photo

```typescript
export const featuredLoftsImages = {
  loft1: {
    current: "VOTRE_NOUVELLE_URL_ICI",  // ← Changez ici
  },
  loft2: {
    current: "VOTRE_NOUVELLE_URL_ICI",  // ← Changez ici
  },
  loft3: {
    current: "VOTRE_NOUVELLE_URL_ICI",  // ← Changez ici
  },
};
```

### Étape 3 : Sauvegardez

Les changements apparaissent automatiquement ! 🎉

---

## 📷 Deux options pour les photos

### Option A : Photos Unsplash (Gratuit, Rapide)

1. Allez sur https://unsplash.com
2. Recherchez "modern apartment" ou "loft"
3. Cliquez sur une photo
4. Copiez l'URL de l'image
5. Collez dans `current:`

**Exemple :**
```typescript
current: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&h=600&fit=crop"
```

### Option B : Vos propres photos (Recommandé)

1. Placez votre photo dans `public/lofts/`
2. Nommez-la : `hydra-loft-1.jpg`
3. Référencez-la dans la config :

**Exemple :**
```typescript
current: "/lofts/hydra-loft-1.jpg"
```

---

## 📐 Spécifications des photos

| Critère | Valeur recommandée |
|---------|-------------------|
| **Dimensions** | 1000x600px |
| **Ratio** | 5:3 |
| **Format** | JPG ou WebP |
| **Taille** | < 500 KB |
| **Qualité** | 80-85% |

---

## 🔄 Exemple complet

### Avant (photos Unsplash)

```typescript
export const featuredLoftsImages = {
  loft1: {
    current: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
  },
};
```

### Après (vos photos)

```typescript
export const featuredLoftsImages = {
  loft1: {
    current: "/lofts/mon-beau-loft-hydra.jpg",  // Votre photo !
  },
};
```

---

## 🎨 Conseils pour de belles photos

### ✅ Bonnes pratiques

- 📸 Lumière naturelle (fenêtres ouvertes)
- 🧹 Pièce propre et rangée
- 📐 Angle qui montre l'espace
- 🎨 Couleurs vives
- 🔍 Photo nette (pas floue)

### ❌ À éviter

- 🌑 Photos sombres
- 📦 Désordre visible
- 🔄 Angles bizarres
- 💡 Surexposition
- 🎭 Filtres excessifs

---

## 🗂️ Organisation des fichiers

```
votre-projet/
├── config/
│   └── featured-lofts-images.ts  ← Fichier à modifier
├── public/
│   └── lofts/                    ← Vos photos ici
│       ├── hydra-loft-1.jpg
│       ├── oran-penthouse-1.jpg
│       └── constantine-loft-1.jpg
└── GUIDE_PHOTOS_LOFTS.md         ← Ce guide
```

---

## 🔧 Optimiser vos photos

### En ligne (Gratuit)

1. **TinyJPG** : https://tinyjpg.com
   - Uploadez votre photo
   - Téléchargez la version compressée

2. **Squoosh** : https://squoosh.app
   - Plus d'options de compression
   - Comparaison avant/après

### Photoshop

1. Fichier → Exporter → Enregistrer pour le web
2. Format : JPEG, Qualité : 80-85%
3. Dimensions : 1000x600px

---

## 🚀 Workflow recommandé

### Pour changer une photo

1. ✅ Prenez ou trouvez une belle photo
2. ✅ Optimisez-la (TinyJPG)
3. ✅ Uploadez dans `public/lofts/`
4. ✅ Modifiez `config/featured-lofts-images.ts`
5. ✅ Sauvegardez
6. ✅ Vérifiez sur http://localhost:3000

### Pour rotation régulière

**Préparez plusieurs photos :**
```
public/lofts/
├── hydra-loft-1.jpg  ← Semaine 1
├── hydra-loft-2.jpg  ← Semaine 2
├── hydra-loft-3.jpg  ← Semaine 3
└── hydra-loft-4.jpg  ← Semaine 4
```

**Changez dans la config :**
```typescript
loft1: {
  current: "/lofts/hydra-loft-2.jpg",  // Nouvelle semaine !
}
```

---

## 📊 Checklist avant publication

- [ ] Photo de bonne qualité
- [ ] Dimensions correctes (1000x600px)
- [ ] Taille < 500 KB
- [ ] Nom de fichier descriptif
- [ ] Testé en local
- [ ] Fonctionne en mode light et dark

---

## 🆘 Problèmes courants

### La photo ne s'affiche pas

**Solution :**
1. Vérifiez le chemin : `/lofts/nom-exact.jpg`
2. Vérifiez que le fichier existe
3. Videz le cache (Ctrl+Shift+R)

### La photo est déformée

**Solution :**
1. Utilisez le ratio 5:3 (1000x600px)
2. Ou ajoutez `?fit=crop` à l'URL Unsplash

### La page est lente

**Solution :**
1. Compressez vos photos (< 500 KB)
2. Utilisez le format WebP
3. Optimisez avec TinyJPG

---

## 📚 Ressources

- **Photos gratuites** : https://unsplash.com
- **Compression** : https://tinyjpg.com
- **Optimisation** : https://squoosh.app
- **Guide complet** : `public/lofts/README.md`

---

## ✨ C'est tout !

Vous savez maintenant comment changer les photos des lofts recommandés. Simple, non ? 😊

**Questions ?** Consultez `public/lofts/README.md` pour plus de détails.
