# 🐛 Bug: Fréquence Bimestriel Calcule +6 Mois au Lieu de +2 Mois

**Date :** 2026-05-18  
**Loft Affecté :** Camomille loft  
**Utilité :** Téléphone  
**Fréquence :** Bimestriel (devrait être +2 mois)  
**Résultat Actuel :** +6 mois (incorrect)

---

## 🔍 Diagnostic

### Problème Identifié

La fonction `markBillAsPaid` dans `app/actions/bill-notifications.ts` **NE MET PAS À JOUR** la prochaine date d'échéance. Voir lignes 117-119 :

```typescript
// Update next bill date if frequency is set
// Since we are not fetching the frequency, we cannot update the next bill date.
// This will be handled by the user manually until the root cause is resolved.
```

**Mais** : Vous dites que la date a été mise à jour à +6 mois, ce qui signifie qu'il y a probablement un **trigger SQL** qui fait la mise à jour automatiquement.

### Hypothèses

1. **Trigger SQL existe** : Un trigger `update_next_bill_dates()` est déclenché après l'insertion d'une transaction
2. **Bug dans le trigger** : Le trigger confond "bimestriel" avec "semestriel"
3. **Valeur incorrecte** : La valeur enregistrée dans la base est "semestriel" au lieu de "bimestriel"

---

## ✅ Solution 1 : Vérifier les Données Actuelles

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Vérifier les données du Camomille loft
SELECT 
  id,
  name,
  frequence_paiement_telephone,
  prochaine_echeance_telephone,
  phone_number
FROM lofts
WHERE LOWER(name) LIKE '%camomille%';
```

**Résultat attendu :**
- Si `frequence_paiement_telephone` = `'bimestriel'` → Le bug est dans le trigger SQL
- Si `frequence_paiement_telephone` = `'semestriel'` → Le bug est dans le formulaire

---

## ✅ Solution 2 : Corriger la Fonction markBillAsPaid

Remplacer les lignes 117-119 par :

```typescript
// Get loft data with frequency
const { data: loftWithFrequency, error: frequencyError } = await supabase
  .from('lofts')
  .select(`frequence_paiement_${utilityType}`)
  .eq('id', loftId)
  .single()

if (!frequencyError && loftWithFrequency) {
  const frequency = (loftWithFrequency as any)[`frequence_paiement_${utilityType}`]
  if (frequency) {
    await updateNextBillDate(loftId, utilityType, frequency)
  }
}
```

---

## ✅ Solution 3 : Vérifier le Trigger SQL

Exécutez ce script pour voir la définition du trigger :

```sql
-- Vérifier si un trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%bill%'
  OR trigger_name LIKE '%next%';

-- Vérifier la fonction du trigger
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%bill%'
  OR routine_name LIKE '%next%';
```

---

## ✅ Solution 4 : Corriger Manuellement la Date

Si vous voulez corriger immédiatement la date pour Camomille loft :

```sql
-- Corriger la date du téléphone pour Camomille loft
-- Supposons que la date actuelle est 2026-05-18 et devrait être 2026-07-18 (2 mois)
UPDATE lofts
SET prochaine_echeance_telephone = '2026-07-18'  -- Ajustez selon la date correcte
WHERE LOWER(name) LIKE '%camomille%';

-- Vérifier la correction
SELECT 
  name,
  frequence_paiement_telephone,
  prochaine_echeance_telephone
FROM lofts
WHERE LOWER(name) LIKE '%camomille%';
```

---

## 🔧 Correction Complète à Appliquer

### Étape 1 : Diagnostiquer

1. Exécuter `test-data/debug_camomille_telephone.sql` dans Supabase
2. Noter la valeur de `frequence_paiement_telephone`
3. Noter la date actuelle et la date calculée

### Étape 2 : Identifier la Cause

- **Si frequence = "semestriel"** → Bug dans le formulaire (sélection incorrecte)
- **Si frequence = "bimestriel"** → Bug dans le trigger SQL ou la fonction TypeScript

### Étape 3 : Appliquer la Correction

Je vais créer un fichier de correction complet une fois que vous aurez exécuté le script de diagnostic.

---

## 📝 Actions Immédiates

1. **Exécuter** : `test-data/debug_camomille_telephone.sql` dans Supabase SQL Editor
2. **Copier** : Les résultats de la requête
3. **Envoyer** : Les résultats pour que je puisse identifier la cause exacte
4. **Corriger** : Je créerai le fix approprié

---

## 🎯 Résultat Attendu Après Correction

- Fréquence "bimestriel" → Prochaine date = Date actuelle + **2 mois** ✅
- Fréquence "semestriel" → Prochaine date = Date actuelle + **6 mois** ✅
- Fréquence "trimestriel" → Prochaine date = Date actuelle + **3 mois** ✅

---

**Prochaine action :** Exécutez `test-data/debug_camomille_telephone.sql` et envoyez-moi les résultats.
