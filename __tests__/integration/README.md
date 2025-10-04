# Audit Triggers Integration Tests

This directory contains integration tests for the audit system triggers that verify the complete audit functionality across all CRUD operations.

## Test Coverage

### Audit Triggers Integration Tests (`audit-triggers-integration.test.ts`)

This test suite verifies that audit triggers work correctly for all audited tables:

#### Requirements Tested
- **Requirement 1.1, 1.2, 1.3**: Transaction audit logging for INSERT, UPDATE, DELETE operations
- **Requirement 2.1, 2.2, 2.3**: Task audit logging for INSERT, UPDATE, DELETE operations  
- **Requirement 3.1, 3.2, 3.3**: Reservation audit logging for INSERT, UPDATE, DELETE operations
- **Requirement 4.1, 4.2, 4.3**: Loft audit logging for INSERT, UPDATE, DELETE operations

#### Test Categories

1. **Transactions Table Audit Triggers**
   - INSERT operation audit logging with user context and timestamp
   - UPDATE operation audit logging with changed fields tracking
   - DELETE operation audit logging with complete record capture

2. **Tasks Table Audit Triggers**
   - INSERT operation audit logging
   - UPDATE operation audit logging with user tracking and proper attribution
   - DELETE operation audit logging with complete data capture

3. **Reservations Table Audit Triggers**
   - INSERT operation audit logging
   - UPDATE operation audit logging with reservation state changes
   - DELETE operation audit logging

4. **Lofts Table Audit Triggers**
   - INSERT operation audit logging
   - UPDATE operation audit logging with property modifications tracking
   - DELETE operation audit logging with complete loft data capture

5. **User Context Tracking and Data Integrity**
   - User context tracking across different operations
   - Audit log data integrity and completeness verification
   - Concurrent operations handling without data corruption

#### Key Features Tested

- **Audit Log Creation**: Verifies that audit logs are created for all CRUD operations
- **User Context Tracking**: Ensures proper user attribution with ID, email, IP address, and user agent
- **Changed Fields Detection**: Validates that UPDATE operations correctly identify modified fields
- **Old/New Values Capture**: Confirms that old and new values are properly stored for UPDATE operations
- **Timestamp Recording**: Verifies that timestamps are accurate and recent
- **Data Integrity**: Ensures audit logs contain complete and accurate information
- **Concurrent Operations**: Tests that multiple simultaneous operations don't interfere with each other

#### Mock Implementation

The tests use a sophisticated mock implementation of the Supabase client that:

- Simulates database CRUD operations
- Automatically generates audit logs when operations are performed
- Maintains state between operations to provide realistic old/new value comparisons
- Tracks user context and session information
- Provides proper error handling and edge case coverage

#### Running the Tests

```bash
# Run all integration tests
npm test -- __tests__/integration/

# Run only audit trigger tests
npm test -- __tests__/integration/audit-triggers-integration.test.ts

# Run with verbose output
npm test -- __tests__/integration/audit-triggers-integration.test.ts --verbose

# Run specific test pattern
npm test -- __tests__/integration/audit-triggers-integration.test.ts --testNamePattern="INSERT operation"
```

#### Test Structure

Each test follows a consistent pattern:

1. **Setup**: Create test data using mocked Supabase operations
2. **Action**: Perform the CRUD operation being tested
3. **Verification**: Check that appropriate audit logs were created
4. **Validation**: Verify audit log content matches expected values
5. **Cleanup**: Clear mock data for next test

#### Expected Audit Log Properties

All audit logs should contain:

- `id`: Unique identifier for the audit log
- `tableName`: Name of the table that was modified
- `recordId`: ID of the record that was modified
- `action`: Type of operation (INSERT, UPDATE, DELETE)
- `userId`: ID of the user who performed the action
- `userEmail`: Email of the user who performed the action
- `timestamp`: When the operation occurred
- `oldValues`: Record state before modification (UPDATE/DELETE only)
- `newValues`: Record state after modification (INSERT/UPDATE only)
- `changedFields`: Array of field names that were modified (UPDATE only)
- `ipAddress`: IP address of the user
- `userAgent`: User agent string of the client

#### Integration with Real Database

While these tests use mocks for isolation and speed, they are designed to mirror the exact behavior of the real audit triggers. The mock implementation:

- Follows the same data flow as the actual database triggers
- Maintains the same audit log structure
- Simulates the same user context mechanisms
- Provides the same error handling patterns

This ensures that the tests accurately validate the audit system behavior that would occur in a real database environment.