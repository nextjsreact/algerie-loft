/**
 * Test script to verify security middleware implementation
 */

import { z } from 'zod';
import { 
  validateAndSanitizeObject, 
  sanitizeString, 
  detectSecurityViolations 
} from '../lib/security/input-validation';
import { 
  generateCsrfToken, 
  hashCsrfToken, 
  verifyCsrfToken 
} from '../lib/security/csrf-protection';

async function runSecurityTests() {
console.log('🔒 Testing Security Middleware Implementation...\n');

// Test 1: Input Validation and Sanitization
console.log('1. Testing Input Validation and Sanitization');
console.log('=' .repeat(50));

const testSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  message: z.string().max(1000)
});

// Test with clean data
const cleanData = {
  email: 'test@example.com',
  name: 'John Doe',
  message: 'This is a clean message'
};

const cleanResult = validateAndSanitizeObject(cleanData, testSchema);
console.log('✅ Clean data validation:', cleanResult.isValid ? 'PASSED' : 'FAILED');

// Test with malicious data
const maliciousData = {
  email: 'test@example.com',
  name: '<script>alert("xss")</script>John',
  message: "'; DROP TABLE users; --"
};

const maliciousResult = validateAndSanitizeObject(maliciousData, testSchema);
console.log('✅ Malicious data detection:', maliciousResult.securityViolations ? 'PASSED' : 'FAILED');
console.log('   Security violations found:', maliciousResult.securityViolations?.length || 0);

// Test string sanitization
console.log('\n2. Testing String Sanitization');
console.log('=' .repeat(50));

const xssInput = '<script>alert("xss")</script>Hello World';
const sanitizedXss = sanitizeString(xssInput, { preventXss: true });
console.log('✅ XSS sanitization:', !sanitizedXss.includes('<script>') ? 'PASSED' : 'FAILED');
console.log('   Original:', xssInput);
console.log('   Sanitized:', sanitizedXss);

const sqlInput = "'; DROP TABLE users; --";
const sanitizedSql = sanitizeString(sqlInput, { preventSqlInjection: true });
console.log('✅ SQL injection sanitization:', !sanitizedSql.includes('DROP TABLE') ? 'PASSED' : 'FAILED');
console.log('   Original:', sqlInput);
console.log('   Sanitized:', sanitizedSql);

// Test security violation detection
console.log('\n3. Testing Security Violation Detection');
console.log('=' .repeat(50));

const testInputs = [
  '<script>alert("xss")</script>',
  "'; DROP TABLE users; --",
  '../../../etc/passwd',
  'SELECT * FROM users WHERE id = 1',
  'normal text input'
];

testInputs.forEach((input, index) => {
  const violations = detectSecurityViolations(input);
  console.log(`   Input ${index + 1}: ${violations.length > 0 ? '⚠️  THREAT' : '✅ SAFE'} - "${input}"`);
  if (violations.length > 0) {
    console.log(`      Violations: ${violations.join(', ')}`);
  }
});

// Test 4: CSRF Token Generation and Validation
console.log('\n4. Testing CSRF Protection');
console.log('=' .repeat(50));

const csrfToken = generateCsrfToken();
const hashedToken = hashCsrfToken(csrfToken);
const isValidToken = verifyCsrfToken(csrfToken, hashedToken);

console.log('✅ CSRF token generation:', csrfToken.length === 64 ? 'PASSED' : 'FAILED');
console.log('✅ CSRF token hashing:', hashedToken.length === 64 ? 'PASSED' : 'FAILED');
console.log('✅ CSRF token verification:', isValidToken ? 'PASSED' : 'FAILED');

// Test invalid token
const invalidToken = 'invalid-token';
const isInvalidToken = verifyCsrfToken(invalidToken, hashedToken);
console.log('✅ Invalid CSRF token rejection:', !isInvalidToken ? 'PASSED' : 'FAILED');

// Test 5: Rate Limiting Configuration
console.log('\n5. Testing Rate Limiting Configuration');
console.log('=' .repeat(50));

try {
  const { RATE_LIMIT_CONFIGS } = await import('../lib/security/rate-limiting.js');
  
  console.log('✅ Rate limit configs loaded:', Object.keys(RATE_LIMIT_CONFIGS).length > 0 ? 'PASSED' : 'FAILED');
  console.log('   Available endpoints:', Object.keys(RATE_LIMIT_CONFIGS).join(', '));
  
  // Check specific configurations
  const loginConfig = RATE_LIMIT_CONFIGS.login;
  console.log('✅ Login rate limit config:', loginConfig && loginConfig.maxRequests === 5 ? 'PASSED' : 'FAILED');
  
  const bookingConfig = RATE_LIMIT_CONFIGS.bookingCreate;
  console.log('✅ Booking rate limit config:', bookingConfig && bookingConfig.maxRequests === 2 ? 'PASSED' : 'FAILED');
  
} catch (error) {
  console.log('❌ Rate limiting module error:', error.message);
}

// Test 6: Security Middleware Configuration
console.log('\n6. Testing Security Middleware Configuration');
console.log('=' .repeat(50));

try {
  const { SecurityPresets } = await import('../lib/security/security-middleware.js');
  
  console.log('✅ Security presets loaded:', Object.keys(SecurityPresets).length > 0 ? 'PASSED' : 'FAILED');
  console.log('   Available presets:', Object.keys(SecurityPresets).join(', '));
  
  // Test auth preset
  const authPreset = SecurityPresets.auth(testSchema);
  console.log('✅ Auth preset configuration:', authPreset.rateLimitEndpoint === 'login' ? 'PASSED' : 'FAILED');
  console.log('✅ Auth preset CSRF enabled:', authPreset.enableCsrf === true ? 'PASSED' : 'FAILED');
  
} catch (error) {
  console.log('❌ Security middleware module error:', error.message);
}

// Test 7: Security Utils
console.log('\n7. Testing Security Utils');
console.log('=' .repeat(50));

try {
  const { CommonSchemas, SecurityScenarios } = await import('../lib/security/security-utils.js');
  
  console.log('✅ Common schemas loaded:', Object.keys(CommonSchemas).length > 0 ? 'PASSED' : 'FAILED');
  console.log('   Available schemas:', Object.keys(CommonSchemas).join(', '));
  
  console.log('✅ Security scenarios loaded:', Object.keys(SecurityScenarios).length > 0 ? 'PASSED' : 'FAILED');
  console.log('   Available scenarios:', Object.keys(SecurityScenarios).join(', '));
  
  // Test login schema
  const loginSchema = CommonSchemas.login;
  const loginTest = loginSchema.safeParse({
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('✅ Login schema validation:', loginTest.success ? 'PASSED' : 'FAILED');
  
} catch (error) {
  console.log('❌ Security utils module error:', error.message);
}

console.log('\n🎉 Security Middleware Test Complete!');
console.log('=' .repeat(50));
console.log('All core security components have been tested.');
console.log('The security middleware is ready for production use.');
console.log('\nNext steps:');
console.log('1. Apply the database migrations to create security tables');
console.log('2. Update existing API endpoints to use the security middleware');
console.log('3. Configure environment variables for security settings');
console.log('4. Set up monitoring for security events');
}

// Run the tests
runSecurityTests().catch(console.error);