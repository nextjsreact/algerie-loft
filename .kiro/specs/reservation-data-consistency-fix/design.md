# Design Document

## Overview

This design addresses the reservation system data consistency issue by implementing a centralized test data management system and automatic database seeding. The solution ensures that all lofts displayed in search results can be successfully used for reservations, eliminating foreign key constraint violations while maintaining clean separation between test and production environments.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Search API    │    │ Reservation API │    │  Database       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Loft        │ │    │ │ Reservation │ │    │ │ lofts       │ │
│ │ Repository  │ │◄───┤ │ Repository  │ │◄───┤ │ table       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│        │        │    │        │        │    │ ┌─────────────┐ │
│        ▼        │    │        ▼        │    │ │ reservations│ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ │ table       │ │
│ │ Test Data   │ │    │ │ Validation  │ │    │ └─────────────┘ │
│ │ Handler     │ │    │ │ Service     │ │    └─────────────────┘
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                    │
         ┌─────────────────┐
         │ Database Seeder │
         │                 │
         │ ┌─────────────┐ │
         │ │ Shared Test │ │
         │ │ Data Store  │ │
         │ └─────────────┘ │
         └─────────────────┘
```

### Component Interactions

1. **Database Seeder** checks if lofts table is empty on application startup
2. **Shared Test Data Store** provides consistent test data across all components
3. **Loft Repository** queries database first, falls back to test data if needed
4. **Reservation Repository** validates loft existence before creating reservations
5. **Validation Service** ensures data consistency across operations

## Components and Interfaces

### 1. Shared Test Data Store

**Purpose:** Centralized source of truth for test loft data

**Location:** `lib/data/test-lofts.ts`

```typescript
export interface TestLoft {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  cleaning_fee: number;
  tax_rate: number;
  status: 'available' | 'unavailable' | 'maintenance';
  is_published: boolean;
  average_rating: number;
  review_count: number;
  created_at?: string;
  updated_at?: string;
}

export const TEST_LOFTS: TestLoft[] = [
  // Centralized test data definitions
];

export function getTestLoftById(id: string): TestLoft | null;
export function getAllTestLofts(): TestLoft[];
export function getTestLoftsForSeeding(): Omit<TestLoft, 'created_at' | 'updated_at'>[];
```

### 2. Database Seeder Service

**Purpose:** Automatically populate database with test data when empty

**Location:** `lib/services/database-seeder.ts`

```typescript
export interface SeederConfig {
  environment: 'development' | 'test' | 'production';
  forceReseed: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class DatabaseSeeder {
  constructor(private supabase: SupabaseClient, private config: SeederConfig);
  
  async seedLoftsIfEmpty(): Promise<{
    seeded: boolean;
    count: number;
    errors: string[];
  }>;
  
  async checkLoftsTableEmpty(): Promise<boolean>;
  async insertTestLofts(): Promise<void>;
  private logOperation(message: string, level: string): void;
}

// Auto-initialization hook
export async function initializeDatabaseSeeding(): Promise<void>;
```

### 3. Enhanced Loft Repository

**Purpose:** Unified data access with automatic fallback to test data

**Location:** `lib/repositories/loft-repository.ts`

```typescript
export interface LoftSearchOptions {
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export class LoftRepository {
  constructor(private supabase: SupabaseClient);
  
  async searchLofts(options: LoftSearchOptions): Promise<{
    lofts: ClientLoftView[];
    total: number;
    source: 'database' | 'test_data';
  }>;
  
  async getLoftById(id: string): Promise<{
    loft: TestLoft | null;
    source: 'database' | 'test_data';
  }>;
  
  async verifyLoftExists(id: string): Promise<boolean>;
  private async getDatabaseLofts(options: LoftSearchOptions): Promise<any[]>;
  private getTestDataLofts(options: LoftSearchOptions): TestLoft[];
}
```

### 4. Enhanced Reservation Repository

**Purpose:** Robust reservation creation with proper validation

**Location:** `lib/repositories/reservation-repository.ts`

```typescript
export interface ReservationData {
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_info: GuestInfo;
  guests: number;
  special_requests?: string;
  terms_accepted: boolean;
}

export interface ReservationValidationResult {
  valid: boolean;
  errors: string[];
  loft?: TestLoft;
  pricing?: PricingBreakdown;
}

export class ReservationRepository {
  constructor(
    private supabase: SupabaseClient,
    private loftRepository: LoftRepository
  );
  
