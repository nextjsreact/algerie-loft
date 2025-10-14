/**
 * Simple test runner to verify validation tests work
 */

const { execSync } = require('child_process');

console.log('Running validation system tests...');

try {
  // Run the comprehensive validation tests
  console.log('\n=== Running Comprehensive Validation Tests ===');
  execSync('npm test -- --testPathPattern="validation-system-comprehensive" --passWithNoTests', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n=== Running Validation Engine Accuracy Tests ===');
  execSync('npm test -- --testPathPattern="validation-engine-accuracy" --passWithNoTests', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n=== Running Functionality Test Suite Tests ===');
  execSync('npm test -- --testPathPattern="functionality-test-suite-completeness" --passWithNoTests', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n=== Running Health Monitoring Tests ===');
  execSync('npm test -- --testPathPattern="health-monitoring-alerting" --passWithNoTests', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ All validation tests completed successfully!');
} catch (error) {
  console.error('\n❌ Some tests failed:', error.message);
  process.exit(1);
}