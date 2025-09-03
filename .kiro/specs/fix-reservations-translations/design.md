# Design Document - Fix Reservations Page Translations

## Overview

The reservations page translation system needs to be completely rebuilt to match the working dashboard architecture. The current implementation fails because it doesn't properly integrate with the existing i18n system.

## Root Cause Analysis

1. **Translation files structure mismatch**: The reservations.json files may not be properly structured or loaded
2. **useTranslation hook configuration**: The hook may not be configured to load the reservations namespace
3. **Key naming inconsistency**: The translation keys may not match between the component and the JSON files

## Architecture

### Translation File Structure
```
public/locales/
├── fr/
│   ├── reservations.json (French translations)
│   └── dashboard.json (working reference)
├── ar/
│   ├── reservations.json (Arabic translations)
│   └── dashboard.json (working reference)
└── en/
    ├── reservations.json (English translations)
    └── dashboard.json (working reference)
```

### Component Architecture
```
app/reservations/page.tsx
└── ReservationsWrapper (uses @/lib/i18n/context)
    └── Direct translation calls: t('reservations.key')
```

## Components and Interfaces

### ReservationsWrapper Component
- **Input**: None (gets language from context)
- **Output**: Rendered reservations page with proper translations
- **Dependencies**: @/lib/i18n/context, reservations.json files

### Translation Keys Required
```typescript
interface ReservationsTranslations {
  title: string;
  subtitle: string;
  totalReservations: string;
  monthlyRevenue: string;
  occupancyRate: string;
  guestSatisfaction: string;
  quickActions: string;
  recentActivity: string;
  newReservation: string;
  professionalTools: string;
  calendarTitle: string;
  availabilityManagement: string;
  liveView: string;
}
```

## Data Models

### Translation File Format
```json
{
  "title": "Reservations",
  "subtitle": "Manage your reservations",
  "totalReservations": "Total Reservations",
  // ... other keys
}
```

## Error Handling

1. **Missing translation keys**: Fallback to English text
2. **Missing translation files**: Component should still render with fallback text
3. **Invalid JSON**: Log error and use fallback text

## Testing Strategy

1. **Unit Tests**: Test that translation keys resolve correctly
2. **Integration Tests**: Test language switching functionality
3. **Visual Tests**: Verify no translation keys are visible in UI
4. **Cross-language Tests**: Test all three languages (fr, ar, en)

## Implementation Notes

- Must use exact same pattern as dashboard: `const { t } = useTranslation();`
- Must use exact same key format as dashboard: `t('namespace.key')`
- Must ensure translation files are properly loaded by the i18n system
- Must test in all three languages before considering complete