  async validateReservationData(data: ReservationData): Promise<ReservationValidationResult>;
  async createReservation(data: ReservationData): Promise<{
    success: boolean;
    reservation?: any;
    errors: string[];
  }>;
  
  private async calculatePricing(loft: TestLoft, checkIn: string, checkOut: string): Promise<PricingBreakdown>;
  private formatReservationForDatabase(data: ReservationData, loft: TestLoft, pricing: PricingBreakdown): any;
}
```

### 5. Validation Service

**Purpose:** Cross-cutting validation logic for data consistency

**Location:** `lib/services/validation-service.ts`

```typescript
export interface ValidationRule<T> {
  field: keyof T;
  required: boolean;
  validator: (value: any) => boolean;
  message: string;
}

export class ValidationService {
  static validateLoftId(id: string): boolean;
  static validateDateRange(checkIn: string, checkOut: string): { valid: boolean; error?: string };
  static validateGuestCount(guests: number, maxGuests: number): boolean;
  static validateGuestInfo(guestInfo: GuestInfo): { valid: boolean; errors: string[] };
  
  static async validateReservationConsistency(
    loftId: string,
    loftRepository: LoftRepository
  ): Promise<{ valid: boolean; error?: string }>;
}
```

## Data Models

### Enhanced Loft Data Model

```typescript
// Unified interface for both database and test lofts
export interface UnifiedLoft {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  cleaning_fee: number;
  tax_rate: number;
  status: 'available' | 'unavailable' | 'maintenance';
  is_published: boolean;
  average_rating: number;
  review_count: number;
  // Metadata
  source: 'database' | 'test_data';
  created_at: string;
  updated_at: string;
}
```

### Reservation Data Model

```typescript
export interface ReservationRecord {
  id: string;
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_nationality: string;
  guest_count: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_amount: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
}
```

### Pricing Calculation Model

```typescript
export interface PricingBreakdown {
  nights: number;
  nightly_rate: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  service_fee_rate: number;
  taxes: number;
  tax_rate: number;
  total_amount: number;
  currency: string;
}
```

## Error Handling

### Error Classification

1. **Validation Errors** - User input issues
2. **Data Consistency Errors** - Loft/reservation mismatches
3. **Database Errors** - Connection or constraint issues
4. **Business Logic Errors** - Availability or pricing issues

### Error Response Format

```typescript
export interface APIError {
  error: string;
  code: string;
  details?: string;
  field?: string;
  suggestions?: string[];
  timestamp: string;
}

// Error codes
export enum ErrorCodes {
  LOFT_NOT_FOUND = 'LOFT_NOT_FOUND',
  LOFT_UNAVAILABLE = 'LOFT_UNAVAILABLE',
  INVALID_DATES = 'INVALID_DATES',
  GUEST_COUNT_EXCEEDED = 'GUEST_COUNT_EXCEEDED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION'
}
```

### Error Handling Strategy

```typescript
export class ErrorHandler {
  static handleDatabaseError(error: any): APIError;
  static handleValidationError(errors: string[]): APIError;
  static handleLoftNotFound(loftId: string): APIError;
  static handleForeignKeyViolation(constraint: string): APIError;
  
