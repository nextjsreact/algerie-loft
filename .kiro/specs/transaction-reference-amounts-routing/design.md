# Design Document

## Overview

This design addresses the routing conflict where `/transactions/reference-amounts` is being incorrectly processed as a transaction detail page with ID "reference-amounts". The solution involves implementing proper route precedence and UUID validation to ensure static routes are matched before dynamic routes, while maintaining backward compatibility with existing transaction functionality.

## Architecture

### Current Routing Structure
```
app/[locale]/transactions/
├── page.tsx                    # Transactions list
├── new/
│   └── page.tsx               # Create new transaction
└── [id]/
    ├── page.tsx               # Transaction detail (expects UUID)
    └── edit/
        └── page.tsx           # Edit transaction
```

### Proposed Routing Structure
```
app/[locale]/transactions/
├── page.tsx                    # Transactions list
├── new/
│   └── page.tsx               # Create new transaction
├── reference-amounts/
│   └── page.tsx               # Reference amounts management (NEW)
└── [id]/
    ├── page.tsx               # Transaction detail (with UUID validation)
    └── edit/
        └── page.tsx           # Edit transaction
```

## Components and Interfaces

### 1. Reference Amounts Page Component
**Location:** `app/[locale]/transactions/reference-amounts/page.tsx`

**Purpose:** Dedicated page for managing transaction reference amounts

**Key Features:**
- Server-side authentication check
- Integration with existing `TransactionReferenceAmounts` component
- Proper internationalization support
- Breadcrumb navigation

### 2. Enhanced Transaction Detail Page
**Location:** `app/[locale]/transactions/[id]/page.tsx` (modified)

**Enhancements:**
- UUID validation before database query
- Proper error handling for invalid UUIDs
- User-friendly error messages
- Improved error logging

### 3. UUID Validation Utility
**Location:** `lib/utils/validation.ts` (new)

**Purpose:** Centralized UUID validation logic

**Functions:**
- `isValidUUID(id: string): boolean`
- `validateTransactionId(id: string): { isValid: boolean; error?: string }`

## Data Models

### Existing Models (No Changes Required)
- `Transaction` interface remains unchanged
- `TransactionReference` interface already exists
- Database schema already supports reference amounts functionality

### Route Parameters
```typescript
interface TransactionDetailParams {
  id: string; // Must be valid UUID format
}

interface LocaleParams {
  locale: string; // Supported locale (en, fr, ar)
}
```

## Error Handling

### UUID Validation Errors
1. **Invalid UUID Format**
   - Return 404 page with user-friendly message
   - Log error details for debugging
   - Provide navigation back to transactions list

2. **Valid UUID but Non-existent Transaction**
   - Return "Transaction not found" message
   - Maintain existing `notFound()` behavior
   - Provide search/filter options

3. **Database Connection Errors**
   - Return generic error page
   - Log detailed error information
   - Provide retry mechanism

### Route Resolution Errors
1. **Static Route Priority**
   - Ensure `/reference-amounts` matches before `[id]` route
   - Next.js handles this automatically with proper file structure

2. **Locale Handling**
   - Validate locale parameter
   - Fallback to default locale if invalid
   - Maintain consistent URL structure

## Implementation Strategy

### Phase 1: Create Static Route
1. Create `app/[locale]/transactions/reference-amounts/page.tsx`
2. Move existing component logic to new page
3. Add proper authentication and internationalization
4. Test route resolution priority

### Phase 2: Enhance Dynamic Route
1. Add UUID validation to `[id]/page.tsx`
2. Implement proper error handling
3. Create validation utilities
4. Add comprehensive error logging

### Phase 3: Navigation Updates
1. Update navigation links to use correct routes
2. Add breadcrumb navigation
3. Ensure consistent user experience
4. Test all navigation paths

## Security Considerations

### Authentication
- Reference amounts page requires admin/manager role
- Transaction detail page maintains existing role requirements
- Proper session validation on all routes

### Input Validation
- UUID format validation prevents injection attacks
- Sanitize all route parameters
- Validate locale parameters against allowed values

### Error Information Disclosure
- Hide database error details from users
- Log sensitive information server-side only
- Provide generic error messages for security

## Performance Considerations

### Route Resolution
- Static routes resolve faster than dynamic routes
- Proper file structure ensures optimal Next.js routing
- No performance impact on existing functionality

### Database Queries
- UUID validation prevents unnecessary database calls
- Early validation reduces server load
- Maintain existing query optimization

### Caching Strategy
- Static route can be cached more aggressively
- Dynamic routes maintain existing caching behavior
- Consider implementing route-level caching

## Testing Strategy

### Unit Tests
- UUID validation utility functions
- Route parameter validation
- Error handling logic

### Integration Tests
- Route resolution priority
- Authentication flow
- Navigation between pages

### End-to-End Tests
- Complete user workflows
- Error scenarios
- Cross-browser compatibility

## Migration Plan

### Backward Compatibility
- Existing transaction URLs remain functional
- No breaking changes to API endpoints
- Maintain existing component interfaces

### Deployment Strategy
1. Deploy new static route first
2. Update navigation links
3. Deploy enhanced validation
4. Monitor for routing issues

### Rollback Plan
- Keep existing components as backup
- Feature flags for new routing logic
- Quick rollback capability if issues arise

## Monitoring and Logging

### Error Tracking
- Log UUID validation failures
- Track routing resolution issues
- Monitor 404 error rates

### Performance Metrics
- Route resolution times
- Database query performance
- User navigation patterns

### User Experience Metrics
- Error page bounce rates
- Navigation success rates
- Feature adoption metrics