# Guide de Clonage d'Environnement - Loft Algérie

## 📋 Vue d'ensemble

Ce document décrit comment utiliser le système de clonage d'environnement développé pour le projet Loft Algérie. Le système permet de cloner des environnements de manière sécurisée avec anonymisation automatique des données sensibles.

## 🛡️ Règles de Sécurité CRITIQUES

### ⚠️ PRODUCTION TOUJOURS EN LECTURE SEULE
- La production ne peut JAMAIS être une cible de clonage
- Toutes les connexions à la production sont automatiquement en lecture seule
- Blocage automatique de toute tentative d'écriture vers la production
- Alertes automatiques pour tout accès à la production

### 🔒 Protections Intégrées
- Double vérification avant chaque opération
- Validation des permissions de base de données
- Confirmation utilisateur pour les opérations sensibles
- Logs de sécurité pour toutes les opérations
- Rollback automatique en cas d'erreur

## 🚀 Méthodes de Clonage

### 1. Clonage Rapide (Recommandé)

**Pour créer un environnement de formation complet :**

```bash
# Commande simple - Configuration automatique
npx ts-node lib/environment-management/automation/training-environment-setup.ts
```

**Cette commande va automatiquement :**
- Cloner les données de production (lecture seule)
- Anonymiser toutes les données sensibles
- Créer des utilisateurs de formation
- Générer des données d'exemple
- Configurer les scénarios de formation
- Valider l'environnement final
- Générer un guide de formation

### 2. Clonage via CLI avec Options

```bash
# Clonage simple : Production → Test
npx ts-node lib/environment-management/cli/environment-cli.ts clone --source production --target test

# Clonage avec options complètes
npx ts-node lib/environment-management/cli/environment-cli.ts clone \
  --source production \
  --target training \
  --anonymize-data \
  --include-audit-logs \
  --include-conversations \
  --include-reservations \
  --dry-run
```

### 3. Clonage avec Configuration Personnalisée

```bash
# Avec fichier de configuration
npx ts-node lib/environment-management/automation/training-environment-setup.ts config/ma-config.json
```

**Exemple de fichier de configuration (config/ma-config.json) :**

```json
{
  "environmentName": "formation-2024",
  "baseEnvironment": "production",
  "sampleDataSize": "medium",
  "createTrainingUsers": true,
  "trainingUserRoles": [
    {
      "role": "admin",
      "count": 1,
      "permissions": ["all"],
      "sampleData": true
    },
    {
      "role": "manager", 
      "count": 2,
      "permissions": ["lofts", "reservations", "transactions"],
      "sampleData": true
    },
    {
      "role": "member",
      "count": 3,
      "permissions": ["lofts", "tasks"],
      "sampleData": true
    }
  ],
  "setupTrainingScenarios": true,
  "includeAuditSystem": true,
  "includeConversations": true,
  "includeReservations": true,
  "autoCleanupAfterDays": 30,
  "generateTrainingGuide": true
}
```

## 🔧 Commandes Utiles

### Gestion des Environnements

```bash
# Vérifier l'état des environnements
npx ts-node lib/environment-management/cli/environment-cli.ts status

# Lister tous les environnements disponibles
npx ts-node lib/environment-management/cli/environment-cli.ts list

# Valider un environnement spécifique
npx ts-node lib/environment-management/cli/environment-cli.ts validate test

# Changer d'environnement actif
npx ts-node lib/environment-management/cli/environment-cli.ts switch test

# Réinitialiser un environnement
npx ts-node lib/environment-management/cli/environment-cli.ts reset test --create-backup
```

### Commandes de Monitoring

```bash
# Afficher le statut détaillé
npx ts-node lib/environment-management/cli/environment-cli.ts status --all

# Générer un rapport de validation
npx ts-node lib/environment-management/cli/environment-cli.ts validate test --generate-report

# Vérifier la santé du système
npx ts-node lib/environment-management/cli/environment-cli.ts health-check
```

## 📊 Fonctionnalités du Système

### Anonymisation Automatique
- **Emails** : `user@example.com` → `user123@training.local`
- **Noms** : `Jean Dupont` → `Utilisateur 123`
- **Téléphones** : `+33123456789` → `+33100000123`
- **Adresses** : Adresses génériques réalistes
- **Données financières** : Montants réalistes mais fictifs

### Systèmes Spécialisés Clonés
- **Système d'audit** : Logs préservés avec anonymisation
- **Conversations** : Messages anonymisés, structure préservée
- **Réservations** : Données clients anonymisées
- **Notifications** : Système de test configuré

### Données Générées
- **Lofts** : Propriétés d'exemple avec configurations variées
- **Réservations** : Historique de réservations réaliste
- **Transactions** : Données financières d'exemple
- **Utilisateurs** : Comptes de formation avec rôles définis

