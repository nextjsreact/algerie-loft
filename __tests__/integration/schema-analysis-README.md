# Schema Analysis Integration Tests

This directory contains comprehensive integration tests for the schema analysis system, covering schema extraction, comparison, and migration script generation.

## Test Files

### 1. `schema-analysis-integration.test.ts`
Full integration tests that require real database connections. Tests:
- Schema extraction from live PostgreSQL/Supabase databases
- Real schema comparison with actual differences
- Migration script generation and execution
- Error handling with database failures

**Requirements:**
- Test database environments (source and target)
- Supabase service keys with appropriate permissions
- Network access to test databases

### 2. `schema-analysis-mock.test.ts`
Integration tests using mocked data that don't require database connections. Tests:
- Schema comparison logic with known differences
- Migration script generation from schema diffs
- SQL generation for various database objects
- Error handling and edge cases

**Requirements:**
- None (runs entirely with mocked data)

### 3. `schema-analysis-test-setup.ts`
Utility classes and functions for setting up test databases and schemas:
- `TestDatabaseSetup` - Creates and manages test schemas
- `TestEnvironmentFactory` - Creates test environment configurations
- Predefined test schema definitions for different scenarios

## Running the Tests

### Quick Start (Mocked Tests Only)
```bash
# Run tests with mocked data (no database required)
npm test __tests__/integration/schema-analysis-mock.test.ts
```

### Full Integration Tests
```bash
# Set up environment variables
export TEST_SOURCE_SUPABASE_URL="https://your-source-db.supabase.co"
export TEST_SOURCE_SUPABASE_SERVICE_KEY="your-source-service-key"
export TEST_TARGET_SUPABASE_URL="https://your-target-db.supabase.co"
export TEST_TARGET_SUPABASE_SERVICE_KEY="your-target-service-key"

# Run all integration tests
npm test __tests__/integration/schema-analysis-integration.test.ts
```

### Using the Test Runner Script
```bash
# Run all tests with automatic environment setup
tsx scripts/run-schema-analysis-tests.ts

# Get help
tsx scripts/run-schema-analysis-tests.ts --help
```

## Test Environment Setup

### Local Development
For local testing, you can use a local Supabase instance:

```bash
# Start local Supabase (requires Docker)
npx supabase start

# Use local endpoints
export TEST_SOURCE_SUPABASE_URL="http://localhost:54321"
export TEST_SOURCE_SUPABASE_SERVICE_KEY="your-local-service-key"
export TEST_TARGET_SUPABASE_URL="http://localhost:54321"
export TEST_TARGET_SUPABASE_SERVICE_KEY="your-local-service-key"
```

### Cloud Testing
For testing with cloud Supabase instances:

1. Create two test projects in Supabase
2. Get the service role keys from the API settings
3. Set the environment variables as shown above

## Test Scenarios

### Schema Extraction Tests
- ✅ Extract complete schema from source database
- ✅ Extract schema with different structure from target
- ✅ Handle extraction errors gracefully
- ✅ Extract functions with correct definitions
- ✅ Extract triggers with correct relationships
- ✅ Extract RLS policies correctly
- ✅ Extract indexes with correct structure

### Schema Comparison Tests
- ✅ Detect table differences (create, drop, alter)
- ✅ Detect function differences (create, drop, alter)
- ✅ Detect trigger differences with dependencies
- ✅ Detect policy differences
- ✅ Detect index differences
- ✅ Proper dependency ordering
- ✅ Accurate summary statistics

### Migration Generation Tests
- ✅ Generate migration script from differences
- ✅ Generate correct CREATE TABLE operations
- ✅ Generate correct ALTER TABLE operations
- ✅ Generate correct CREATE FUNCTION operations
- ✅ Generate correct CREATE TRIGGER operations
- ✅ Generate correct CREATE INDEX operations
- ✅ Generate correct CREATE POLICY operations
- ✅ Generate rollback operations in reverse order
- ✅ Proper operation ordering by dependencies
- ✅ SQL syntax validation
- ✅ Duration and risk assessment

### Error Handling Tests
- ✅ Handle empty schemas gracefully
- ✅ Handle identical schemas
- ✅ Handle invalid migration operations
- ✅ Handle connection failures

## Test Data

### Mock Schema Definitions
The tests use predefined schema definitions that represent common database structures:

#### Source Schema (Complete)
- `users` table with columns, constraints, indexes, triggers, policies
- `posts` table with foreign key relationships
- `audit_function` trigger function
- `user_count` utility function
- Various indexes and RLS policies

#### Target Schema (Modified)
- Missing `users` table
- Has `profiles` table instead of some expected tables
- Missing `audit_function`
- Modified `user_count` function
- Different policy configurations

This setup ensures comprehensive testing of difference detection and migration generation.

## Expected Test Results

### Successful Test Run
```
Schema Analysis Integration Tests (Mocked)
  Schema Comparison with Known Differences
    ✓ should detect table differences between schemas
    ✓ should detect function differences
    ✓ should detect trigger differences
    ✓ should detect policy differences
    ✓ should detect index differences
    ✓ should properly order differences by dependencies
    ✓ should generate accurate summary statistics
  Migration Script Generation and Validation
    ✓ should generate migration script from schema differences
    ✓ should generate correct CREATE TABLE operations
    ✓ should generate correct CREATE FUNCTION operations
    ✓ should generate correct CREATE TRIGGER operations
    ✓ should generate correct CREATE INDEX operations
    ✓ should generate correct CREATE POLICY operations
    ✓ should generate rollback operations in reverse order
    ✓ should properly order operations by dependencies
    ✓ should validate migration script SQL syntax
    ✓ should calculate realistic duration estimates
    ✓ should assess risk levels appropriately
  Error Handling and Edge Cases
    ✓ should handle empty schema gracefully
    ✓ should handle identical schemas
    ✓ should handle invalid migration operations

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```
Error: Schema analysis failed: Failed to get schemas: connection refused
```
**Solution:** Check database URL and service key, ensure database is accessible

#### Permission Errors
```
Error: insufficient_privilege
```
**Solution:** Ensure service key has appropriate permissions for schema operations

#### Test Timeout
```
Error: Timeout - Async callback was not invoked within the 30000ms timeout
```
**Solution:** Increase test timeout or check database performance

### Debug Mode
Enable verbose logging by setting environment variable:
```bash
export DEBUG=schema-analysis:*
```

## Contributing

When adding new tests:

1. **Mock Tests First**: Add tests to `schema-analysis-mock.test.ts` for logic validation
2. **Integration Tests**: Add database-dependent tests to `schema-analysis-integration.test.ts`
3. **Test Data**: Update `schema-analysis-test-setup.ts` with new test scenarios
4. **Documentation**: Update this README with new test descriptions

### Test Naming Convention
- Use descriptive test names: `should detect table differences between schemas`
- Group related tests in `describe` blocks
- Use consistent assertion messages

### Mock Data Guidelines
- Keep mock data realistic and representative
- Include edge cases and error conditions
- Document the purpose of each mock schema variant

## Performance Considerations

### Test Execution Time
- Mock tests: ~2-5 seconds
- Integration tests: ~30-60 seconds (depending on database)
- Full test suite: ~1-2 minutes

### Resource Usage
- Mock tests: Minimal memory usage
- Integration tests: Requires database connections and network I/O
- Cleanup: All tests clean up after themselves

## Security Notes

- Test databases should be isolated from production
- Use dedicated test service keys with minimal required permissions
- Never commit real database credentials to version control
- Test data should not contain sensitive information