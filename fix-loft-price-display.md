# Correction de l'affichage des prix des lofts

## Problème identifié
Les lofts utilisent le champ `price_per_night` dans la base de données, mais le code affichait `price_per_month` qui était `undefined`.

## Données observées dans les logs
```javascript
{
  id: 'b5c387a7-057f-494c-a9b2-d5b5d57e6e75',
  name: 'Kifan Loft',
  price_per_month: undefined,     // ← Champ vide
  price_per_night: 12000,         // ← Vraie valeur du prix
}
```

## Corrections apportées

### 1. Fonction formatPrice améliorée
**Avant :**
```typescript
const formatPrice = (price: number | null) => {
  if (!price || price === null || price === undefined) {
    return "N/A"
  }
  return formatCurrencyAuto(price, 'DZD', `/${locale}/lofts`)
}
```

**Après :**
```typescript
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) {
    return "N/A"
  }
  // 0 est un prix valide, donc on l'affiche
  return formatCurrencyAuto(price, 'DZD', `/${locale}/lofts`)
}
```

### 2. Affichage dans le tableau (lofts-list.tsx)
**Avant :**
```typescript
{formatPrice(loft.price_per_month || 0)}
```

**Après :**
```typescript
{formatPrice(loft.price_per_night)}
```

### 3. Calcul des revenus totaux (lofts-wrapper.tsx)
**Avant :**
```typescript
const totalRevenue = lofts.reduce((sum, loft) => sum + (loft.price_per_month || 0), 0)
```

**Après :**
```typescript
const totalRevenue = lofts.reduce((sum, loft) => sum + (loft.price_per_night || 0), 0)
```

### 4. Nettoyage du code
- ✅ Supprimé les logs de debug inutiles
- ✅ Supprimé les casts `as any` non nécessaires
- ✅ Utilisé les types TypeScript corrects

## Résultat attendu
- ✅ Les prix s'affichent correctement (12000 DA au lieu de "N/A")
- ✅ Les prix à 0 s'affichent comme "0 DA" au lieu de "N/A"
- ✅ Le calcul des revenus totaux utilise les bonnes valeurs
- ✅ Plus de logs de debug dans la console

## Types utilisés
Le type `Loft` définit correctement :
```typescript
export type Loft = {
  // ...
  price_per_month: number | null;
  price_per_night?: number | null;  // ← Champ optionnel utilisé
  // ...
}
```

## Test
Pour tester, vérifiez que :
1. Les prix s'affichent correctement dans la liste des lofts
2. Le "Revenus Total" dans les statistiques reflète la somme des `price_per_night`
3. Plus de messages "Price is null/undefined, returning N/A" dans la console