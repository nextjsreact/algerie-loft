# Developer Guide - Environment Management System

## Overview

This guide helps developers effectively use the Test/Training Environment Setup System for development and testing workflows. Learn how to work with cloned environments, run tests, and integrate the system into your development process.

## Quick Start for Developers

### Prerequisites
- Node.js 18+ installed
- Access to development environment credentials
- Basic understanding of the application architecture
- Git access to the project repository

### Initial Setup
1. **Clone the repository and install dependencies**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   npm install
   ```

2. **Configure your development environment**
   ```bash
   # Copy environment template
   cp .env.example .env.development
   
   # Edit .env.development with your development database credentials
   ```

3. **Verify your setup**
   ```bash
   # Test connection to development environment
   npm run validate --environment=development
   
   # Check current environment
   npm run current-env
   ```

## Development Workflows

### 1. Working with Test Environments

#### Creating a Fresh Test Environment
```bash
# Create test environment from production
npm run clone --source=production --target=test --anonymize

# Switch to test environment
npm run switch --environment=test

# Verify everything works
npm run test:functionality --environment=test
```

#### Using Existing Test Environment
```bash
# Switch to existing test environment
npm run switch --environment=test

# Check environment health
npm run health --environment=test

# Refresh data if needed
npm run refresh --source=production --target=test --anonymize
```

### 2. Feature Development Workflow

#### Setting Up for New Feature Development
```bash
# Create feature-specific test environment
npm run clone --source=production --target=feature-test --anonymize --name="Feature XYZ Testing"

# Switch to feature environment
npm run switch --environment=feature-test

# Start development server
npm run dev
```

#### Testing Schema Changes
```bash
# Apply your schema changes to test environment
npm run schema:apply --environment=feature-test --migration=your-migration.sql

# Verify schema changes
npm run schema:validate --environment=feature-test

# Test functionality with new schema
npm run test:integration --environment=feature-test
```

#### Testing Data Changes
```bash
# Test data anonymization with new fields
npm run anonymize:test --environment=feature-test --tables=your-new-table

# Verify data integrity
npm run validate:data --environment=feature-test

# Test application functionality
npm run test:e2e --environment=feature-test
```

### 3. Testing and Quality Assurance

#### Running Tests Against Cloned Environment
```bash
# Run unit tests
npm run test:unit

# Run integration tests against test environment
npm run test:integration --environment=test

# Run end-to-end tests
npm run test:e2e --environment=test --headless

# Run performance tests
npm run test:performance --environment=test
```

#### Database Testing
```bash
# Test database operations
npm run test:database --environment=test

# Test audit system functionality
npm run test:audit --environment=test

# Test real-time features (conversations, notifications)
npm run test:realtime --environment=test
```

### 4. Debugging and Development

#### Debugging with Real Data
```bash
# Switch to test environment with anonymized production data
npm run switch --environment=test

# Enable debug logging
export DEBUG=app:*

# Start application in debug mode
npm run dev:debug
```

#### Analyzing Data Issues
```bash
# Check data consistency
npm run analyze:data --environment=test --table=problematic-table

# Compare with production structure
npm run compare:data --source=production --target=test --table=problematic-table

# Generate data report
npm run report:data --environment=test --output=data-analysis.html
```

## Development Best Practices

### 1. Environment Management

#### Environment Naming Convention
```bash
# Use descriptive names for feature environments
npm run clone --target=feature-user-auth --name="User Authentication Feature"
npm run clone --target=bugfix-payment-issue --name="Payment Bug Fix"
npm run clone --target=perf-optimization --name="Performance Optimization"
```

#### Environment Lifecycle
```bash
# Create environment for feature
npm run clone --source=production --target=feature-xyz

# Develop and test
# ... development work ...

# Clean up when done
npm run cleanup --environment=feature-xyz --confirm
```

### 2. Testing Strategies

#### Test Data Management
```bash
# Create test data sets for specific scenarios
npm run testdata:create --environment=test --scenario=high-volume-transactions
npm run testdata:create --environment=test --scenario=multi-team-setup
npm run testdata:create --environment=test --scenario=complex-reservations

# Reset to clean state
npm run testdata:reset --environment=test
```

#### Automated Testing Integration
```javascript
// jest.config.js - Configure tests to use test environment
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'components/**/*.{js,ts,tsx}',
    '!**/*.d.ts'
  ]
};
```

```javascript
// tests/setup.js - Test environment setup
const { switchEnvironment } = require('../lib/environment-management');

beforeAll(async () => {
  // Ensure we're using test environment
  await switchEnvironment('test');
  
  // Verify test environment is healthy
  const health = await validateEnvironment('test');
  if (!health.isValid) {
    throw new Error('Test environment is not healthy');
  }
});
```

### 3. Code Integration

#### Environment-Aware Code
```typescript
// lib/config/environment.ts
export const getCurrentEnvironment = (): Environment => {
  const envType = process.env.NODE_ENV || 'development';
  const envConfig = {
    production: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      isProduction: true
    },
    test: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      isProduction: false
    },
    development: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      isProduction: false
    }
  };
  
  return envConfig[envType as keyof typeof envConfig];
};
```

#### Safe Database Operations
```typescript
// lib/database/safe-operations.ts
import { getCurrentEnvironment } from '../config/environment';

