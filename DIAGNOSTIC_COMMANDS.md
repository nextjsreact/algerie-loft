# 🔍 Commandes de diagnostic - Déploiement v2.0.1

Ce document contient toutes les commandes pour diagnostiquer les problèmes potentiels.

---

## 📦 Vérifier la configuration locale

### 1. Vérifier Node.js
```bash
node --version
# Attendu: v20.x.x ou supérieur
```

### 2. Vérifier .nvmrc
```bash
cat .nvmrc
# Attendu: 20
```

### 3. Vérifier package.json engines
```bash
grep -A 2 '"engines"' package.json
# Attendu: "node": ">=20.9.0"
```

### 4. Vérifier les workflows GitHub
```bash
# ci-cd.yml
grep "NODE_VERSION" .github/workflows/ci-cd.yml
# Attendu: NODE_VERSION: '20'

# test-e2e.yml
grep "node-version" .github/workflows/test-e2e.yml
# Attendu: node-version: '20' (2 occurrences)
```

### 5. Vérifier la correction du code
```bash
grep -A 2 "category:" app/actions/bill-notifications.ts | grep utilityType
# Attendu: category: utilityType,
```

---

## 🔄 Vérifier l'état Git

### 1. Vérifier le dernier commit
```bash
git log --oneline -1
# Attendu: f5aeb56 fix: Mettre à jour Node.js vers v20...
```

### 2. Vérifier que le commit est poussé
```bash
git status -sb
# Attendu: ## main...origin/main (pas de "ahead")
```

### 3. Vérifier les fichiers modifiés dans le commit
```bash
git show --name-only f5aeb56
# Attendu: Liste des fichiers modifiés
```

### 4. Vérifier le diff du commit
```bash
git show f5aeb56
# Voir tous les changements
```

---

## 🌐 Vérifier le déploiement GitHub Actions

### 1. Lister les derniers workflows
```bash
gh run list --limit 5
# Nécessite: gh auth login
```

### 2. Voir les détails d'un workflow
```bash
gh run view <run-id>
```

### 3. Voir les logs d'un workflow
```bash
gh run view <run-id> --log
```

### 4. Vérifier le statut du dernier workflow
```bash
gh run list --limit 1 --json status,conclusion,name,createdAt
```

---

## 🗄️ Vérifier la base de données (Supabase)

### 1. Vérifier le schéma de la table transactions
```sql
-- Exécuter dans Supabase SQL Editor
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
```

**Attendu pour la colonne `category`:**
```
column_name: category
data_type: character varying (VARCHAR)
is_nullable: YES
```

### 2. Vérifier les catégories existantes
```sql
SELECT id, name, type 
FROM categories 
WHERE name IN ('eau', 'energie', 'telephone', 'internet')
ORDER BY name;
```

**Attendu:**
```
3914fe08-869d-46d4-81be-3a6719f583b6 | eau       | expense
4e27689b-4bf4-4609-916e-bafe35adb70f | energie   | expense
16ba954c-4209-4c5c-a0aa-58bc99d929dc | internet  | expense
9a2fae5c-7895-4c0d-8ef3-ad57bd1614ae | telephone | expense
```

### 3. Vérifier le loft "Camomille loft"
```sql
SELECT 
    id, 
    name, 
    frequence_paiement_telephone,
    prochaine_echeance_telephone
FROM lofts
WHERE name ILIKE '%camomille%';
```

**Attendu:**
```
id: aa064685-6852-450e-8a04-39c638e44fd7
name: Camomille loft
frequence_paiement_telephone: bimestriel
prochaine_echeance_telephone: 2026-05-12 (ou autre date)
```

### 4. Vérifier les dernières transactions
```sql
SELECT 
    id,
    loft_id,
    category,
    amount,
    description,
    date,
    created_at
FROM transactions
WHERE loft_id = 'aa064685-6852-450e-8a04-39c638e44fd7'
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Vérifier les devises disponibles
```sql
SELECT id, code, name, symbol, is_default, ratio
FROM currencies
ORDER BY is_default DESC, code;
```

### 6. Vérifier les modes de paiement
```sql
SELECT id, name
FROM payment_methods
ORDER BY name;
```

---

## 🧪 Tests manuels dans la console du navigateur

### 1. Vérifier que le code est déployé
```javascript
// Ouvrir F12 → Console
// Chercher dans les sources: bill-notifications.ts
// Vérifier la présence de "REBUILD v2.0.1"
```

### 2. Tester l'action markBillAsPaid (si accessible)
```javascript
// Note: Cette fonction est côté serveur, pas accessible directement
// Utiliser le formulaire de paiement dans l'interface
```

### 3. Vérifier les logs après un paiement
```javascript
// Après avoir cliqué sur "Record Payment", chercher dans la console:
// [CLIENT v2.0.1] Recording bill payment...
// [CLIENT v2.0.1 SUCCESS] Bill payment recorded successfully
// OU
// [CLIENT v2.0.1 ERROR] markBillAsPaid failed: ...
```

---

## 🔧 Commandes de réparation

### Si le commit n'est pas poussé
```bash
git push origin main
```

### Si des fichiers ne sont pas commités
```bash
git add .
git commit -m "fix: Additional fixes for v2.0.1"
git push origin main
```

### Si besoin de forcer le rebuild
```bash
# Créer un commit vide pour forcer le rebuild
git commit --allow-empty -m "chore: Force rebuild"
git push origin main
```

### Si besoin de revenir en arrière
```bash
# Voir les derniers commits
git log --oneline -5

