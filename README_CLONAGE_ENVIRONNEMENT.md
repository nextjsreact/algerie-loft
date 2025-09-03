# 🚀 SYSTÈME COMPLET DE CLONAGE D'ENVIRONNEMENT

## Loft Algérie - Gestion des Bases de Données

Ce système vous permet de cloner complètement et facilement vos environnements de base de données, en préservant toutes les données, relations et configurations.

## ⚡ Démarrage Rapide

### Option 1: Guide Interactif (Recommandé)

```bash
npm run guide:clone
```

Le guide vous accompagne pas à pas dans tout le processus.

### Option 2: Commandes Directes

```bash
# Cloner PROD vers TEST
npm run clone:complete:prod-to-test

# Cloner PROD vers DEV
npm run clone:complete:prod-to-dev

# Valider le résultat
npm run validate:test
```

## 📋 Scripts Disponibles

### 🔄 Clonage Complet

| Commande                              | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `npm run guide:clone`                 | **Guide interactif** - Recommandé pour débuter |
| `npm run clone:complete:prod-to-test` | Clone PROD → TEST                              |
| `npm run clone:complete:prod-to-dev`  | Clone PROD → DEV                               |
| `npm run clone:complete:test-to-dev`  | Clone TEST → DEV                               |

### 🔍 Validation

| Commande                       | Description                 |
| ------------------------------ | --------------------------- |
| `npm run validate:test`        | Valide l'environnement TEST |
| `npm run validate:dev`         | Valide l'environnement DEV  |
| `npm run validate:clone [env]` | Validation personnalisée    |

### ⚙️ Configuration

| Commande                      | Description                         |
| ----------------------------- | ----------------------------------- |
| `npm run setup:test`          | Configure nouvel environnement TEST |
| `npm run setup:dev`           | Configure nouvel environnement DEV  |
| `npm run setup:new-env [env]` | Configuration personnalisée         |

### 💾 Sauvegarde & Restauration

| Commande                          | Description                    |
| --------------------------------- | ------------------------------ |
| `npm run export:test`             | Exporte l'environnement TEST   |
| `npm run export:dev`              | Exporte l'environnement DEV    |
| `npm run restore:database [file]` | Restaure depuis une sauvegarde |

## 🎯 Cas d'Usage Typiques

### 1. Premier Clonage PROD → TEST

```bash
# 1. Guide interactif (plus simple)
npm run guide:clone

# 2. Ou commandes directes
npm run clone:complete:prod-to-test
npm run validate:test
npm run env:test
npm run dev
```

### 2. Mise à Jour Régulière TEST

```bash
# Clonage rapide avec validation
npm run clone:complete:prod-to-test && npm run validate:test
```

### 3. Nouvel Environnement de DEV

```bash
# Configuration complète
npm run setup:dev
npm run clone:complete:prod-to-dev
npm run validate:dev
```

### 4. Récupération d'Urgence

```bash
# Restauration depuis sauvegarde
npm run restore:database backup_test_1234567890.json
npm run validate:test
```

## 📊 Données Clonées

### ✅ Inclus dans le Clonage

- **Schéma complet** - Tables, types, fonctions, triggers
- **Toutes les données** - Lofts, transactions, utilisateurs
- **Relations préservées** - Clés étrangères maintenues
- **Données de référence** - Catégories, devises, zones
- **Configuration système** - Paramètres, notifications
- **Permissions RLS** - Sécurité maintenue

### ❌ Exclus du Clonage (Sécurité)

- **Mots de passe utilisateurs** - Régénérés automatiquement
- **Tokens d'authentification** - Nouveaux tokens créés
- **Clés API externes** - À reconfigurer manuellement

## 🔒 Sécurité

### Protections Intégrées

- ❌ **Impossible de cloner vers PROD** (protection absolue)
- ✅ **Sauvegarde automatique** avant chaque clonage
- ✅ **Validation post-clonage** systématique
- ✅ **Logs détaillés** de toutes les opérations

### Données Sensibles

- Les informations personnelles sont clonées (nécessaire pour les tests)
- Les mots de passe sont automatiquement invalidés
- Les tokens d'API doivent être reconfigurés manuellement

## 📁 Structure des Fichiers

