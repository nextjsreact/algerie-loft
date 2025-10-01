# 🚀 GUIDE DE CLONAGE COMPLET PRODUCTION → DÉVELOPPEMENT

## 📋 Vue d'ensemble

Ce guide explique comment effectuer un **clonage complet** de la base de données de production vers l'environnement de développement.

### ⚠️ ATTENTION : OPÉRATION DESTRUCTIVE

Cette opération va :
- **DÉTRUIRE COMPLÈTEMENT** la base de données DEV
- **SUPPRIMER** toutes les tables, vues, fonctions, triggers
- **RECRÉER** le schéma complet depuis PROD
- **COPIER** toutes les données avec anonymisation

## 🔧 Prérequis

1. **Fichiers de configuration** :
   - `.env.prod` avec les accès PRODUCTION
   - `.env.development` avec les accès DÉVELOPPEMENT

2. **Permissions** :
   - Clé `service_role` pour les deux environnements
   - Accès en lecture sur PROD
   - Accès en écriture sur DEV

## 🚀 Étapes d'exécution

### 1. Setup initial (une seule fois)

```bash
# Installer les fonctions RPC nécessaires
npm run setup:clone-functions
```

### 2. Test des connexions

```bash
# Vérifier que tout est prêt
npm run clone:test-connections
```

### 3. Clonage complet

#### Option A : Via npm script
```bash
npm run clone:complete:prod-to-dev
```

#### Option B : Via script batch (Windows)
```bash
scripts\complete-clone.bat
```

#### Option C : Exécution directe
```bash
npx tsx scripts/complete-clone-prod-to-dev.ts
```

## 📊 Processus détaillé

### Phase 1 : Confirmation
- Demande de confirmation avec phrase de sécurité
- Vérification des accès aux deux environnements

### Phase 2 : Destruction DEV
- Désactivation des contraintes FK
- Suppression de toutes les tables
- Suppression de toutes les vues
- Suppression des fonctions personnalisées
- Nettoyage complet du schéma

### Phase 3 : Récupération schéma PROD
- Extraction du schéma complet
- Génération des commandes CREATE TABLE
- Récupération des contraintes et index

### Phase 4 : Recréation DEV
- Application du schéma sur DEV
- Création de toutes les tables
- Restauration des contraintes

### Phase 5 : Copie des données
- Copie table par table dans l'ordre des dépendances
- Anonymisation des données sensibles
- Insertion par lots pour éviter les timeouts

### Phase 6 : Validation
- Vérification de l'intégrité
- Test des tables critiques
- Rapport final

## 🔒 Sécurité et anonymisation

### Données anonymisées automatiquement :

**Table `profiles` :**
- `email` → `admin_dev@dev.local` ou `user_dev_X@dev.local`
- `full_name` → `Nom (DEV)`
- `airbnb_access_token` → `null`
- `airbnb_refresh_token` → `null`

**Table `notifications` :**
- `message` → Anonymisé si contient des emails
- `is_read` → `true`
- `read_at` → Date actuelle

### Protections de sécurité :

✅ **Impossible d'écrire sur PROD** : Vérifications multiples
✅ **Confirmation obligatoire** : Phrase de sécurité requise
✅ **Validation des URLs** : Détection des URLs de production
✅ **Logs détaillés** : Traçabilité complète

## 📈 Ordre de clonage des tables

Les tables sont clonées dans cet ordre pour respecter les contraintes FK :

1. `currencies`
2. `categories`
3. `zone_areas`
4. `internet_connection_types`
5. `payment_methods`
6. `loft_owners`
7. `teams`
8. `profiles`
9. `lofts`
10. `team_members`
11. `tasks`
12. `transactions`
13. `transaction_category_references`
14. `settings`
15. `notifications`
16. `customers`
17. `loft_photos`

## 🛠️ Dépannage

### Erreur "Fonction execute_sql introuvable"
```bash
# Réinstaller les fonctions RPC
npm run setup:clone-functions
```

### Erreur de connexion
```bash
# Tester les connexions
npm run clone:test-connections
```

### Erreur de permissions
- Vérifier que les clés `service_role` sont correctes
- Vérifier les permissions RLS dans Supabase

### Timeout sur de gros volumes
- Le script utilise des lots de 50 enregistrements
- Les timeouts sont gérés automatiquement

## 📊 Exemple de sortie

```
🚀 CLONAGE COMPLET PRODUCTION → DÉVELOPPEMENT
============================================================

🗑️ SUPPRESSION COMPLÈTE DE LA BASE DEV
==================================================
🔧 Désactivation des contraintes FK...
✅ Désactivation des contraintes FK terminé
🗑️ Suppression de 15 tables...
✅ Base DEV complètement nettoyée

📋 RÉCUPÉRATION DU SCHÉMA PRODUCTION
==================================================
📋 Construction du schéma pour 15 tables...
✅ Schéma construit manuellement

🏗️ APPLICATION DU SCHÉMA SUR DEV
==================================================
📋 Application de 45 commandes SQL...
✅ Schéma appliqué sur DEV

📊 COPIE DES DONNÉES PROD → DEV
==================================================
📋 Copie: currencies
📥 3 enregistrements récupérés
✅ currencies: 3 enregistrements copiés

📋 Copie: lofts
📥 25 enregistrements récupérés
✅ lofts: 25 enregistrements copiés

🎉 COPIE TERMINÉE: 156 enregistrements au total

🔍 VALIDATION DU CLONAGE
==================================================
✅ lofts: accessible
✅ profiles: accessible
✅ teams: accessible
✅ categories: accessible

🎉 CLONAGE COMPLET TERMINÉ!
============================================================
⏱️ Durée totale: 45s
✅ Base DEV complètement recréée depuis PROD
🔒 Données sensibles anonymisées

💡 PROCHAINES ÉTAPES:
• Testez votre application: npm run dev
• Mot de passe universel DEV: dev123
```

## 🎯 Avantages de cette approche

✅ **Clonage parfait** : Schéma + données identiques à PROD
✅ **Pas de conflits** : Destruction complète avant recréation
✅ **Sécurité maximale** : Anonymisation automatique
✅ **Robustesse** : Gestion d'erreurs et récupération
✅ **Traçabilité** : Logs détaillés de chaque étape
✅ **Performance** : Insertion par lots optimisée

## 🚨 Points d'attention

⚠️ **Opération irréversible** : Toutes les données DEV sont perdues
⚠️ **Durée variable** : Dépend du volume de données (30s à 5min)
⚠️ **Connexion stable** : Nécessite une connexion internet stable
⚠️ **Permissions** : Nécessite les droits service_role

## 📞 Support

En cas de problème :
1. Vérifiez les logs détaillés
2. Testez les connexions avec `npm run clone:test-connections`
3. Réinstallez les fonctions avec `npm run setup:clone-functions`
4. Vérifiez les fichiers `.env.prod` et `.env.development`