export const safeExecuteQuery = async (query: string, params?: any[]) => {
  const env = getCurrentEnvironment();
  
  // Extra safety check for production
  if (env.isProduction && isWriteOperation(query)) {
    throw new Error('Write operations not allowed in production');
  }
  
  return await executeQuery(query, params);
};

const isWriteOperation = (query: string): boolean => {
  const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE'];
  return writeKeywords.some(keyword => 
    query.toUpperCase().trim().startsWith(keyword)
  );
};
```

## Advanced Development Techniques

### 1. Custom Environment Configurations

#### Creating Custom Development Environments
```bash
# Create environment with specific configuration
npm run clone --source=production --target=dev-custom \
  --config=custom-dev-config.json \
  --anonymize \
  --include-audit=false \
  --batch-size=500
```

```json
// custom-dev-config.json
{
  "anonymizationRules": [
    {
      "tableName": "users",
      "columnName": "email",
      "anonymizationType": "email",
      "customGenerator": "dev-user-{index}@test.local"
    }
  ],
  "testDataGeneration": {
    "generateSampleUsers": 50,
    "generateSampleTransactions": 1000,
    "generateSampleReservations": 200
  },
  "featureFlags": {
    "enableAuditSystem": true,
    "enableConversations": true,
    "enableNotifications": false
  }
}
```

### 2. Performance Testing

#### Load Testing with Cloned Data
```bash
# Create performance test environment
npm run clone --source=production --target=perf-test --anonymize --scale=0.1

# Run load tests
npm run test:load --environment=perf-test --concurrent-users=100

# Monitor performance
npm run monitor:performance --environment=perf-test --duration=10m
```

#### Database Performance Testing
```bash
# Test query performance
npm run test:queries --environment=perf-test --slow-query-threshold=1000ms

# Analyze database performance
npm run analyze:db-performance --environment=perf-test
```

### 3. Integration Testing

#### API Integration Testing
```javascript
// tests/integration/api.test.js
describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure clean test environment
    await resetTestEnvironment();
  });

  test('should handle user authentication', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-user-1@test.local',
        password: 'test-password'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
  });

  test('should create and retrieve reservations', async () => {
    const reservation = await createTestReservation();
    const retrieved = await getReservation(reservation.id);
    
    expect(retrieved.id).toBe(reservation.id);
    expect(retrieved.status).toBe('confirmed');
  });
});
```

#### Real-time Feature Testing
```javascript
// tests/integration/realtime.test.js
describe('Real-time Features', () => {
  test('should receive conversation messages', async () => {
    const client1 = createTestClient('user1@test.local');
    const client2 = createTestClient('user2@test.local');
    
    const messagePromise = new Promise((resolve) => {
      client2.on('message', resolve);
    });
    
    await client1.sendMessage('conversation-123', 'Hello World');
    const receivedMessage = await messagePromise;
    
    expect(receivedMessage.content).toBe('Hello World');
  });
});
```

## Troubleshooting for Developers

### Common Development Issues

#### Environment Connection Issues
```bash
# Check environment status
npm run status --environment=development

# Test database connection
npm run test:connection --environment=development

# Verify environment configuration
npm run config:verify --environment=development
```

#### Data Inconsistency Issues
```bash
# Check data integrity
npm run validate:data --environment=test --table=problematic-table

# Compare with production
npm run compare:schema --source=production --target=test

# Refresh problematic data
npm run refresh --source=production --target=test --tables=problematic-table --anonymize
```

#### Performance Issues
```bash
# Profile slow operations
npm run profile --environment=test --operation=slow-query

# Check resource usage
npm run monitor:resources --environment=test

# Optimize environment
npm run optimize --environment=test --auto
```

### Debugging Techniques

#### Database Debugging
```bash
# Enable query logging
export DEBUG_QUERIES=true

# Run application with query logging
npm run dev

# Analyze slow queries
npm run analyze:slow-queries --environment=test --timeframe=1h
```

#### Application Debugging
```bash
# Enable detailed logging
export DEBUG=app:*,supabase:*

# Run with debugging
npm run dev:debug

# Check application logs
npm run logs --level=debug --timeframe=30m
```

## CI/CD Integration

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
name: Test with Cloned Environment

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Create test environment
      run: |
        npm run clone --source=production --target=ci-test-${{ github.run_id }} --anonymize
        npm run switch --environment=ci-test-${{ github.run_id }}
      env:
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        
    - name: Run tests
      run: |
        npm run test:unit
        npm run test:integration
        npm run test:e2e
        
    - name: Cleanup
      if: always()
      run: npm run cleanup --environment=ci-test-${{ github.run_id }} --force
```

### Local Development Scripts
```json
// package.json scripts for development
{
  "scripts": {
    "dev:fresh": "npm run clone --source=production --target=development --anonymize && npm run switch --environment=development && npm run dev",
    "dev:reset": "npm run reset --environment=development --confirm && npm run dev",
    "test:full": "npm run test:unit && npm run test:integration --environment=test && npm run test:e2e --environment=test",
    "debug:db": "DEBUG_QUERIES=true npm run dev",
    "profile:app": "NODE_ENV=development npm run dev --inspect"
  }
}
```

This developer guide provides comprehensive information for effectively using the environment cloning system in development workflows, testing strategies, and troubleshooting common issues.