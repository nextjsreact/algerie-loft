# Requirements Document

## Introduction

Ce document définit les exigences pour créer un système automatisé de création d'environnements de test et de formation identiques à l'environnement de production. L'objectif est de permettre aux développeurs et formateurs de disposer d'un environnement sûr pour tester et former sans risquer d'affecter les données de production.

Le système de production actuel comprend :
- Schéma de base complet avec gestion des lofts, transactions, tâches, équipes
- Système d'audit complet avec logs détaillés et triggers automatiques
- Système de conversations avec messages en temps réel
- Système de réservations avec calendrier de disponibilité et tarification
- Notifications automatiques de factures avec calcul des échéances
- Notifications de tâches et système de communication
- Gestion des références de montants pour alertes de transactions
- Système de sécurité RLS (Row Level Security) complet

## Requirements

### Requirement 1

**User Story:** En tant qu'administrateur système, je veux pouvoir créer automatiquement un environnement de test complet, afin de pouvoir tester de nouvelles fonctionnalités sans risquer d'affecter la production.

#### Acceptance Criteria

1. WHEN l'administrateur lance la commande de création d'environnement de test THEN le système SHALL créer une nouvelle base de données Supabase avec le schéma complet incluant toutes les tables, triggers, fonctions et schéma d'audit
2. WHEN l'environnement de test est créé THEN le système SHALL cloner toutes les données de production en anonymisant les informations sensibles (emails, noms, téléphones)
3. WHEN le clonage est terminé THEN le système SHALL générer automatiquement les fichiers de configuration d'environnement appropriés (.env.test, .env.dev)
4. WHEN l'environnement est prêt THEN le système SHALL valider que toutes les fonctionnalités principales sont opérationnelles (auth, CRUD, audit, notifications, réservations)

### Requirement 2

**User Story:** En tant que formateur, je veux pouvoir créer un environnement de formation avec des données d'exemple réalistes, afin de pouvoir former les utilisateurs sur un système qui ressemble à la production.

#### Acceptance Criteria

1. WHEN le formateur demande un environnement de formation THEN le système SHALL créer un environnement avec des données d'exemple cohérentes incluant le système d'audit et de notifications
2. WHEN l'environnement de formation est créé THEN le système SHALL inclure des utilisateurs de test avec différents rôles (admin, manager, member)
3. WHEN les données d'exemple sont générées THEN le système SHALL créer des lofts, réservations, transactions, conversations, et tâches représentatifs avec historique d'audit
4. WHEN l'environnement est prêt THEN le système SHALL fournir un guide d'utilisation pour la formation incluant les nouvelles fonctionnalités

### Requirement 3

**User Story:** En tant que développeur, je veux pouvoir basculer facilement entre différents environnements, afin de pouvoir développer et tester efficacement.

#### Acceptance Criteria

1. WHEN le développeur exécute une commande de changement d'environnement THEN le système SHALL mettre à jour automatiquement les variables d'environnement
2. WHEN l'environnement est changé THEN le système SHALL redémarrer les services nécessaires automatiquement
3. WHEN le changement est effectué THEN le système SHALL afficher clairement quel environnement est actuellement actif
4. WHEN une erreur survient THEN le système SHALL permettre de revenir rapidement à l'environnement précédent

### Requirement 4

**User Story:** En tant qu'administrateur, je veux pouvoir synchroniser les schémas de base de données entre environnements, afin de maintenir la cohérence entre production, test et développement.

#### Acceptance Criteria

1. WHEN l'administrateur lance une synchronisation de schéma THEN le système SHALL détecter automatiquement les différences entre environnements incluant tables, triggers, fonctions, et schémas audit/conversations/réservations
2. WHEN des différences sont détectées THEN le système SHALL générer les scripts de migration appropriés en préservant l'ordre des dépendances
3. WHEN la synchronisation est appliquée THEN le système SHALL valider que le schéma cible correspond au schéma source incluant tous les systèmes (audit, notifications, réservations)
4. WHEN la synchronisation échoue THEN le système SHALL permettre un rollback automatique en restaurant l'état précédent

### Requirement 5

