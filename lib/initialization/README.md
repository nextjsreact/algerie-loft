# Database Initialization System

This module provides automatic database seeding functionality to ensure data consistency between search results and reservation capabilities in the Loft Algerie application.

## Overview

The database initialization system solves the foreign key constraint issue where test loft data is displayed to users but cannot be used for actual reservations. It automatically populates the database with test loft data when the lofts table is empty.

## Components

### 1. Database Seeder Service (`database-seeder.ts`)
- Core seeding logic with environment detection
- Configurable logging and error handling
- Metadata tracking for seeding operations

### 2. Server-side Initialization (`server-database-init.ts`)
- Server-side initialization utilities
- API route middleware for ensuring database readiness
- Database status checking functions

### 3. Client-side Provider (`database-initializer.tsx`)
- React provider for client-side initialization
- Hooks for accessing initialization status
- Development debug components

### 4. API Routes (`/api/database/init`)
- Manual database initialization endpoint
- Status checking and metadata management
- Development and debugging utilities

## Usage

### Automatic Initialization

The system automatically initializes on application startup:

```typescript
// Server-side (instrumentation.ts)
import { initializeServerDatabase } from '@/lib/initialization/server-database-init';

const result = await initializeServerDatabase();
```

```tsx
// Client-side (layout.tsx)
import { DatabaseInitializer } from '@/components/providers/database-initializer';

<DatabaseInitializer enableSeeding={process.env.NODE_ENV !== 'production'}>
  {children}
</DatabaseInitializer>
```

### Manual Initialization

```typescript
// In API routes
import { ensureDatabaseReady } from '@/lib/initialization/server-database-init';

export async function GET() {
  await ensureDatabaseReady();
  // ... rest of API logic
}
```

### Development Utilities

```tsx
// Debug panel for development
import { DatabaseDebugPanel } from '@/components/debug/DatabaseDebugPanel';

<DatabaseDebugPanel />
```

## Configuration

### Environment Detection
- **Development/Test**: Automatic seeding enabled
- **Production**: Manual seeding only (with explicit flag)

### Seeder Configuration
```typescript
interface SeederConfig {
  environment: 'development' | 'test' | 'production';
  forceReseed: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

## API Endpoints

### GET `/api/database/init`
Returns current database initialization status.

### POST `/api/database/init`
Manually trigger database initialization (requires authentication).

```json
{
  "forceReseed": false,
  "logLevel": "info",
  "useServiceRole": false
}
```

### DELETE `/api/database/init`
Clear seeding metadata (development only).

## Test Data

The system uses centralized test loft data from `lib/data/test-lofts.ts`:

- 5 predefined test lofts with consistent IDs
- Comprehensive loft information (pricing, amenities, etc.)
- Filtering and search capabilities
- Database-ready format for seeding

## Error Handling

- Graceful degradation if seeding fails
- Detailed logging for debugging
- Non-blocking initialization (app continues if seeding fails)
- User-friendly error messages in development

## Development Features

- Real-time initialization status
- Manual seeding controls
- Force reseed capability
- Detailed logging and metrics
- Debug panel for monitoring

## Requirements Addressed

This implementation addresses the following requirements from the specification:

- **1.1**: Consistent test data between search and reservation
- **1.3**: Automatic database seeding when empty
- **1.6**: Environment-specific seeding behavior
- **2.1**: Loft existence validation before reservation
- **2.5**: Clear error messages for users

## Integration Points

The database initialization system integrates with:

- Application startup (instrumentation.ts)
- API routes (lofts, reservations)
- Client-side providers (layout.tsx)
- Development tools (debug panel)
- Test data management (shared test store)

This ensures that the reservation system works consistently across all environments while maintaining data integrity and providing a smooth user experience.