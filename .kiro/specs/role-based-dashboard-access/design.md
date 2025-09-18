# Design Document

## Overview

Ce document décrit la conception d'un système de contrôle d'accès basé sur les rôles pour le dashboard de l'application. L'objectif principal est de restreindre l'accès aux données selon le rôle de l'utilisateur, en particulier pour les utilisateurs "member" qui ne doivent voir que leurs tâches et notifications.

Le système actuel montre déjà une séparation partielle avec `MemberDashboard` pour les membres, mais il faut renforcer cette séparation et créer un système de contrôle d'accès plus robuste et réutilisable.

## Architecture

### Composants Principaux

1. **RoleBasedAccess Component** - Composant wrapper pour contrôler l'accès basé sur les rôles
2. **Permission System** - Système centralisé de gestion des permissions
3. **Dashboard Router** - Routeur intelligent qui dirige vers le bon dashboard selon le rôle
4. **Protected Routes** - Middleware pour protéger les routes sensibles

### Structure des Rôles et Permissions

```typescript
type UserRole = 'admin' | 'member' | 'guest' | 'manager' | 'executive'

interface Permission {
  resource: string
  action: 'read' | 'write' | 'delete' | 'create'
  scope?: 'own' | 'team' | 'all'
}

interface RolePermissions {
  [role: string]: Permission[]
}
```

### Matrice des Permissions

| Ressource | Admin | Manager | Executive | Member | Guest |
|-----------|-------|---------|-----------|--------|-------|
| Dashboard - Données financières | ✅ | ✅ | ✅ | ❌ | ❌ |
| Dashboard - Statistiques globales | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tâches - Toutes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tâches - Assignées | ✅ | ✅ | ✅ | ✅ | ❌ |
| Notifications - Toutes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Notifications - Personnelles | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lofts - Données financières | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lofts - Informations opérationnelles | ✅ | ✅ | ✅ | ✅ (limité) | ❌ |

## Components and Interfaces

### 1. RoleBasedAccess Component

```typescript
interface RoleBasedAccessProps {
  allowedRoles: UserRole[]
  userRole: UserRole
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleBasedAccess({
  allowedRoles,
  userRole,
  fallback,
  children
}: RoleBasedAccessProps)
```

### 2. Permission Hook

```typescript
interface UsePermissionsReturn {
  hasPermission: (resource: string, action: string, scope?: string) => boolean
  canAccess: (component: string) => boolean
  filterData: <T>(data: T[], filterFn: (item: T) => boolean) => T[]
}

export function usePermissions(userRole: UserRole): UsePermissionsReturn
```

### 3. Dashboard Components Refactoring

```typescript
// Nouveau composant principal
interface SmartDashboardProps {
  user: User
  data: DashboardData
}

export function SmartDashboard({ user, data }: SmartDashboardProps)

// Composants spécialisés par rôle
export function AdminDashboard(props: AdminDashboardProps)
export function ManagerDashboard(props: ManagerDashboardProps)
export function ExecutiveDashboard(props: ExecutiveDashboardProps)
export function MemberDashboard(props: MemberDashboardProps) // Existant, à améliorer
```

### 4. Data Filtering Service

```typescript
interface DataFilterService {
  filterTasks(tasks: Task[], userRole: UserRole, userId: string): Task[]
  filterNotifications(notifications: Notification[], userRole: UserRole, userId: string): Notification[]
  filterLofts(lofts: Loft[], userRole: UserRole, userId: string): Partial<Loft>[]
  filterFinancialData(data: FinancialData, userRole: UserRole): Partial<FinancialData> | null
}
```

## Data Models

### Permission Configuration

```typescript
const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    { resource: '*', action: '*', scope: 'all' }
  ],
  manager: [
    { resource: 'dashboard', action: 'read', scope: 'all' },
    { resource: 'tasks', action: '*', scope: 'all' },
    { resource: 'lofts', action: 'read', scope: 'all' },
    { resource: 'financial', action: 'read', scope: 'all' }
  ],
  executive: [
    { resource: 'dashboard', action: 'read', scope: 'all' },
    { resource: 'reports', action: 'read', scope: 'all' },
    { resource: 'financial', action: 'read', scope: 'all' }
  ],
  member: [
    { resource: 'tasks', action: 'read', scope: 'own' },
    { resource: 'tasks', action: 'write', scope: 'own' },
    { resource: 'notifications', action: 'read', scope: 'own' },
    { resource: 'lofts', action: 'read', scope: 'assigned' }
  ],
  guest: [
    { resource: 'public', action: 'read', scope: 'all' }
  ]
}
```

### Filtered Data Types

```typescript
interface MemberLoftView {
  id: string
  name: string
  address: string
  status: LoftStatus
  // Pas de données financières
}

interface MemberTaskView extends Task {
  loft?: MemberLoftView
}

interface MemberDashboardData {
  tasks: MemberTaskView[]
  notifications: Notification[]
  stats: {
    todoTasks: number
    inProgressTasks: number
    completedTasks: number
    overdueTasks: number
  }
}
```

## Error Handling

### Access Denied Scenarios

1. **Unauthorized Route Access**
   - Redirection vers `/unauthorized`
   - Message d'erreur approprié selon le contexte

2. **Insufficient Permissions**
   - Affichage d'un composant de fallback
   - Log de l'tentative d'accès non autorisé

3. **Data Filtering Errors**
   - Fallback vers des données vides
   - Notification à l'utilisateur si nécessaire

### Error Components

```typescript
export function UnauthorizedAccess({ 
  message?: string,
  redirectPath?: string 
}: UnauthorizedAccessProps)

export function InsufficientPermissions({ 
  requiredRole: UserRole,
  currentRole: UserRole 
}: InsufficientPermissionsProps)
```

## Testing Strategy

### Unit Tests

1. **Permission System Tests**
   - Test de chaque combinaison rôle/permission
   - Test des cas limites et erreurs

2. **Component Access Tests**
   - Test d'affichage conditionnel selon les rôles
   - Test des composants de fallback

3. **Data Filtering Tests**
   - Test de filtrage des données selon les rôles
   - Test de sécurité (pas de fuite de données)

### Integration Tests

1. **Dashboard Flow Tests**
   - Test complet du flux utilisateur selon le rôle
   - Test de navigation entre les sections

2. **API Security Tests**
   - Test que les APIs respectent les permissions
   - Test de tentatives d'accès non autorisé

### E2E Tests

1. **Role-based User Journeys**
   - Parcours utilisateur complet pour chaque rôle
   - Test des transitions entre rôles

2. **Security Scenarios**
   - Test de tentatives de contournement des permissions
   - Test de manipulation des données côté client

## Implementation Plan

### Phase 1: Core Permission System
- Création du système de permissions centralisé
- Implémentation du hook `usePermissions`
- Tests unitaires du système de permissions

### Phase 2: Component Protection
- Création du composant `RoleBasedAccess`
- Refactoring des composants existants
- Implémentation des composants d'erreur

### Phase 3: Dashboard Refactoring
- Création du `SmartDashboard`
- Amélioration du `MemberDashboard` existant
- Implémentation du filtrage de données

### Phase 4: Route Protection
- Mise en place du middleware de protection
- Sécurisation des APIs
- Tests d'intégration

### Phase 5: Testing & Optimization
- Tests E2E complets
- Optimisation des performances
- Documentation utilisateur