# GUIDE COMPLET DE CLONAGE D'ENVIRONNEMENT
## Système de Gestion Loft Algérie

Ce guide vous explique comment cloner complètement un environnement de base de données vers un autre, en préservant toutes les données, configurations et relations.

## 🎯 Objectif

Créer une copie exacte d'un environnement (PROD → TEST ou PROD → DEV) incluant :
- ✅ Schéma complet de base de données
- ✅ Toutes les données avec relations préservées
- ✅ Configuration des permissions (RLS)
- ✅ Données de référence et seed data
- ✅ Vérification d'intégrité post-clonage

## 📋 Prérequis

### 1. Environnements configurés
Assurez-vous d'avoir les fichiers d'environnement :
- `.env.production` (source PROD)
- `.env.test` (cible TEST)
- `.env.development` (cible DEV)

### 2. Permissions Supabase
- Accès administrateur aux projets source et cible
- Service Role Keys configurées
- Accès au Supabase Dashboard

### 3. Outils installés
```bash
npm install
# Vérifiez que tsx est disponible
npx tsx --version
```

## 🚀 Procédure de Clonage

### Étape 1: Préparation
```bash
# Vérifiez vos environnements
npm run test-env

# Créez une sauvegarde manuelle (optionnel)
npm run export:test  # ou export:dev selon la cible
```

### Étape 2: Clonage Automatique
```bash
# Cloner PROD vers TEST
npm run tsx scripts/clone-environment-complet.ts prod test

# Cloner PROD vers DEV
npm run tsx scripts/clone-environment-complet.ts prod dev

# Cloner TEST vers DEV
npm run tsx scripts/clone-environment-complet.ts test dev
```

### Étape 3: Configuration du Schéma
Le script génère des instructions pour appliquer le schéma. Suivez ces étapes :

1. **Ouvrez Supabase Dashboard** de l'environnement cible
2. **Allez dans SQL Editor**
3. **Exécutez le schéma complet** :
   ```sql
   -- Copiez le contenu de database/complete-schema.sql
   -- Ou exécutez section par section
   ```

### Étape 4: Vérification
```bash
# Diagnostic complet
npm run tsx scripts/complete-sync-diagnosis.ts

# Test de l'environnement
npm run env:test  # ou env:dev
npm run test-env
```

## 📊 Structure des Données Clonées

### Tables de Référence (clonées en premier)
- `zone_areas` - Zones géographiques
- `internet_connection_types` - Types de connexion internet
- `categories` - Catégories de transactions
- `currencies` - Devises
- `payment_methods` - Méthodes de paiement

### Tables Principales
- `loft_owners` - Propriétaires de lofts
- `lofts` - Informations des lofts avec factures
- `profiles` - Profils utilisateurs (sans mots de passe)

### Tables Relationnelles
- `teams` - Équipes
- `team_members` - Membres d'équipes
- `tasks` - Tâches
- `transactions` - Transactions financières
- `notifications` - Notifications système

### Tables de Configuration
- `transaction_category_references` - Montants de référence
- `settings` - Paramètres système

## 🔧 Fonctionnalités Avancées

### Sauvegarde Automatique
Le script crée automatiquement une sauvegarde avant clonage :
```
backup_[environment]_[timestamp].json
```

### Restauration en cas de Problème
```bash
npm run tsx scripts/restore-database.ts backup_test_1234567890.json
```

### Adaptation Automatique du Schéma
Le script s'adapte automatiquement aux différences de schéma :
- Colonnes manquantes → valeurs par défaut
- Colonnes supplémentaires → ignorées
- Types incompatibles → conversion automatique

### Rapport Détaillé
Chaque clonage génère un rapport complet :
- `clone_report_[source]_to_[target]_[timestamp].json`
- Statistiques détaillées par table
- Liste des erreurs et avertissements
- Instructions de suivi

## ⚠️ Points d'Attention

### Sécurité
- ❌ **Les mots de passe ne sont PAS clonés** (sécurité)
- ❌ **Impossible de cloner vers PROD** (protection)
- ✅ **Tokens régénérés automatiquement**

### Données Sensibles
- Les informations personnelles sont préservées
- Les données financières sont clonées intégralement
- Les configurations de facturation sont maintenues

### Performance
- Clonage par lots pour éviter les timeouts
- Ordre de dépendance respecté
- Gestion des erreurs individuelles

## 🛠️ Dépannage

### Erreur de Connexion
```bash
# Vérifiez vos variables d'environnement
cat .env.test
cat .env.production

# Testez la connexion
npm run test-env
```

### Erreur de Schéma
```bash
# Appliquez le schéma manuellement
# 1. Ouvrez Supabase Dashboard
# 2. SQL Editor
# 3. Copiez database/complete-schema.sql
```

### Données Partielles
```bash
# Relancez le clonage pour les tables manquantes
npm run tsx scripts/clone-environment-complet.ts prod test

# Ou restaurez depuis la sauvegarde
npm run tsx scripts/restore-database.ts backup_test_[timestamp].json
```

### Permissions RLS
```sql
-- Si les permissions sont incorrectes, réappliquez :
-- (Dans Supabase SQL Editor)

-- Réinitialiser les politiques
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON [table_name];
CREATE POLICY "Allow all access to authenticated users" ON [table_name] FOR ALL USING (auth.uid() IS NOT NULL);
```

## 📈 Optimisations

### Clonage Rapide (Tables Spécifiques)
```bash
# Pour cloner seulement certaines tables, modifiez TABLE_ORDER dans le script
```

### Clonage Incrémental
```bash
# Utilisez les scripts existants pour des mises à jour partielles
npm run clone:prod-to-test-smart
npm run sync:prod-to-test
```

### Automatisation
```bash
# Ajoutez au cron pour clonage automatique quotidien
0 2 * * * cd /path/to/project && npm run tsx scripts/clone-environment-complet.ts prod test
```

## 📞 Support

### Logs et Diagnostics
```bash
# Diagnostic complet
npm run diagnose:complete

# Vérification des schémas
npm run diagnose:schema

# Test de sécurité
npm run test:security
```

### Fichiers de Configuration
- `database/complete-schema.sql` - Schéma complet
- `scripts/clone-environment-complet.ts` - Script principal
- `scripts/restore-database.ts` - Script de restauration

### Scripts Utiles
```bash
# Commandes rapides
npm run export:prod:anonymized    # Export anonymisé
npm run quick-export:prod         # Export rapide
npm run health:check             # Vérification santé
```

## 🎉 Résultat Attendu

Après un clonage réussi, vous devriez avoir :
- ✅ Base de données cible identique à la source
- ✅ Toutes les relations préservées
- ✅ Fonctionnalités testables immédiatement
- ✅ Rapport de clonage détaillé
- ✅ Sauvegarde de sécurité disponible

## 📝 Checklist Post-Clonage

- [ ] Schéma appliqué dans Supabase Dashboard
- [ ] Test de connexion réussi (`npm run test-env`)
- [ ] Application démarre (`npm run dev`)
- [ ] Connexion utilisateur fonctionne
- [ ] Données visibles dans l'interface
- [ ] Transactions et lofts affichés correctement
- [ ] Notifications système actives
- [ ] Permissions RLS fonctionnelles

---

**Note**: Ce guide couvre le clonage complet d'environnement. Pour des besoins spécifiques ou des problèmes non couverts, consultez les scripts individuels dans le dossier `scripts/`.