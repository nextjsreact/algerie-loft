# Design Document - Association des Tâches aux Lofts

## Overview

Cette fonctionnalité étend le système de tâches existant pour permettre l'association des tâches à des lofts spécifiques. L'implémentation se base sur l'infrastructure existante et ajoute une relation optionnelle entre les tâches et les lofts, avec les interfaces utilisateur correspondantes pour la gestion et l'affichage de cette association.

## Architecture

### Database Schema Changes

La table `tasks` existante sera étendue avec une nouvelle colonne `loft_id` pour créer la relation avec la table `lofts`.

```sql
-- Ajout de la colonne loft_id à la table tasks
ALTER TABLE tasks ADD COLUMN loft_id UUID REFERENCES lofts(id) ON DELETE SET NULL;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_tasks_loft_id ON tasks(loft_id) WHERE loft_id IS NOT NULL;
```

### Data Model Updates

Le type TypeScript `Task` sera mis à jour pour inclure la nouvelle propriété :

```typescript
export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  user_id: string;
  created_at: string;
  due_date?: string | null;
  assigned_to?: string | null;
  loft_id?: string | null;  // Nouvelle propriété
};

// Nouveau type pour les tâches avec informations du loft
export interface TaskWithLoft extends Task {
  loft_name?: string | null;
  loft_address?: string | null;
}
```

## Components and Interfaces

### 1. Task Form Component Updates

Le composant `TaskForm` sera modifié pour inclure un sélecteur de loft :

- **Nouveau champ** : Sélecteur de loft avec recherche/filtrage
- **Validation** : Le loft est optionnel, pas de validation requise
- **Permissions** : Seuls les admins et managers peuvent modifier l'association
- **Interface** : Dropdown avec nom du loft et adresse pour faciliter l'identification

### 2. Tasks List Component Updates

Le composant `ModernTasksPage` sera étendu avec :

- **Affichage du loft** : Nom du loft dans chaque carte de tâche
- **Filtre par loft** : Nouveau filtre dans la section des filtres existants
- **Indicateur visuel** : Badge ou icône pour les tâches sans loft associé
- **Tri** : Possibilité de trier par loft

### 3. Task Details Component

Création ou mise à jour du composant de détails de tâche :

- **Section loft** : Affichage complet des informations du loft associé
- **Lien vers le loft** : Navigation vers la page de détails du loft
- **Gestion des lofts supprimés** : Affichage approprié pour les références orphelines

## Data Models

### Database Queries

Nouvelles requêtes nécessaires :

```sql
-- Récupérer les tâches avec informations du loft
SELECT 
  t.*,
  l.name as loft_name,
  l.address as loft_address
FROM tasks t
LEFT JOIN lofts l ON t.loft_id = l.id
WHERE t.user_id = $1;

-- Filtrer les tâches par loft
SELECT t.* FROM tasks t
WHERE t.loft_id = $1
ORDER BY t.created_at DESC;

-- Statistiques des tâches par loft
SELECT 
  l.name,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
FROM lofts l
LEFT JOIN tasks t ON l.id = t.loft_id
GROUP BY l.id, l.name;
```

### API Endpoints Updates

Mise à jour des endpoints existants :

- **GET /api/tasks** : Inclure les informations du loft dans la réponse
- **POST /api/tasks** : Accepter le `loft_id` dans le payload
- **PUT /api/tasks/:id** : Permettre la modification du `loft_id`
- **GET /api/lofts** : Nouveau endpoint pour le sélecteur de loft dans le formulaire

## Error Handling

### Gestion des Références Orphelines

Quand un loft est supprimé :

1. **Soft Delete** : Les tâches conservent la référence mais affichent "Loft supprimé"
2. **Notification** : Alerte aux administrateurs des tâches affectées
3. **Migration** : Possibilité de réassigner les tâches à un autre loft

### Validation des Données

- **Loft existant** : Vérification que le loft_id existe avant l'association
- **Permissions** : Vérification des droits d'accès au loft sélectionné
- **Intégrité** : Contraintes de base de données pour maintenir la cohérence

## Testing Strategy

### Unit Tests

1. **Validation Schema** : Tests pour le nouveau champ loft_id
2. **Database Queries** : Tests des requêtes avec jointures
3. **Component Logic** : Tests des nouveaux filtres et affichages

### Integration Tests

1. **Task Creation** : Création de tâche avec et sans loft
2. **Task Updates** : Modification de l'association loft
3. **Filtering** : Tests des filtres combinés
4. **Data Integrity** : Tests de suppression de loft avec tâches associées

### User Acceptance Tests

1. **Workflow complet** : Création, modification, consultation des tâches avec lofts
2. **Permissions** : Vérification des restrictions par rôle
3. **Performance** : Tests avec un grand nombre de tâches et lofts
4. **Responsive Design** : Tests sur différentes tailles d'écran

## Performance Considerations

### Database Optimization

- **Index** : Index sur `loft_id` pour les requêtes de filtrage
- **Lazy Loading** : Chargement des informations loft uniquement quand nécessaire
- **Caching** : Cache des lofts fréquemment utilisés

### Frontend Optimization

- **Pagination** : Maintien de la pagination existante avec les nouveaux filtres
- **Debouncing** : Recherche de loft avec délai pour éviter les requêtes excessives
- **Memoization** : Cache des résultats de filtrage côté client

## Security Considerations

### Access Control

- **RLS Policies** : Mise à jour des politiques de sécurité pour inclure les lofts
- **Role-based Access** : Vérification des permissions sur les lofts associés
- **Data Isolation** : Assurer que les utilisateurs ne voient que leurs tâches autorisées

### Data Validation

- **Input Sanitization** : Validation côté serveur du loft_id
- **SQL Injection Prevention** : Utilisation de requêtes paramétrées
- **CSRF Protection** : Maintien de la protection existante

## Migration Strategy

### Database Migration

```sql
-- Migration script
BEGIN;

-- Ajout de la colonne
ALTER TABLE tasks ADD COLUMN loft_id UUID;

-- Ajout de la contrainte de clé étrangère
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_loft_id 
  FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE SET NULL;

-- Création de l'index
CREATE INDEX idx_tasks_loft_id ON tasks(loft_id) WHERE loft_id IS NOT NULL;

COMMIT;
```

### Code Migration

1. **Types Update** : Mise à jour des types TypeScript
2. **Component Updates** : Modification progressive des composants
3. **API Updates** : Extension des endpoints existants
4. **Testing** : Tests de régression pour s'assurer que les fonctionnalités existantes fonctionnent

## Rollback Plan

En cas de problème :

1. **Database Rollback** : Script pour supprimer la colonne loft_id
2. **Code Rollback** : Retour aux versions précédentes des composants
3. **Data Backup** : Sauvegarde avant migration pour restauration rapide