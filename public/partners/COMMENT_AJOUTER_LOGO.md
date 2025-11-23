# Comment ajouter un logo partenaire

## ⚠️ Erreurs courantes à éviter

### ❌ Oublier l'extension du fichier
```typescript
// INCORRECT - Causera une erreur 404
logo: '/partners/mon-logo'

// CORRECT - Toujours inclure l'extension
logo: '/partners/mon-logo.svg'
logo: '/partners/mon-logo.png'
```

### ❌ Mauvais chemin
```typescript
// INCORRECT
logo: 'partners/logo.svg'  // Manque le /
logo: '/partner/logo.svg'  // Faute de frappe

// CORRECT
logo: '/partners/logo.svg'
```

### ❌ Nom de fichier différent
```typescript
// Le fichier s'appelle: airbnb-logo.svg
// INCORRECT
logo: '/partners/airbnb.svg'

// CORRECT
logo: '/partners/airbnb-logo.svg'
```

## ✅ Procédure correcte

### 1. Ajouter le fichier
Placez votre logo dans `public/partners/` :
```
public/partners/mon-partenaire-logo.svg
```

### 2. Vérifier le nom exact
```bash
# Windows
dir public\partners

# Vérifiez le nom EXACT du fichier (sensible à la casse)
```

### 3. Ajouter dans le code
Ouvrez `components/homepage/PartnerLogos.tsx` :

```typescript
{
  id: 'mon-partenaire',
  name: 'Mon Partenaire',
  logo: '/partners/mon-partenaire-logo.svg',  // ← Nom EXACT avec extension
  website: 'https://www.mon-partenaire.com',
  description: 'Description du partenaire'
}
```

### 4. Tester
1. Sauvegardez le fichier
2. Rechargez la page : `http://localhost:3000`
3. Vérifiez qu'il n'y a pas d'erreur 404 dans la console

## 🔍 Déboguer une erreur 404

Si vous voyez cette erreur :
```
GET /partners/mon-logo 404
```

**Checklist :**
- [ ] Le fichier existe dans `public/partners/` ?
- [ ] Le nom du fichier est exactement le même (casse comprise) ?
- [ ] L'extension est incluse dans le code (.svg, .png, etc.) ?
- [ ] Le chemin commence par `/partners/` (avec le slash) ?

## 📝 Exemple complet

**Fichier :** `public/partners/airbnb-logo.svg`

**Code :**
```typescript
{
  id: 'airbnb',
  name: 'Airbnb',
  logo: '/partners/airbnb-logo.svg',  // ✅ Correct
  website: 'https://www.airbnb.com',
  description: 'Plateforme de location de logements'
}
```

## 🚀 Formats supportés

- ✅ `.svg` (recommandé)
- ✅ `.png`
- ✅ `.webp`
- ✅ `.jpg` / `.jpeg`

**Toujours inclure l'extension !**