```
scripts/
├── clone-environment-complet.ts    # Script principal de clonage
├── restore-database.ts             # Restauration depuis sauvegarde
├── validate-clone.ts               # Validation post-clonage
├── setup-new-environment.ts        # Configuration nouvel environnement
├── guide-clonage-rapide.ts         # Guide interactif
└── ...

database/
├── complete-schema.sql             # Schéma complet de la DB
├── master-schema.sql               # Schéma maître
└── ...

Fichiers générés:
├── clone_report_*.json             # Rapports de clonage
├── backup_*.json                   # Sauvegardes automatiques
├── validation_report_*.json        # Rapports de validation
├── clone_instructions_*.md         # Instructions détaillées
└── setup_instructions_*.md         # Instructions de configuration
```

## 🛠️ Dépannage

### Problèmes Courants

#### 1. Erreur de Connexion

```bash
# Vérifiez vos fichiers d'environnement
ls -la .env.*

# Testez la connexion
npm run test-env
```

#### 2. Schéma Incomplet

```bash
# Appliquez manuellement le schéma
# 1. Ouvrez Supabase Dashboard
# 2. SQL Editor
# 3. Copiez database/complete-schema.sql
# 4. Exécutez section par section
```

#### 3. Données Partielles

```bash
# Relancez le clonage
npm run clone:complete:prod-to-test

# Ou restaurez depuis sauvegarde
npm run restore:database backup_test_[timestamp].json
```

#### 4. Permissions RLS

```sql
-- Dans Supabase SQL Editor, réappliquez les politiques :
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON [table];
CREATE POLICY "Allow all access to authenticated users" ON [table]
FOR ALL USING (auth.uid() IS NOT NULL);
```

### Logs et Diagnostics

```bash
# Diagnostic complet
npm run diagnose:complete

# Vérification des schémas
npm run diagnose:schema

# Test de sécurité
npm run test:security
```

## 📈 Optimisations

### Clonage Rapide

- Le système clone par lots pour éviter les timeouts
- L'ordre des tables respecte les dépendances
- Les erreurs individuelles n'arrêtent pas le processus

### Adaptation Automatique

- Colonnes manquantes → valeurs par défaut
- Colonnes supplémentaires → ignorées
- Types incompatibles → conversion automatique

### Validation Intelligente

- Test de toutes les fonctionnalités critiques
- Vérification des relations entre tables
- Contrôle d'intégrité des données

## 🎉 Fonctionnalités Avancées

### Rapports Détaillés

Chaque opération génère un rapport complet avec :

- Statistiques par table
- Liste des adaptations effectuées
- Erreurs et avertissements
- Instructions de suivi

### Sauvegarde Intelligente

- Sauvegarde automatique avant clonage
- Format JSON pour faciliter la restauration
- Horodatage pour éviter les conflits

### Guide Interactif

- Interface utilisateur simple
- Validation des prérequis
- Confirmation des opérations sensibles
- Actions de suivi suggérées

## 📞 Support

### Documentation

- `GUIDE_CLONAGE_COMPLET.md` - Guide détaillé
- `README_CLONAGE_ENVIRONNEMENT.md` - Ce fichier
- Instructions générées automatiquement

### Scripts d'Aide

```bash
# Guide interactif
npm run guide:clone

# Validation environnement
npm run validate:test

# Configuration nouvel environnement
npm run setup:dev

# Diagnostic complet
npm run diagnose:complete
```

### Fichiers de Configuration

- `.env.production` - Environnement PROD
- `.env.test` - Environnement TEST
- `.env.development` - Environnement DEV

## ✅ Checklist de Réussite

Après un clonage réussi, vous devriez avoir :

- [ ] ✅ Rapport de clonage sans erreurs critiques
- [ ] ✅ Validation post-clonage réussie
- [ ] ✅ Connexion à la base de données fonctionnelle
- [ ] ✅ Application qui démarre (`npm run dev`)
- [ ] ✅ Interface utilisateur accessible
- [ ] ✅ Données visibles (lofts, transactions)
- [ ] ✅ Fonctionnalités de base opérationnelles
- [ ] ✅ Notifications système actives

## 🚀 Prochaines Étapes

1. **Testez le guide interactif** : `npm run guide:clone`
2. **Configurez vos environnements** si nécessaire
3. **Effectuez votre premier clonage**
4. **Validez le résultat**
5. **Intégrez dans votre workflow de développement**

---

**💡 Conseil** : Commencez toujours par le guide interactif (`npm run guide:clone`) qui vous accompagnera dans tout le processus étape par étape.
