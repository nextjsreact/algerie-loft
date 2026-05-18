# 🧪 Guide de Test: Paiement de Facture

**Objectif :** Tester que le paiement de facture fonctionne correctement après la correction

---

## ⏱️ Étape 1: Attendre le Déploiement (2-5 minutes)

Le commit `81c1d08` a été poussé vers GitHub. Vercel va automatiquement déployer la nouvelle version.

### Comment Vérifier le Statut du Déploiement

1. Aller sur https://vercel.com/dashboard
2. Chercher le projet "algerie-loft" (ou votre nom de projet)
3. Vérifier le dernier déploiement :
   - **Commit** : `81c1d08`
   - **Message** : "fix: Simplifier la recherche de catégorie et ajouter des logs détaillés pour le débogage"
   - **Statut** : Doit être "Ready" (vert) ✅

### Temps d'Attente Estimé
- ⏱️ **2-5 minutes** en moyenne
- Si le déploiement prend plus de 10 minutes, il y a peut-être un problème

---

## 🧹 Étape 2: Vider le Cache du Navigateur

**IMPORTANT :** Le navigateur peut avoir mis en cache l'ancien code JavaScript. Il faut vider le cache.

### Option A: Vider le Cache Complet
- **Chrome/Edge** : Appuyez sur `Ctrl + Shift + Delete`
  - Cochez "Images et fichiers en cache"
  - Période : "Dernière heure"
  - Cliquez sur "Effacer les données"

- **Firefox** : Appuyez sur `Ctrl + Shift + Delete`
  - Cochez "Cache"
  - Période : "Dernière heure"
  - Cliquez sur "Effacer maintenant"

### Option B: Navigation Privée (Plus Simple)
- **Chrome/Edge** : `Ctrl + Shift + N`
- **Firefox** : `Ctrl + Shift + P`
- Aller directement sur https://www.loftalgerie.com

### Option C: Hard Refresh (Plus Rapide)
- Aller sur https://www.loftalgerie.com
- Appuyez sur `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)

---

## 🧪 Étape 3: Tester le Paiement de Facture

### 3.1 Ouvrir la Console du Navigateur

**AVANT de commencer le test**, ouvrez la console :
- Appuyez sur `F12`
- Cliquez sur l'onglet "Console"
- Laissez la console ouverte pendant tout le test

### 3.2 Naviguer vers le Loft

1. Aller sur https://www.loftalgerie.com
2. Se connecter si nécessaire
3. Aller dans **Lofts** (menu de gauche)
4. Cliquer sur **"Camomille loft"**

### 3.3 Enregistrer un Paiement

1. Chercher la section **"Factures à venir"** ou **"Utilities"**
2. Trouver la facture **Téléphone** (ou une autre facture)
3. Cliquer sur **"Enregistrer le paiement"** ou **"Mark as Paid"**

### 3.4 Remplir le Formulaire

- **Montant** : `5000` (ou le montant de la facture)
- **Description** : `Test paiement téléphone`
- **Devise** : Sélectionner une devise (ex: DZD)
- **Mode de paiement** : Sélectionner un mode (ex: Espèces)

### 3.5 Soumettre le Formulaire

Cliquez sur **"Enregistrer le paiement"** ou **"Submit"**

---

## ✅ Étape 4: Vérifier les Résultats

### 4.1 Vérifier les Logs dans la Console

**Logs attendus (dans l'ordre) :**

```
[DEBUG] markBillAsPaid called with: {
  loftId: "...",
  utilityType: "telephone",
  amount: 5000,
  description: "Test paiement téléphone",
  currencyId: "...",
  paymentMethodId: "..."
}

[DEBUG] Looking for category for utility: telephone

[SUCCESS] Found category: telephone (ID: 9a2fae5c-7895-4c0d-8ef3-ad57bd1614ae) for utility: telephone

[SUCCESS] Transaction created successfully for utility: telephone amount: 5000
```

### 4.2 Vérifier le Message de Succès

Vous devriez voir un message de succès :
- ✅ **"Bill marked as paid successfully"**
- ✅ **"Facture marquée comme payée avec succès"**
- Ou un message similaire

### 4.3 Vérifier la Transaction

1. Aller dans **Transactions** (menu de gauche)
2. Vérifier qu'une nouvelle transaction apparaît :
   - **Type** : Dépense (Expense)
   - **Catégorie** : telephone (ou Téléphone)
   - **Montant** : 5000
   - **Description** : "Test paiement téléphone"
   - **Date** : Aujourd'hui (2026-05-18)

---

## ❌ Si le Test Échoue

### Erreur: "Failed to mark bill as paid"

**Causes possibles :**

1. **Le déploiement Vercel n'est pas encore effectif**
   - Attendre 2-5 minutes de plus
   - Vérifier le statut sur https://vercel.com/dashboard

2. **Le cache du navigateur n'a pas été vidé**
   - Essayer la navigation privée (`Ctrl + Shift + N`)
   - Ou vider complètement le cache

3. **Les logs n'apparaissent pas dans la console**
   - Cela confirme que l'ancien code est toujours en cours d'exécution
   - Attendre le déploiement Vercel

### Erreur: "Category not found"

**Si vous voyez ce log :**
```
[ERROR] Category not found for utility type: telephone
```

**Cela signifie que la catégorie n'existe pas dans la base de données.**

**Solution :** Exécuter ce script dans Supabase SQL Editor :

```sql
-- Créer les catégories d'utilitaires
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

## 🎯 Résultat Attendu Final

### ✅ Succès Complet

- ✅ Logs détaillés dans la console
- ✅ Message de succès affiché
- ✅ Transaction créée et visible dans la liste
- ✅ Pas d'erreur "Failed to mark bill as paid"

### 📊 Prochaine Étape

Une fois que le paiement fonctionne, nous pourrons tester le **bug de la fréquence bimestriel** :
- Payer une facture avec fréquence "bimestriel"
- Vérifier que la prochaine date est calculée à **+2 mois** (et non +6 mois)

---

## 📞 Besoin d'Aide ?

Si le test échoue après avoir suivi toutes les étapes :

1. **Copier les logs de la console** (tout le contenu)
2. **Faire une capture d'écran** du message d'erreur
3. **Vérifier le statut du déploiement Vercel**
4. Me fournir ces informations pour diagnostic

---

**Temps total estimé :** 5-10 minutes (incluant l'attente du déploiement)
