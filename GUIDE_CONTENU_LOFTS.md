# 📝 Guide Complet : Gérer le Contenu des Lofts

## 🎯 Vue d'ensemble

Tout le contenu des lofts recommandés est centralisé dans **UN SEUL FICHIER** :

```
config/featured-lofts-content.ts
```

Ce fichier contient :
- ✅ Titres (FR, EN, AR)
- ✅ Descriptions (FR, EN, AR)
- ✅ Localisations (FR, EN, AR)
- ✅ Prix et devise
- ✅ Notes et avis
- ✅ Équipements
- ✅ Photos (référence)

---

## 📋 Structure d'un loft

Chaque loft contient ces éléments :

```typescript
{
  id: 1,                    // Identifiant unique
  
  title: {                  // Titre du loft
    fr: "...",              // En français
    en: "...",              // En anglais
    ar: "..."               // En arabe
  },
  
  location: {               // Localisation
    fr: "...",
    en: "...",
    ar: "..."
  },
  
  description: {            // Description
    fr: "...",
    en: "...",
    ar: "..."
  },
  
  price: 25000,             // Prix par nuit
  currency: "DZD",          // Devise (DZD, EUR, USD)
  rating: 4.8,              // Note (sur 5)
  reviews: 127,             // Nombre d'avis
  amenities: [...],         // Équipements
  image: getLoftImage(...)  // Photo
}
```

---

## ✏️ Comment modifier le contenu

### 1. Ouvrez le fichier de configuration

```
config/featured-lofts-content.ts
```

### 2. Trouvez le loft à modifier

```typescript
// ========================================
// LOFT 1 : Hydra, Alger
// ========================================
{
  id: 1,
  title: {
    fr: "Loft Moderne Hydra - Vue Panoramique",  // ← Modifiez ici
    en: "Modern Hydra Loft - Panoramic View",
    ar: "شقة حديثة في حيدرة - إطلالة بانورامية"
  },
  // ...
}
```

### 3. Modifiez ce que vous voulez

### 4. Sauvegardez

Les changements apparaissent automatiquement ! 🎉

---

## 📝 Exemples de modifications

### Changer le titre

**Avant :**
```typescript
title: {
  fr: "Loft Moderne Hydra - Vue Panoramique",
  en: "Modern Hydra Loft - Panoramic View",
  ar: "شقة حديثة في حيدرة - إطلالة بانورامية"
}
```

**Après :**
```typescript
title: {
  fr: "Superbe Loft Hydra avec Piscine",
  en: "Stunning Hydra Loft with Pool",
  ar: "شقة رائعة في حيدرة مع مسبح"
}
```

### Changer la description

```typescript
description: {
  fr: "Votre nouvelle description en français...",
  en: "Your new description in English...",
  ar: "وصفك الجديد بالعربية..."
}
```

### Changer le prix

```typescript
price: 30000,  // Nouveau prix
```

### Changer la devise

```typescript
currency: "EUR",  // Options : "DZD", "EUR", "USD"
```

### Changer la note

```typescript
rating: 4.9,  // Note sur 5
```

### Changer le nombre d'avis

```typescript
reviews: 200,  // Nombre d'avis
```

### Changer la localisation

```typescript
location: {
  fr: "Nouvelle localisation, Ville",
  en: "New location, City",
  ar: "موقع جديد، مدينة"
}
```

---

## 🛠️ Gérer les équipements

### Équipements disponibles

```typescript
amenities: ['Wifi', 'Car', 'Coffee', 'Tv']
```

**Options disponibles :**
- `'Wifi'` - WiFi / واي فاي
- `'Car'` - Parking / موقف سيارات
- `'Coffee'` - Café / قهوة
- `'Tv'` - TV / تلفزيون

### Exemples

**Tous les équipements :**
```typescript
amenities: ['Wifi', 'Car', 'Coffee', 'Tv']
```

**Seulement WiFi et TV :**
```typescript
amenities: ['Wifi', 'Tv']
```

**Aucun équipement :**
```typescript
amenities: []
```

---

## 📸 Gérer les photos

Les photos sont gérées dans un fichier séparé :

```
config/featured-lofts-images.ts
```

**Voir le guide :** `GUIDE_PHOTOS_LOFTS.md`

---

## 🌍 Traductions

### Pourquoi 3 langues ?

Le site supporte :
- 🇫🇷 Français (fr)
- 🇬🇧 Anglais (en)
- 🇸🇦 Arabe (ar)

**Important :** Remplissez toujours les 3 langues pour une expérience complète.

### Besoin d'aide pour traduire ?

**Outils gratuits :**
- Google Translate : https://translate.google.com
- DeepL : https://www.deepl.com (meilleur pour FR/EN)

**Conseil :** Pour l'arabe, demandez à un locuteur natif de vérifier.

---

## 🎨 Bonnes pratiques

### Titres

