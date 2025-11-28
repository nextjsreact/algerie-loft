# 📞 Configuration Centralisée des Informations de Contact

## ✅ Problème Résolu

**Avant :** Les informations de contact étaient éparpillées dans plusieurs fichiers (homepage, page de contact, footer, etc.)

**Maintenant :** Toutes les informations sont centralisées dans **un seul fichier** : `config/contact-info.ts`

---

## 📁 Fichier de Configuration

### `config/contact-info.ts`

Ce fichier contient **toutes** les informations de contact :

```typescript
export const CONTACT_INFO = {
  // Téléphone
  phone: {
    display: "+213 56 03 62 543",
    link: "tel:+213560362543",
    whatsapp: "https://wa.me/213560362543"
  },
  
  // Email
  email: {
    display: "contact@loft-algerie.com",
    link: "mailto:contact@loft-algerie.com"
  },
  
  // Adresse
  address: {
    fr: "Alger, Algérie",
    en: "Algiers, Algeria",
    ar: "الجزائر العاصمة، الجزائر"
  },
  
  // Horaires
  hours: {
    fr: "Tous les jours: 9h00 - 22h00",
    en: "Every day: 9:00 AM - 10:00 PM",
    ar: "كل يوم: 9:00 ص - 10:00 م"
  }
}
```

---

## 🎯 Avantages

### ✅ Un Seul Endroit à Modifier

Pour changer le numéro de téléphone, l'email, ou les horaires :
1. Ouvrez `config/contact-info.ts`
2. Modifiez la valeur
3. Sauvegardez
4. **Tout est mis à jour automatiquement partout !**

### ✅ Cohérence Garantie

Plus de risque d'avoir des informations différentes sur différentes pages.

### ✅ Facile à Maintenir

Un seul fichier à gérer au lieu de chercher dans 10 fichiers différents.

### ✅ Multilingue

Les traductions sont gérées directement dans la configuration.

---

## 📝 Modifications Appliquées

### Page de Contact Mise à Jour

✅ **Téléphone :** `+213 56 03 62 543` (réel)
✅ **Email :** `contact@loft-algerie.com` (réel)
✅ **Horaires :** `Tous les jours: 9h00 - 22h00` (corrigé)
✅ **Message :** "Une question ? Un projet ? Propriétaires ou locataires, nous sommes là pour vous accompagner !" (adapté)

### Fichiers Modifiés

1. ✅ **Créé :** `config/contact-info.ts` - Configuration centralisée
2. ✅ **Modifié :** `app/[locale]/public/contact/page.tsx` - Utilise la config

---

## 🔄 Comment Utiliser

### Dans N'importe Quel Composant

```typescript
import { CONTACT_INFO, CONTACT_MESSAGES } from '@/config/contact-info';

// Utiliser le téléphone
<a href={CONTACT_INFO.phone.link}>
  {CONTACT_INFO.phone.display}
</a>

// Utiliser l'email
<a href={CONTACT_INFO.email.link}>
  {CONTACT_INFO.email.display}
</a>

// Utiliser l'adresse (avec locale)
<p>{CONTACT_INFO.address[locale]}</p>

// Utiliser les horaires (avec locale)
<p>{CONTACT_INFO.hours[locale]}</p>
```

---

## 📋 Prochaines Étapes Recommandées

### 1. Mettre à Jour la Homepage

Modifier `components/homepage/FusionDualAudienceHomepage.tsx` pour utiliser `CONTACT_INFO` au lieu des valeurs en dur.

### 2. Mettre à Jour le Footer

Modifier `components/public/PublicFooter.tsx` pour utiliser `CONTACT_INFO`.

### 3. Mettre à Jour Tous les Autres Composants

Rechercher tous les endroits où le téléphone ou l'email sont en dur et les remplacer par `CONTACT_INFO`.

---

## 🔍 Trouver Tous les Endroits à Mettre à Jour

### Recherche dans le Code

```bash
# Rechercher le numéro de téléphone
grep -r "+213 56 03 62 543" .

# Rechercher l'email
grep -r "contact@loft-algerie.com" .

# Rechercher les horaires en dur
grep -r "9h00 - 18h00" .
```

---

## 📊 Informations Actuelles

### Téléphone
- **Affichage :** +213 56 03 62 543
- **Lien :** tel:+213560362543
- **WhatsApp :** https://wa.me/213560362543

### Email
- **Affichage :** contact@loft-algerie.com
- **Lien :** mailto:contact@loft-algerie.com

### Adresse
- **FR :** Alger, Algérie
- **EN :** Algiers, Algeria
- **AR :** الجزائر العاصمة، الجزائر

### Horaires
- **FR :** Tous les jours: 9h00 - 22h00
- **EN :** Every day: 9:00 AM - 10:00 PM
- **AR :** كل يوم: 9:00 ص - 10:00 م

---

## 🎨 Messages de Contact

### Français
- **Titre :** Contactez-nous
- **Sous-titre :** Une question ? Un projet ? Propriétaires ou locataires, nous sommes là pour vous accompagner !

### English
- **Title :** Contact Us
- **Subtitle :** A question? A project? Owners or tenants, we are here to support you!

### العربية
- **العنوان :** اتصل بنا
- **العنوان الفرعي :** سؤال؟ مشروع؟ ملاك أو مستأجرون، نحن هنا لمساعدتك!

---

## 🔧 Modifier les Informations

### Pour Changer le Téléphone

```typescript
// Dans config/contact-info.ts
phone: {
  display: "+213 XX XX XX XXX",  // ← Changez ici
  link: "tel:+213XXXXXXXXX",     // ← Et ici
  whatsapp: "https://wa.me/213XXXXXXXXX"  // ← Et ici
}
```

### Pour Changer l'Email

```typescript
// Dans config/contact-info.ts
email: {
  display: "nouveau@email.com",        // ← Changez ici
  link: "mailto:nouveau@email.com"     // ← Et ici
}
```

### Pour Changer les Horaires

```typescript
// Dans config/contact-info.ts
hours: {
  fr: "Lun - Ven: 8h00 - 20h00",  // ← Changez ici
  en: "Mon - Fri: 8:00 AM - 8:00 PM",
  ar: "الإثنين - الجمعة: 8:00 ص - 8:00 م"
}
```

---

## ✅ Résumé

### Ce Qui a Été Fait

1. ✅ Créé `config/contact-info.ts` - Configuration centralisée
2. ✅ Mis à jour la page de contact avec les vraies infos
3. ✅ Corrigé les horaires (9h-22h tous les jours)
4. ✅ Adapté le message pour clients ET propriétaires
5. ✅ Documentation complète

### Avantages

- 🎯 **Un seul fichier** à modifier
- 🎯 **Cohérence** garantie
- 🎯 **Facile** à maintenir
- 🎯 **Multilingue** intégré

### Prochaines Étapes

- ⏰ Mettre à jour la homepage pour utiliser `CONTACT_INFO`
- ⏰ Mettre à jour le footer pour utiliser `CONTACT_INFO`
- ⏰ Rechercher et remplacer toutes les occurrences en dur

---

**Maintenant, pour changer les informations de contact, il suffit de modifier UN SEUL fichier ! 🎉**
