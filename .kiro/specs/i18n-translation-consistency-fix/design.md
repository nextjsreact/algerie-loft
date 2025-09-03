# Design Document

## Overview

Ce document décrit la solution pour résoudre définitivement les problèmes de traduction incohérents dans l'application. La solution comprend la standardisation des namespaces, la correction des clés manquantes, et l'implémentation d'un système de validation automatique.

## Architecture

### Problèmes Identifiés

1. **Namespace Inconsistency**: Les composants utilisent différents namespaces (`reservations`, `availability`, root level)
2. **Missing Keys**: Certaines clés existent dans les composants mais pas dans les fichiers de traduction
3. **Mixed Translation Patterns**: Mélange entre `useTranslations('namespace')` et accès direct aux clés

### Solution Architecture

```
Translation System
├── Standardized Namespaces
│   ├── reservations.*
│   ├── availability.*
│   └── common.*
├── Validation Layer
│   ├── Build-time validation
│   └── Runtime fallbacks
└── Consistency Tools
    ├── Translation key scanner
    └── Missing key reporter
```

## Components and Interfaces

### 1. Translation Namespace Standardization

**Current Issues:**
- `ReservationCalendar` uses `useTranslations('reservations')` but accesses `calendar.*` keys
- `AvailabilityManager` mixes `reservations` and `availability` namespaces
- Root level keys like `reportsLabel` are accessed without proper namespace

**Solution:**
- Standardize all reservation-related translations under `reservations.*`
- Move calendar translations to `reservations.calendar.*`
- Create consistent namespace mapping

### 2. Missing Translation Keys

**Identified Missing Keys:**
- `reservations.calendar.month` (exists in file but not loading properly)
- `reservations.calendar.week` (exists in file but not loading properly)  
- `reservations.calendar.day` (exists in file but not loading properly)
- `reservations.reportsLabel` (exists as root level, needs namespace)

### 3. Component Translation Patterns

**ReservationCalendar Component:**
```typescript
// Current (problematic)
const t = useTranslations('reservations');
{t('calendar.month')} // Looking for reservations.calendar.month

// Solution: Ensure proper namespace structure in translation files
```

**AvailabilityManager Component:**
```typescript
// Current (working)
const t = useTranslations('reservations');
const tAvailability = useTranslations('availability');

// Keep this pattern but ensure consistency
```

## Data Models

### Translation File Structure

```json
{
  "reservations": {
    "title": "Réservations",
    "calendar": {
      "title": "Calendrier des réservations",
      "month": "Mois",
      "week": "Semaine", 
      "day": "Jour",
      "agenda": "Agenda"
    },
    "availability": {
      "management": "Gestion des disponibilités",
      "blockDates": "Bloquer les dates",
      "minimumStay": "Séjour minimum"
    },
    "actions": {
      "new": "Nouveau",
      "guests": "Invités", 
      "reportsLabel": "Rapports"
    }
  }
}
```

## Error Handling

### 1. Runtime Fallbacks

```typescript
// Safe translation component
function SafeTranslation({ keyPath, fallback, namespace = 'reservations' }) {
  const t = useTranslations(namespace);
  try {
    return t(keyPath);
  } catch (error) {
    console.warn(`Missing translation: ${namespace}.${keyPath}`);
    return fallback || keyPath;
  }
}
```

### 2. Build-time Validation

- Script to scan all `useTranslations` calls
- Validate that all referenced keys exist in translation files
- Generate report of missing translations
- Fail build if critical translations are missing

## Testing Strategy

### 1. Translation Coverage Tests

```typescript
describe('Translation Coverage', () => {
  it('should have all required reservation translations', () => {
    const requiredKeys = [
      'reservations.calendar.month',
      'reservations.calendar.week', 
      'reservations.calendar.day',
      'reservations.actions.reportsLabel'
    ];
    
    requiredKeys.forEach(key => {
      expect(translations.fr).toHaveProperty(key);
    });
  });
});
```

### 2. Component Translation Tests

```typescript
describe('ReservationCalendar', () => {
  it('should display translated calendar controls', () => {
    render(<ReservationCalendar />);
    expect(screen.getByText('Mois')).toBeInTheDocument();
    expect(screen.getByText('Semaine')).toBeInTheDocument();
    expect(screen.getByText('Jour')).toBeInTheDocument();
  });
});
```

### 3. Integration Tests

- Test full page rendering with all translations
- Verify no raw translation keys are displayed
- Test locale switching functionality

## Implementation Plan

### Phase 1: Fix Immediate Issues
1. Move `reportsLabel` to proper namespace
2. Verify calendar translations are properly nested
3. Test all affected components

### Phase 2: Standardization  
1. Audit all translation usage patterns
2. Standardize namespace conventions
3. Update component imports accordingly

### Phase 3: Validation System
1. Create translation validation script
2. Integrate into build process
3. Add runtime fallback system

### Phase 4: Testing & Documentation
1. Add comprehensive translation tests
2. Document translation conventions
3. Create developer guidelines