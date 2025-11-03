# Guide de Résolution - Erreur d'Inscription Client

## 🚨 Problème Identifié

L'erreur "Database error saving new user" lors de l'inscription client est causée par un conflit dans la structure de la table `customers` :

- La table `customers` est définie avec un ID auto-généré (`gen_random_uuid()`)
- Le code d'inscription essaie d'insérer avec l'ID de l'utilisateur Supabase Auth
- Cela crée un conflit et empêche l'insertion

## 🔧 Solution

### Étape 1: Corriger la Structure de la Base de Données

Exécutez ces scripts SQL dans votre console Supabase (dans l'ordre) :

1. **Corriger la table customers :**
   ```sql
   -- Exécuter le contenu de database/fix-customers-table-structure.sql
   ```

2. **Installer le trigger de synchronisation automatique :**
   ```sql
   -- Exécuter le contenu de database/auto-sync-client-customers.sql
   ```

### Étape 2: Vérifier la Correction

Exécutez le script de test :

```bash
node test-client-registration-fix.js
```

## 📋 Scripts Créés

1. **`database/fix-customers-table-structure.sql`** - Corrige la structure de la table customers
2. **`database/apply-customer-fixes.sql`** - Script complet pour appliquer toutes les corrections
3. **`test-client-registration-fix.js`** - Script de test pour vérifier que tout fonctionne

## 🔍 Changements Apportés

### Structure de la Table `customers`

**AVANT (problématique) :**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ❌ Auto-généré
  -- ...
);
```

**APRÈS (corrigé) :**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- ✅ Référence auth.users
  -- ...
);
```

### Trigger de Synchronisation

Le trigger `sync_client_customers_trigger` créera automatiquement un enregistrement dans `customers` quand un utilisateur avec le rôle 'client' est créé dans `auth.users`.

## 🧪 Test de Validation

Le script de test vérifie :

1. ✅ Création d'un utilisateur avec rôle 'client'
2. ✅ Auto-création de l'enregistrement customer par le trigger
3. ✅ Simulation de connexion
4. ✅ Nettoyage des données de test

## 🚀 Après la Correction

Une fois les scripts exécutés, l'inscription client devrait fonctionner normalement :

1. L'utilisateur remplit le formulaire d'inscription
2. `registerClientComplete()` crée l'utilisateur dans Supabase Auth
3. Le trigger crée automatiquement l'enregistrement dans `customers`
4. L'inscription se termine avec succès

## 🔧 Commandes Rapides

```bash
# 1. Appliquer les corrections en base
# Exécuter dans Supabase SQL Editor: database/apply-customer-fixes.sql

# 2. Tester la correction
node test-client-registration-fix.js

# 3. Redémarrer l'application
npm run dev
```

## 📞 Support

Si le problème persiste après avoir appliqué ces corrections :

1. Vérifiez les logs Supabase pour des erreurs spécifiques
2. Assurez-vous que les politiques RLS sont correctement configurées
3. Vérifiez que le trigger est bien installé dans la base de données