# Revenir au commit précédent (ATTENTION: perte de données)
git reset --hard <commit-hash>
git push origin main --force
```

---

## 📊 Vérifier Vercel

### 1. Via l'interface web
- Aller sur https://vercel.com/dashboard
- Sélectionner le projet "algerie-loft"
- Vérifier l'onglet "Deployments"
- Chercher le déploiement correspondant au commit `f5aeb56`

### 2. Via Vercel CLI (si installé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lister les déploiements
vercel ls

# Voir les logs du dernier déploiement
vercel logs
```

---

## 🐛 Diagnostiquer le bug bimestriel (TASK 2)

### 1. Vérifier la fréquence actuelle
```sql
SELECT 
    name,
    frequence_paiement_telephone,
    prochaine_echeance_telephone
FROM lofts
WHERE id = 'aa064685-6852-450e-8a04-39c638e44fd7';
```

### 2. Vérifier la fonction SQL de calcul
```sql
-- Voir la définition de la fonction
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'calculate_next_due_date';
```

### 3. Tester la fonction SQL manuellement
```sql
-- Tester avec bimestriel
SELECT calculate_next_due_date('2026-05-18'::date, 'bimestriel');
-- Attendu: 2026-07-18 (+ 2 mois)
```

### 4. Vérifier les triggers
```sql
-- Lister les triggers sur la table lofts
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'lofts';
```

### 5. Exécuter le script de diagnostic complet
```sql
-- Copier le contenu de test-data/debug_camomille_telephone.sql
-- et l'exécuter dans Supabase SQL Editor
```

---

## 📝 Logs à collecter en cas de problème

### 1. Logs GitHub Actions
- Aller sur https://github.com/nextjsreact/algerie-loft/actions
- Cliquer sur le workflow le plus récent
- Copier les logs de l'étape qui échoue

### 2. Logs Vercel
- Aller sur https://vercel.com/dashboard
- Sélectionner le projet
- Onglet "Deployments" → Cliquer sur le déploiement
- Copier les logs de build ou runtime

### 3. Logs du navigateur
- Ouvrir F12 → Console
- Copier tous les logs qui commencent par `[CLIENT v2.0.1]`
- Copier aussi les erreurs en rouge

### 4. Logs de la base de données
- Si une requête SQL échoue, copier le message d'erreur complet
- Inclure le code SQL qui a été exécuté

---

## 🆘 Checklist de diagnostic complète

Cocher chaque étape au fur et à mesure:

### Configuration locale
- [ ] Node.js version >= 20.9.0
- [ ] .nvmrc contient "20"
- [ ] package.json contient engines.node >= 20.9.0
- [ ] ci-cd.yml contient NODE_VERSION: '20'
- [ ] test-e2e.yml contient node-version: '20' (2x)
- [ ] bill-notifications.ts contient "category: utilityType"

### État Git
- [ ] Dernier commit est f5aeb56
- [ ] Commit est poussé vers GitHub (origin/main)
- [ ] Pas de fichiers non commités (sauf docs)

### Déploiement
- [ ] Build GitHub Actions réussi
- [ ] Déploiement Vercel réussi
- [ ] Site accessible sur https://www.loftalgerie.com

### Base de données
- [ ] Colonne transactions.category est VARCHAR
- [ ] 4 catégories existent (eau, energie, telephone, internet)
- [ ] Loft "Camomille loft" existe
- [ ] Devises et modes de paiement existent

### Tests
- [ ] Cache du navigateur vidé
- [ ] Formulaire de paiement accessible
- [ ] Logs [CLIENT v2.0.1] visibles dans la console
- [ ] Paiement réussi OU erreur claire dans les logs

---

**📍 Utilisation:** Exécuter ces commandes dans l'ordre pour diagnostiquer les problèmes étape par étape.