  static translateTechnicalError(error: any): APIError;
  static addUserFriendlySuggestions(error: APIError): APIError;
}
```

## Testing Strategy

### Unit Tests

1. **Test Data Store Tests**
   - Verify data consistency across functions
   - Test data filtering and sorting
   - Validate data structure compliance

2. **Database Seeder Tests**
   - Test seeding logic with empty database
   - Verify no duplicate seeding
   - Test environment-specific behavior

3. **Repository Tests**
   - Test fallback mechanisms
   - Verify data source detection
   - Test validation logic

### Integration Tests

1. **End-to-End Reservation Flow**
   - Search lofts → Select loft → Create reservation
   - Test with both database and test data
   - Verify error handling paths

2. **Database Consistency Tests**
   - Test foreign key relationships
   - Verify data integrity constraints
   - Test concurrent reservation attempts

### Test Data Management

```typescript
// Test utilities
export class TestDataManager {
  static async setupTestDatabase(): Promise<void>;
  static async cleanupTestDatabase(): Promise<void>;
  static async seedTestLofts(): Promise<string[]>; // Returns loft IDs
  static async createTestReservation(loftId: string): Promise<string>;
}
```

## Performance Considerations

### Database Optimization

1. **Indexing Strategy**
   - Index on loft_id in reservations table
   - Composite index on (status, is_published) in lofts table
   - Index on check_in_date and check_out_date for availability queries

2. **Query Optimization**
   - Use single query for loft existence check
   - Batch operations for seeding
   - Implement query result caching for test data

### Caching Strategy

```typescript
export class LoftCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static TTL = 5 * 60 * 1000; // 5 minutes
  
  static get(key: string): any | null;
  static set(key: string, data: any): void;
  static invalidate(key?: string): void;
  static isExpired(timestamp: number): boolean;
}
```

### Monitoring and Metrics

```typescript
export interface ReservationMetrics {
  total_searches: number;
  successful_reservations: number;
  failed_reservations: number;
  test_data_usage_rate: number;
  database_seeding_frequency: number;
  average_response_time: number;
}

export class MetricsCollector {
  static recordSearch(source: 'database' | 'test_data'): void;
  static recordReservationAttempt(success: boolean, errorCode?: string): void;
  static recordDatabaseSeeding(count: number, duration: number): void;
}
```

## Security Considerations

### Data Validation

1. **Input Sanitization**
   - Validate all user inputs before database operations
   - Sanitize special requests and guest information
   - Prevent SQL injection through parameterized queries

2. **Business Logic Validation**
   - Verify loft availability before reservation creation
   - Validate guest count against loft capacity
   - Ensure date ranges are logical and future-dated

### Environment Security

```typescript
export class EnvironmentGuard {
  static isProductionEnvironment(): boolean;
  static shouldAllowTestDataSeeding(): boolean;
  static validateEnvironmentConfiguration(): { valid: boolean; issues: string[] };
}
```

## Deployment Strategy

### Database Migration

```sql
-- Migration: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_loft_id ON reservations(loft_id);
CREATE INDEX IF NOT EXISTS idx_lofts_status_published ON lofts(status, is_published);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);

-- Migration: Add seeding metadata table
CREATE TABLE IF NOT EXISTS seeding_metadata (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  seeded_at TIMESTAMP DEFAULT NOW(),
  record_count INTEGER NOT NULL,
  environment VARCHAR(20) NOT NULL
);
```

### Application Startup

```typescript
// In app initialization
export async function initializeApplication(): Promise<void> {
  try {
    // Initialize database seeding
    await initializeDatabaseSeeding();
    
    // Verify data consistency
    const validator = new DataConsistencyValidator();
    const result = await validator.validateSystemConsistency();
    
    if (!result.valid) {
      console.warn('Data consistency issues detected:', result.issues);
    }
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
    throw error;
  }
}
```

### Monitoring and Alerting

```typescript
export class SystemHealthMonitor {
  static async checkDataConsistency(): Promise<HealthCheckResult>;
  static async verifyReservationFlow(): Promise<HealthCheckResult>;
  static async validateTestDataIntegrity(): Promise<HealthCheckResult>;
  
  static setupHealthCheckEndpoint(): void; // For load balancer health checks
}
```

This design provides a comprehensive solution to the reservation data consistency issue while maintaining clean architecture, proper error handling, and robust testing capabilities.