# Environment Cloner Integration Tests

This directory contains comprehensive integration tests for the Environment Cloner system, testing the complete clone workflow end-to-end including backup, rollback, and error handling scenarios.

## Test Coverage

### Requirements Tested

- **Requirement 1.1**: Complete environment cloning workflow from production to test/training environments
- **Requirement 1.2**: Specialized system cloning (audit, conversations, reservations) with data integrity
- **Requirement 6.3**: Comprehensive error handling and recovery scenarios
- **Requirement 7.1**: Backup and rollback mechanisms with production safety

### Test Categories

#### 1. Complete Clone Workflow End-to-End
- **Full Production to Test Clone**: Tests complete workflow with all systems (audit, conversations, reservations)
- **Specialized Systems Clone**: Validates cloning of complex systems with relationships
- **Progress Tracking**: Verifies operation progress monitoring throughout workflow
- **Large Dataset Handling**: Tests resource management with large data volumes

#### 2. Backup and Rollback Functionality
- **Backup Creation**: Validates automatic backup creation before cloning operations
- **Rollback Operations**: Tests rollback functionality when operations fail
- **Production Safety**: Ensures production environments are never modified during backup/rollback
- **Backup Validation**: Tests backup integrity and corruption handling

#### 3. Error Handling and Recovery Scenarios
- **Connection Failures**: Tests graceful handling of database connection issues
- **Schema Migration Errors**: Validates recovery from schema synchronization failures
- **Anonymization Failures**: Tests error handling in data anonymization processes
- **Operation Cancellation**: Validates proper cleanup when operations are cancelled
- **Concurrent Operations**: Tests handling of multiple simultaneous clone operations

#### 4. Production Safety Enforcement
- **Target Validation**: Ensures production can never be used as clone target
- **Source Validation**: Validates read-only access when using production as source
- **Configuration Validation**: Tests rejection of invalid production configurations
- **Safety Checks**: Validates multiple layers of production protection

#### 5. Operation Monitoring and Logging
- **Detailed Logging**: Validates comprehensive operation logs throughout process
- **Statistics Tracking**: Tests accurate tracking of clone operation statistics
- **Operation Cleanup**: Validates proper resource cleanup after operations

#### 6. Edge Cases and Boundary Conditions
- **Empty Environments**: Tests cloning from environments with minimal data
- **Feature Combinations**: Tests all combinations of clone options
- **Invalid Configurations**: Tests handling of malformed environment configurations

## Test Structure

### Core Test Files

- `environment-cloner-integration.test.ts` - Main integration test suite
- `environment-cloner-test-setup.ts` - Test utilities and helpers
- `__mocks__/environment-management-mocks.ts` - Mock implementations
- `run-cloner-integration-tests.js` - Test runner script

### Mock Implementation

The tests use sophisticated mock implementations that:

- Simulate real database operations without external dependencies
- Maintain state consistency across operations
- Provide realistic error scenarios for testing
- Enforce production safety rules identical to real implementation
- Track operation progress and statistics accurately

### Test Utilities

The test setup provides utilities for:

- Creating mock environments with proper configurations
- Generating various clone option combinations
- Validating result structures and statistics
- Verifying production safety enforcement
- Checking operation logs and monitoring data

## Running the Tests

### Individual Test Execution

```bash
# Run all environment cloner integration tests
npm test -- __tests__/integration/environment-cloner-integration.test.ts

# Run with verbose output
npm test -- __tests__/integration/environment-cloner-integration.test.ts --verbose

# Run specific test pattern
npm test -- __tests__/integration/environment-cloner-integration.test.ts --testNamePattern="Complete Clone Workflow"

# Run using the dedicated test runner
node __tests__/integration/run-cloner-integration-tests.js
```

### Integration Test Suite

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode (for development)
npm run test:integration -- --watch
```

## Test Scenarios

### Scenario 1: Production to Test Environment Clone

```typescript
const scenario = {
  source: 'Production Environment (read-only)',
  target: 'Test Environment',
  options: {
    anonymizeData: true,
    includeAuditLogs: true,
    includeConversations: true,
    includeReservations: true,
    createBackup: true,
    validateAfterClone: true
  },
  expectedResults: {
    success: true,
    tablesCloned: '>= 25',
    recordsAnonymized: '> 0',
    backupCreated: true,
    validationPassed: true
  }
}
```

### Scenario 2: Error Recovery and Rollback

```typescript
const scenario = {
  source: 'Production Environment',
  target: 'Invalid Environment',
  options: {
    createBackup: true,
    validateAfterClone: true
  },
  expectedResults: {
    success: false,
    errorsReported: true,
    rollbackAttempted: true,
    productionUntouched: true
  }
}
```

### Scenario 3: Production Safety Enforcement

```typescript
const scenario = {
  source: 'Test Environment',
  target: 'Production Environment', // INVALID
  expectedResults: {
    operationBlocked: true,
    errorType: 'ProductionAccessError',
    securityAlertGenerated: true
  }
}
```

## Key Features Tested

### Production Safety
- **Read-Only Enforcement**: Production environments are always read-only
- **Target Validation**: Production can never be used as clone target
- **Multiple Safety Checks**: Multiple layers of production protection
- **Security Alerts**: Automatic alerts for production access attempts

### Data Integrity
- **Relationship Preservation**: Foreign key relationships maintained during cloning
- **Anonymization Accuracy**: Sensitive data properly anonymized while preserving structure
- **Schema Consistency**: Database schema properly synchronized between environments
- **Audit Trail Maintenance**: Audit logs preserved and properly anonymized

### Operation Reliability
- **Progress Tracking**: Real-time progress monitoring throughout operations
- **Error Recovery**: Graceful handling of failures with proper rollback
- **Resource Management**: Efficient handling of large datasets
- **Concurrent Safety**: Safe handling of multiple simultaneous operations

### Monitoring and Logging
- **Comprehensive Logs**: Detailed logging of all operation phases
- **Statistics Tracking**: Accurate tracking of cloned data and operations
- **Performance Metrics**: Duration and resource usage monitoring
- **Security Auditing**: Complete audit trail of all operations

## Expected Test Results

When all tests pass, you should see:

- ✅ Complete clone workflow tests (4 tests)
- ✅ Backup and rollback functionality tests (4 tests)
- ✅ Error handling and recovery tests (6 tests)
- ✅ Production safety enforcement tests (4 tests)
- ✅ Operation monitoring tests (3 tests)
- ✅ Edge cases and boundary conditions tests (3 tests)

**Total: 24 integration tests covering all critical functionality**

## Troubleshooting

### Common Issues

1. **Mock Setup Errors**: Ensure all mocks are properly configured before running tests
2. **Timeout Issues**: Increase test timeout for complex scenarios
3. **Memory Issues**: Run tests with `--runInBand` flag to avoid memory conflicts
4. **Environment Variables**: Ensure test environment variables are properly set

### Debug Mode

```bash
# Run with debug output
DEBUG=* npm test -- __tests__/integration/environment-cloner-integration.test.ts

# Run single test for debugging
npm test -- __tests__/integration/environment-cloner-integration.test.ts --testNamePattern="specific test name"
```

## Integration with CI/CD

These integration tests are designed to run in CI/CD pipelines and provide:

- Fast execution with mock implementations
- Comprehensive coverage of critical functionality
- Clear pass/fail indicators for deployment decisions
- Detailed error reporting for debugging failures

The tests validate that the environment cloning system meets all requirements and maintains production safety under all conditions.