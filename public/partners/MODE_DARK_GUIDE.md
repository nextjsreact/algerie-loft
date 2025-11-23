# 🌓 Guide Mode Dark pour les Logos

## Problème

Les logos avec texte **blanc** ou couleurs **claires** ne sont pas visibles sur fond **sombre** (mode dark).

## Solution

Le système supporte **deux versions** de chaque logo qui basculent automatiquement selon le thème.

---

## 📋 Checklist rapide

### ✅ Mon logo est visible dans les deux modes

Si votre logo :
- A des couleurs vives (bleu, rouge, vert, etc.)
- N'a pas de texte blanc
- A un fond transparent

**→ Une seule version suffit !**

```typescript
{
  logo: '/partners/mon-logo.svg'
  // Pas besoin de logoDark
}
```

### ⚠️ Mon logo a du texte blanc ou des couleurs claires

Si votre logo :
- A du texte blanc
- A des éléments très clairs (#fff, #f0f0f0, etc.)
- N'est pas visible sur fond gris foncé

**→ Créez deux versions !**

```typescript
{
  logo: '/partners/mon-logo-light.svg',      // Texte blanc
  logoDark: '/partners/mon-logo-dark.svg'    // Texte gris clair
}
```

---

## 🎨 Comment créer une version dark

### Méthode 1 : Modifier le SVG manuellement

Ouvrez le fichier SVG dans un éditeur de texte et changez les couleurs :

**Version light (pour fond blanc) :**
```xml
<text fill="#ffffff">Mon Logo</text>  <!-- Blanc sur fond clair -->
<path fill="#fff" d="..."/>
```

**Version dark (pour fond gris foncé #1f2937) :**
```xml
<text fill="#ffffff">Mon Logo</text>  <!-- Blanc sur fond sombre -->
<path fill="#ffffff" d="..."/>        <!-- Contraste maximal -->
```

**Note :** Utilisez `#ffffff` (blanc pur) dans les deux cas si votre logo a du texte blanc. Le fond change, pas le logo !

### Méthode 2 : Utiliser un éditeur graphique

1. **Figma / Illustrator / Inkscape**
2. Ouvrez votre logo
3. Sélectionnez les éléments blancs
4. Changez la couleur en gris clair (#e5e7eb)
5. Exportez : `mon-logo-dark.svg`

### Méthode 3 : Outils en ligne

- [SVG Editor](https://svgedit.netlify.app/)
- [Boxy SVG](https://boxy-svg.com/)

---

## 📝 Exemples concrets

### Exemple 1 : Logo avec texte blanc

**Fichiers :**
```
public/partners/
├── airbnb-light.svg  (texte blanc)
└── airbnb-dark.svg   (texte gris clair)
```

**Code :**
```typescript
{
  id: 'airbnb',
  name: 'Airbnb',
  logo: '/partners/airbnb-light.svg',
  logoDark: '/partners/airbnb-dark.svg',
  website: 'https://www.airbnb.com'
}
```

### Exemple 2 : Logo coloré (une seule version)

**Fichier :**
```
public/partners/
└── booking-logo.svg  (bleu vif, visible partout)
```

**Code :**
```typescript
{
  id: 'booking',
  name: 'Booking.com',
  logo: '/partners/booking-logo.svg',
  // Pas de logoDark nécessaire
  website: 'https://www.booking.com'
}
```

### Exemple 3 : Destination Algeria (cas réel)

**Fichiers :**
```
public/partners/
├── destination-algerie-blanc-logo.svg  (texte blanc #fff)
└── destination-algerie-dark-logo.svg   (texte gris #e5e7eb)
```

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

---

## 🎯 Couleurs recommandées pour mode dark

### Contexte des fonds
- **Mode Light** : Fond blanc (`bg-white`)
- **Mode Dark** : Fond gris foncé (`dark:bg-gray-800` = `#1f2937`)

### Couleurs de texte

| Élément | Mode Light | Mode Dark | Raison |
|---------|-----------|-----------|--------|
| Texte principal | `#ffffff` (blanc) | `#ffffff` (blanc) | Contraste maximal |
| Texte secondaire | `#f0f0f0` | `#f9fafb` | Bon contraste |
| Bordures | `#ffffff` | `#d1d5db` | Visible mais subtil |
| Fond (si nécessaire) | Transparent | Transparent | S'adapte au thème |

**⚠️ À éviter en mode dark :**
- `#e5e7eb` (trop clair, se confond avec le fond gris)
- Couleurs pastel claires
- Gris très clairs

**✅ Recommandé :**
- `#ffffff` pour un contraste maximal
- `#f9fafb` pour les éléments secondaires

---

## 🧪 Tester vos logos

1. Ajoutez votre logo au composant
2. Ouvrez `http://localhost:3000`
3. Basculez entre mode light et dark (icône soleil/lune)
4. Vérifiez que le logo est visible dans les deux modes

**Raccourci :** Cliquez sur l'icône de thème en haut à droite

---

## ❓ FAQ

### Q : Dois-je créer deux versions pour tous mes logos ?

**R :** Non ! Seulement si votre logo a du texte blanc ou des couleurs très claires.

### Q : Que se passe-t-il si je ne fournis pas logoDark ?

**R :** Le même logo (light) sera utilisé dans les deux modes. L'effet grayscale aide à l'adapter.

### Q : Puis-je utiliser des PNG au lieu de SVG ?

**R :** Oui, mais vous devrez créer deux PNG séparés. SVG est recommandé car plus léger et modifiable.

### Q : Comment savoir si mon logo a besoin d'une version dark ?

**R :** Testez-le ! Si vous ne voyez pas bien le texte en mode dark, créez une version dark.

---

## 🚀 Résumé

1. **Logo coloré** → Une version suffit
2. **Logo avec texte blanc** → Deux versions nécessaires
3. **Nommage** : `logo-light.svg` et `logo-dark.svg`
4. **Code** : Ajoutez `logoDark: '/partners/...'`
5. **Test** : Basculez entre les thèmes

**Le système fait le reste automatiquement !** 🎉