✅ **Bon :**
- Court et descriptif
- Met en avant l'atout principal
- Exemple : "Loft Moderne Hydra - Vue Panoramique"

❌ **À éviter :**
- Trop long (> 50 caractères)
- Trop générique : "Loft à louer"
- Tout en majuscules : "LOFT MODERNE"

### Descriptions

✅ **Bon :**
- 1-2 phrases
- Mentionne la surface, les atouts
- Exemple : "Magnifique loft de 120m² avec terrasse privée et vue imprenable."

❌ **À éviter :**
- Trop long (> 150 caractères)
- Trop technique
- Fautes d'orthographe

### Prix

✅ **Bon :**
- Prix réaliste
- Arrondi (25000 plutôt que 24999)
- Cohérent avec le marché

❌ **À éviter :**
- Prix trop élevé ou trop bas
- Chiffres bizarres (24567)

### Notes

✅ **Bon :**
- Entre 4.5 et 5.0 pour un loft recommandé
- Cohérent avec le nombre d'avis

❌ **À éviter :**
- Note parfaite 5.0 avec peu d'avis
- Note < 4.0 pour un loft "recommandé"

---

## 🔄 Ajouter un nouveau loft

### Étape 1 : Copiez un loft existant

```typescript
{
  id: 4,  // ← Nouveau numéro
  title: {
    fr: "Votre nouveau loft",
    en: "Your new loft",
    ar: "شقتك الجديدة"
  },
  // ... reste du contenu
}
```

### Étape 2 : Modifiez tout le contenu

### Étape 3 : Ajoutez la photo

Dans `config/featured-lofts-images.ts` :

```typescript
loft4: {
  current: "/lofts/nouveau-loft.jpg",
}
```

### Étape 4 : Référencez la photo

```typescript
image: getLoftImage('loft4')
```

---

## 🗑️ Supprimer un loft

### Option 1 : Supprimer complètement

Supprimez tout le bloc du loft dans `config/featured-lofts-content.ts`

### Option 2 : Désactiver temporairement

Commentez le loft :

```typescript
/*
{
  id: 3,
  title: { ... },
  // ...
}
*/
```

---

## 📊 Exemple complet

```typescript
{
  id: 1,
  
  // Titre accrocheur
  title: {
    fr: "Villa Luxueuse Sidi Bou Said",
    en: "Luxury Villa Sidi Bou Said",
    ar: "فيلا فاخرة سيدي بو سعيد"
  },
  
  // Localisation précise
  location: {
    fr: "Sidi Bou Said, Tunis",
    en: "Sidi Bou Said, Tunis",
    ar: "سيدي بو سعيد، تونس"
  },
  
  // Description vendeuse
  description: {
    fr: "Villa exceptionnelle de 250m² avec piscine privée, jardin méditerranéen et vue mer.",
    en: "Exceptional 250m² villa with private pool, Mediterranean garden and sea view.",
    ar: "فيلا استثنائية 250 متر مربع مع مسبح خاص وحديقة متوسطية وإطلالة على البحر."
  },
  
  // Prix attractif
  price: 35000,
  currency: "DZD",
  
  // Excellente note
  rating: 4.9,
  reviews: 234,
  
  // Tous les équipements
  amenities: ['Wifi', 'Car', 'Coffee', 'Tv'],
  
  // Belle photo
  image: getLoftImage('loft1')
}
```

---

## ✅ Checklist avant publication

- [ ] Titres remplis dans les 3 langues
- [ ] Descriptions remplis dans les 3 langues
- [ ] Localisations remplis dans les 3 langues
- [ ] Prix réaliste
- [ ] Note cohérente (4.5-5.0)
- [ ] Nombre d'avis cohérent
- [ ] Équipements sélectionnés
- [ ] Photo de qualité
- [ ] Testé en local
- [ ] Pas de fautes d'orthographe

---

## 🆘 Problèmes courants

### Le texte ne s'affiche pas

**Solution :**
1. Vérifiez les guillemets : `"texte"` pas `'texte'`
2. Vérifiez les virgules entre les champs
3. Sauvegardez le fichier

### Le texte est coupé

**Solution :**
1. Réduisez la longueur
2. Titre : max 50 caractères
3. Description : max 150 caractères

### Les accents ne s'affichent pas

**Solution :**
1. Le fichier doit être en UTF-8
2. Utilisez les caractères directement : "é" pas "e"

---

## 📚 Fichiers liés

- **Contenu** : `config/featured-lofts-content.ts` (ce guide)
- **Photos** : `config/featured-lofts-images.ts` (voir `GUIDE_PHOTOS_LOFTS.md`)
- **Composant** : `components/homepage/FusionDualAudienceHomepage.tsx`

---

## 🎓 Résumé

1. **Un seul fichier** pour tout le contenu : `config/featured-lofts-content.ts`
2. **Modifiez** ce que vous voulez
3. **Sauvegardez**
4. **C'est tout !** ✨

Simple, non ? 😊