**User Story:** En tant qu'utilisateur du système, je veux que les données sensibles soient automatiquement anonymisées dans les environnements de test, afin de respecter la confidentialité des données de production.

#### Acceptance Criteria

1. WHEN des données sont clonées vers un environnement de test THEN le système SHALL anonymiser automatiquement les emails, noms, téléphones, et données sensibles des réservations
2. WHEN l'anonymisation est effectuée THEN le système SHALL préserver la structure et les relations des données incluant les logs d'audit et messages de conversations
3. WHEN des données financières sont clonées THEN le système SHALL appliquer des montants factices mais réalistes en préservant les références de montants pour les alertes
4. WHEN l'anonymisation est terminée THEN le système SHALL générer un rapport des transformations effectuées incluant les statistiques par table

### Requirement 6

**User Story:** En tant qu'administrateur, je veux pouvoir valider automatiquement qu'un environnement cloné fonctionne correctement, afin de m'assurer de sa fiabilité avant utilisation.

#### Acceptance Criteria

1. WHEN un environnement est créé THEN le système SHALL exécuter automatiquement une suite de tests de validation incluant les systèmes d'audit et notifications
2. WHEN les tests sont exécutés THEN le système SHALL vérifier la connectivité à la base de données et le bon fonctionnement des triggers
3. WHEN la validation continue THEN le système SHALL tester les fonctionnalités principales (authentification, CRUD, audit, notifications temps réel, réservations)
4. WHEN la validation est terminée THEN le système SHALL générer un rapport de santé de l'environnement avec métriques détaillées

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux pouvoir réinitialiser facilement un environnement de test, afin de repartir sur une base propre quand nécessaire.

#### Acceptance Criteria

1. WHEN l'utilisateur demande une réinitialisation THEN le système SHALL sauvegarder l'état actuel avant de procéder
2. WHEN la réinitialisation est lancée THEN le système SHALL restaurer l'environnement à son état initial
3. WHEN la restauration est terminée THEN le système SHALL valider que l'environnement fonctionne correctement
4. WHEN une erreur survient THEN le système SHALL permettre de restaurer la sauvegarde précédente
### R
equirement 8

**User Story:** En tant qu'administrateur, je veux pouvoir cloner spécifiquement les nouveaux systèmes (audit, conversations, réservations), afin de tester les fonctionnalités avancées dans un environnement sûr.

#### Acceptance Criteria

1. WHEN l'administrateur demande un clonage complet THEN le système SHALL inclure toutes les tables du schéma audit avec leurs logs
2. WHEN le système de conversations est cloné THEN le système SHALL préserver les relations entre conversations, participants et messages
3. WHEN le système de réservations est cloné THEN le système SHALL maintenir la cohérence entre réservations, disponibilités et tarifications
4. WHEN les triggers et fonctions sont clonés THEN le système SHALL vérifier leur bon fonctionnement dans l'environnement cible

### Requirement 9

**User Story:** En tant que développeur, je veux pouvoir tester les notifications automatiques de factures dans un environnement de test, afin de valider le système sans affecter les vraies échéances.

#### Acceptance Criteria

1. WHEN l'environnement de test est créé THEN le système SHALL inclure les fonctions de calcul d'échéances et triggers de mise à jour
2. WHEN des transactions de test sont créées THEN le système SHALL déclencher automatiquement les mises à jour d'échéances
3. WHEN les notifications sont testées THEN le système SHALL utiliser des dates et montants factices mais cohérents
4. WHEN les tests sont terminés THEN le système SHALL permettre de réinitialiser les échéances de test

### Requirement 10

**User Story:** En tant qu'administrateur, je veux pouvoir migrer les améliorations de schéma de production vers les environnements de test, afin de maintenir la cohérence entre tous les environnements.

#### Acceptance Criteria

1. WHEN une nouvelle table ou fonction est ajoutée en production THEN le système SHALL détecter automatiquement ces changements
2. WHEN des modifications de schéma sont détectées THEN le système SHALL proposer une migration vers les environnements de test
3. WHEN la migration est appliquée THEN le système SHALL préserver les données existantes dans les environnements cibles
4. WHEN la migration échoue THEN le système SHALL fournir des logs détaillés et permettre une correction manuelle