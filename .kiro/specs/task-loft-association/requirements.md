# Requirements Document

## Introduction

Cette fonctionnalité permet d'associer les tâches à des lofts spécifiques dans le système de gestion. Actuellement, les tâches peuvent être créées et assignées aux utilisateurs, mais il n'y a pas de moyen de les lier à un loft particulier. Cette association permettra une meilleure organisation des tâches par propriété et facilitera le suivi des travaux et maintenance par loft.

## Requirements

### Requirement 1

**User Story:** En tant qu'administrateur ou manager, je veux pouvoir associer une tâche à un loft spécifique lors de sa création, afin de pouvoir organiser les tâches par propriété.

#### Acceptance Criteria

1. WHEN je crée une nouvelle tâche THEN le système SHALL afficher un champ de sélection pour choisir un loft
2. WHEN je sélectionne un loft THEN le système SHALL enregistrer cette association avec la tâche
3. IF aucun loft n'est sélectionné THEN le système SHALL permettre de créer la tâche sans association de loft
4. WHEN je modifie une tâche existante THEN le système SHALL permettre de modifier l'association de loft

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux voir le nom du loft associé à une tâche dans la liste des tâches, afin de savoir rapidement à quelle propriété elle se rapporte.

#### Acceptance Criteria

1. WHEN j'affiche la liste des tâches THEN le système SHALL afficher le nom du loft associé pour chaque tâche qui en a un
2. WHEN une tâche n'a pas de loft associé THEN le système SHALL afficher un indicateur approprié (ex: "Aucun loft")
3. WHEN je filtre les tâches THEN le système SHALL permettre de filtrer par loft
4. WHEN j'affiche les détails d'une tâche THEN le système SHALL afficher clairement le loft associé

### Requirement 3

**User Story:** En tant qu'administrateur, je veux pouvoir filtrer les tâches par loft, afin de voir rapidement toutes les tâches liées à une propriété spécifique.

#### Acceptance Criteria

1. WHEN j'accède à la page des tâches THEN le système SHALL afficher un filtre par loft dans la section des filtres
2. WHEN je sélectionne un loft dans le filtre THEN le système SHALL afficher uniquement les tâches associées à ce loft
3. WHEN je sélectionne "Tous les lofts" THEN le système SHALL afficher toutes les tâches
4. WHEN je combine le filtre par loft avec d'autres filtres THEN le système SHALL appliquer tous les filtres simultanément

### Requirement 4

**User Story:** En tant que membre, je veux voir le loft associé aux tâches qui me sont assignées, afin de savoir où je dois intervenir.

#### Acceptance Criteria

1. WHEN je consulte mes tâches assignées THEN le système SHALL afficher le nom du loft pour chaque tâche
2. WHEN je mets à jour le statut d'une tâche THEN le système SHALL continuer d'afficher l'information du loft associé
3. WHEN une tâche n'a pas de loft associé THEN le système SHALL l'indiquer clairement
4. WHEN je consulte les détails d'une tâche THEN le système SHALL afficher toutes les informations du loft associé

### Requirement 5

**User Story:** En tant qu'administrateur, je veux que le système maintienne l'intégrité des données lors de la suppression d'un loft, afin d'éviter les références orphelines.

#### Acceptance Criteria

1. WHEN un loft est supprimé THEN le système SHALL mettre à jour toutes les tâches associées pour supprimer la référence
2. WHEN un loft est supprimé THEN le système SHALL conserver les tâches mais marquer l'association comme "Loft supprimé"
3. WHEN je consulte une tâche avec un loft supprimé THEN le système SHALL afficher un message informatif
4. WHEN je modifie une tâche avec un loft supprimé THEN le système SHALL permettre d'associer un nouveau loft