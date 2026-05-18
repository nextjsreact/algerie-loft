# 🔧 Correction: Erreur "Failed to mark bill as paid"

**Date :** 2026-05-18  
**Commit :** `3413669`  
**Statut :** ✅ Déployé

---

## 🐛 Problème

Lors du paiement d'une facture (eau, énergie, téléphone, internet), l'erreur suivante apparaissait :

```
Error recording bill payment: Error: Failed to mark bill as paid
```

### Erreur dans la Console
```
Category not found for utility type: telephone
```

---

## 🔍 Cause

La fonction `markBillAsPaid` cherchait une catégorie avec un nom exact correspondant au type d'utilitaire (eau, energie, telephone, internet), mais :

1. **Les catégories peuvent avoir des noms différents** dans la base de données
2. **La recherche était trop stricte** (match exact uniquement)
3. **Pas de fallback** si la catégorie n'était pas trouvée

### Code Problématique (Avant)
```typescript
const { data: category, error: categoryError } = await supabase
  .from('categories')
  .select('id')
  .eq('name', utilityType)  // Recherche exacte uniquement
  .eq('type', 'expense')
  .single()

if (categoryError || !category) {
  throw new Error(`Category not found for utility type: ${utilityType}`)
}
```

---

## ✅ Solution Appliquée

Amélioration de la recherche de catégorie avec **plusieurs variations de noms** :

### Code Corrigé (Après)
```typescript
// Try multiple name variations to find the category
const categoryNames = [
  utilityType,                          // eau, energie, telephone, internet
  utilityType.toLowerCase(),            // eau, energie, telephone, internet (lowercase)
  UTILITY_LABELS[utilityType],          // Water, Energy, Phone, Internet
  UTILITY_LABELS[utilityType].toLowerCase(), // water, energy, phone, internet
  UTILITY_CATEGORIES[utilityType],      // Water Bill, Energy Bill, Phone Bill, Internet Bill
]

let category = null
let categoryError = null

for (const name of categoryNames) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'expense')
    .ilike('name', name)  // Recherche insensible à la casse
    .maybeSingle()

  if (data) {
    category = data
    break
  }
  if (error) {
    categoryError = error
  }
}

if (!category) {
  console.error('Category not found for utility type:', utilityType, 'Tried names:', categoryNames)
  throw new Error(`Category not found for utility type: ${utilityType}. Please create a category named "${utilityType}" with type "expense" in the categories table.`)
}

console.log('Found category:', category.name, 'for utility:', utilityType)
```

### Améliorations
1. ✅ **Essaie plusieurs variations de noms** (eau, Water, water, Water Bill, etc.)
2. ✅ **Recherche insensible à la casse** (`.ilike()` au lieu de `.eq()`)
3. ✅ **Logs détaillés** pour le débogage
4. ✅ **Message d'erreur plus explicite** avec instructions

---

## 🧪 Tests à Effectuer

### 1. Vérifier les Catégories Existantes

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Vérifier les catégories d'utilitaires
SELECT 
  id,
  name,
  type
FROM categories
WHERE type = 'expense'
  AND (
    LOWER(name) LIKE '%eau%'
    OR LOWER(name) LIKE '%water%'
    OR LOWER(name) LIKE '%energie%'
    OR LOWER(name) LIKE '%energy%'
    OR LOWER(name) LIKE '%telephone%'
    OR LOWER(name) LIKE '%phone%'
    OR LOWER(name) LIKE '%internet%'
  )
ORDER BY name;
```

### 2. Tester le Paiement de Facture

1. Aller sur https://www.loftalgerie.com/lofts
2. Cliquer sur "Camomille loft" (ou un autre loft)
3. Cliquer sur "Enregistrer le paiement" pour une facture (téléphone par exemple)
4. Remplir le formulaire :
   - Montant : 5000
   - Description : "Test paiement téléphone"
   - Devise : Sélectionner une devise
   - Mode de paiement : Sélectionner un mode
5. Cliquer sur "Enregistrer le paiement"

**Résultat attendu :**
- ✅ Message de succès : "Bill marked as paid successfully"
- ✅ La transaction apparaît dans la liste des transactions
- ✅ Pas d'erreur dans la console

### 3. Vérifier les Logs

Ouvrir la console du navigateur (F12) et vérifier :
- ✅ Log : "Found category: [nom de la catégorie] for utility: telephone"
- ❌ Pas d'erreur "Category not found"

---

## 📝 Si le Problème Persiste

### Créer les Catégories Manquantes

Si les catégories n'existent pas, exécutez ce script dans Supabase :

```sql
-- Créer les catégories d'utilitaires si elles n'existent pas
INSERT INTO categories (name, type, description)
VALUES 
  ('eau', 'expense', 'Factures d''eau'),
  ('energie', 'expense', 'Factures d''énergie (électricité + gaz)'),
  ('telephone', 'expense', 'Factures de téléphone'),
  ('internet', 'expense', 'Factures d''internet')
ON CONFLICT (name) DO NOTHING;

-- Vérifier que les catégories ont été créées
SELECT id, name, type FROM categories WHERE name IN ('eau', 'energie', 'telephone', 'internet');
```

---

## 🚀 Déploiement

- ✅ **Commit** : `3413669` - "fix: Améliorer la recherche de catégorie pour le paiement de factures"
- ✅ **Push** : Poussé vers `origin/main`
- 🔄 **Vercel** : Déploiement automatique en cours
- ⏱️ **Durée estimée** : 2-5 minutes

---

## 🔗 Prochaines Étapes

Une fois que le paiement de facture fonctionne, nous pourrons :

1. **Tester le bug de la fréquence bimestriel** (prochaine date +6 mois au lieu de +2 mois)
2. **Corriger la mise à jour automatique de la prochaine date** (actuellement désactivée)
3. **Vérifier le trigger SQL** qui calcule la prochaine date

---

## 📊 Résumé

| Élément | Avant | Après |
|---------|-------|-------|
| **Recherche catégorie** | Exacte uniquement | Multiple variations |
| **Sensibilité casse** | Sensible | Insensible |
| **Logs** | Minimaux | Détaillés |
| **Message d'erreur** | Générique | Explicite avec instructions |

---

**Prochaine action :** Attendre le déploiement Vercel (2-5 min) puis tester le paiement de facture.