## 👥 Utilisateurs de Formation Créés

### Comptes par Défaut
- **Admin** : `training.admin1@loft-algerie.training` / `TrainingAdmin1!`
- **Managers** : `training.manager[1-2]@loft-algerie.training` / `TrainingManager[1-2]!`
- **Membres** : `training.member[1-3]@loft-algerie.training` / `TrainingMember[1-3]!`
- **Observateurs** : `training.viewer[1-2]@loft-algerie.training` / `TrainingViewer[1-2]!`

### Permissions par Rôle
- **Admin** : Accès complet à toutes les fonctionnalités
- **Manager** : Gestion des lofts, réservations, transactions, rapports
- **Membre** : Gestion des lofts, réservations, tâches
- **Observateur** : Lecture seule sur toutes les données

## 🎯 Scénarios de Formation Inclus

### 1. Gestion Basique des Lofts
- Création, modification, suppression de lofts
- Attribution de propriétaires
- Configuration des prix et disponibilités

### 2. Workflow de Réservation
- Processus complet de réservation
- Gestion des clients
- Suivi des paiements

### 3. Gestion Financière
- Transactions et paiements
- Rapports financiers
- Gestion des factures

### 4. Collaboration d'Équipe
- Conversations et communication
- Gestion des tâches
- Coordination d'équipe

## 🔍 Validation et Monitoring

### Vérifications Automatiques
- **Connectivité base de données** : Vérification des connexions
- **Intégrité des données** : Validation des relations
- **Fonctionnalités** : Tests des principales fonctions
- **Performance** : Métriques de performance
- **Sécurité** : Vérification des permissions

### Rapports Générés
- **Rapport de clonage** : Statistiques détaillées
- **Guide de formation** : Documentation utilisateur
- **Rapport de validation** : État de santé de l'environnement
- **Métriques de performance** : Temps d'exécution et ressources

## 🚨 Dépannage

### Problèmes Courants

**Erreur de connexion à la base de données :**
```bash
# Vérifier la configuration
npx ts-node lib/environment-management/cli/environment-cli.ts validate production
```

**Échec de clonage :**
```bash
# Vérifier les logs
cat logs/environment-cloning.log

# Réessayer avec mode dry-run
npx ts-node lib/environment-management/cli/environment-cli.ts clone --source production --target test --dry-run
```

**Problème d'anonymisation :**
```bash
# Vérifier les règles d'anonymisation
npx ts-node lib/environment-management/cli/environment-cli.ts validate test --full-validation
```

### Récupération d'Erreur

**Rollback automatique :**
- Le système effectue automatiquement un rollback en cas d'erreur
- Les sauvegardes sont créées avant chaque opération majeure

**Restauration manuelle :**
```bash
# Lister les sauvegardes disponibles
npx ts-node lib/environment-management/cli/environment-cli.ts list-backups

# Restaurer depuis une sauvegarde
npx ts-node lib/environment-management/cli/environment-cli.ts restore --backup-id backup_20241215_143022
```

## 📁 Structure des Fichiers

### Fichiers de Configuration
- `.env.production` : Configuration production (lecture seule)
- `.env.test` : Configuration environnement de test
- `.env.training` : Configuration environnement de formation
- `.env.development` : Configuration développement local

### Logs et Rapports
- `logs/environment-cloning.log` : Logs des opérations de clonage
- `reports/validation-*.json` : Rapports de validation
- `backups/` : Sauvegardes automatiques
- `docs/training-guides/` : Guides de formation générés

## 🔄 Maintenance Régulière

### Nettoyage Automatique
- Les environnements de formation sont automatiquement nettoyés après 30 jours
- Les sauvegardes anciennes sont archivées automatiquement
- Les logs sont rotés pour éviter l'accumulation

### Mise à Jour des Données
```bash
# Rafraîchissement quotidien automatique
npx ts-node lib/environment-management/automation/daily-refresh.ts

# Rafraîchissement hebdomadaire complet
npx ts-node lib/environment-management/automation/weekly-refresh.ts
```

## 📞 Support

### En cas de problème
1. Vérifier les logs dans `logs/environment-cloning.log`
2. Exécuter la validation de l'environnement
3. Consulter ce guide pour les solutions courantes
4. Contacter l'administrateur système si nécessaire

### Informations de Debug
```bash
# Informations système complètes
npx ts-node lib/environment-management/cli/environment-cli.ts debug-info

# État détaillé des environnements
npx ts-node lib/environment-management/cli/environment-cli.ts status --verbose
```

---

**Dernière mise à jour :** Décembre 2024  
**Version du système :** 1.0.0  
**Auteur :** Système de Clonage d'Environnement Loft Algérie