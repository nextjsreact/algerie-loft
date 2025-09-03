# Fix pour l'erreur de base de données - Colonnes de facturation manquantes

## 🚨 Problème identifié
```
Error marking bill as paid: {
  code: '42703',
  details: null,
  hint: null,
  message: 'could not identify column "prochaine_echeance_energie" in record data type'
}
```

## 🔧 Solution

### Option 1: Exécution automatique (Recommandée)
```bash
# Exécuter le script de correction
node scripts/run-billing-fix.js
```

### Option 2: Correction manuelle via Supabase Dashboard

1. **Ouvrez votre dashboard Supabase**
2. **Allez dans SQL Editor**
3. **Exécutez le script suivant :**

```sql
-- Ajouter les colonnes de facturation manquantes
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_eau VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_eau DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_telephone VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_telephone DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_internet VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_internet DATE;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_lofts_eau_due_date ON lofts(prochaine_echeance_eau) WHERE prochaine_echeance_eau IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_energie_due_date ON lofts(prochaine_echeance_energie) WHERE prochaine_echeance_energie IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_telephone_due_date ON lofts(prochaine_echeance_telephone) WHERE prochaine_echeance_telephone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_internet_due_date ON lofts(prochaine_echeance_internet) WHERE prochaine_echeance_internet IS NOT NULL;
```

### Option 3: Via Supabase CLI
```bash
# Si vous utilisez Supabase CLI
supabase db push --file scripts/supabase_migrations/26-add-billing-columns-to-lofts.sql
```

## ✅ Vérification

Après avoir exécuté la correction, vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lofts' 
AND column_name LIKE '%echeance%' 
ORDER BY column_name;
```

Vous devriez voir :
- `prochaine_echeance_eau`
- `prochaine_echeance_energie`
- `prochaine_echeance_internet`
- `prochaine_echeance_telephone`

## 🎯 Résultat attendu

Une fois la correction appliquée :
- ✅ L'erreur "could not identify column" disparaîtra
- ✅ Les fonctionnalités de facturation fonctionneront correctement
- ✅ Les alertes de factures pourront être marquées comme payées
- ✅ Les performances seront optimisées grâce aux index

## 📋 Colonnes ajoutées

| Colonne | Type | Description |
|---------|------|-------------|
| `frequence_paiement_eau` | VARCHAR(20) | Fréquence de paiement des factures d'eau |
| `prochaine_echeance_eau` | DATE | Prochaine échéance de la facture d'eau |
| `frequence_paiement_energie` | VARCHAR(20) | Fréquence de paiement des factures d'énergie |
| `prochaine_echeance_energie` | DATE | Prochaine échéance de la facture d'énergie |
| `frequence_paiement_telephone` | VARCHAR(20) | Fréquence de paiement des factures de téléphone |
| `prochaine_echeance_telephone` | DATE | Prochaine échéance de la facture de téléphone |
| `frequence_paiement_internet` | VARCHAR(20) | Fréquence de paiement des factures d'internet |
| `prochaine_echeance_internet` | DATE | Prochaine échéance de la facture d'internet |

## 🚀 Après la correction

Une fois la correction appliquée, redémarrez votre application :
```bash
npm run dev
# ou
yarn dev
```

L'erreur devrait disparaître et les fonctionnalités de facturation devraient fonctionner normalement.