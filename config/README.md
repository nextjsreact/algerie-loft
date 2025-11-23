# 📁 Configuration des Lofts Recommandés

Ce dossier contient toute la configuration pour gérer les lofts affichés sur la page d'accueil.

## 📄 Fichiers

### `featured-lofts-content.ts`
**Contenu des lofts** (textes, prix, notes, etc.)

Contient :
- Titres (FR, EN, AR)
- Descriptions (FR, EN, AR)
- Localisations (FR, EN, AR)
- Prix et devise
- Notes et avis
- Équipements

**Guide :** Voir `GUIDE_CONTENU_LOFTS.md`

### `featured-lofts-images.ts`
**Photos des lofts**

Contient :
- URLs des photos
- Alternatives
- Photos locales

**Guide :** Voir `GUIDE_PHOTOS_LOFTS.md`

---

## 🚀 Modification rapide

### Pour changer le texte d'un loft

1. Ouvrez `featured-lofts-content.ts`
2. Modifiez le titre, description, prix, etc.
3. Sauvegardez

### Pour changer la photo d'un loft

1. Ouvrez `featured-lofts-images.ts`
2. Modifiez l'URL dans `current:`
3. Sauvegardez

---

## 📚 Guides complets

- **Contenu (textes)** : `../GUIDE_CONTENU_LOFTS.md`
- **Photos** : `../GUIDE_PHOTOS_LOFTS.md`

---

## 🎯 Exemple : Changer tout pour le Loft 1

### 1. Changer le texte

Dans `featured-lofts-content.ts` :

```typescript
{
  id: 1,
  title: {
    fr: "Nouveau titre",  // ← Changez ici
    en: "New title",
    ar: "عنوان جديد"
  },
  price: 30000,  // ← Changez le prix
  // ...
}
```

### 2. Changer la photo

Dans `featured-lofts-images.ts` :

```typescript
loft1: {
  current: "/lofts/nouvelle-photo.jpg",  // ← Changez ici
}
```

### 3. Sauvegardez les deux fichiers

C'est tout ! ✨

---

## ⚡ Avantages de cette organisation

✅ **Centralisé** - Tout au même endroit
✅ **Simple** - Pas besoin de chercher dans le code
✅ **Multilingue** - Support FR/EN/AR intégré
✅ **Flexible** - Facile d'ajouter/modifier/supprimer
✅ **Documenté** - Guides complets disponibles

---

## 🆘 Besoin d'aide ?

1. **Contenu** → Voir `GUIDE_CONTENU_LOFTS.md`
2. **Photos** → Voir `GUIDE_PHOTOS_LOFTS.md`
3. **Problème** → Vérifiez les guides ci-dessus
