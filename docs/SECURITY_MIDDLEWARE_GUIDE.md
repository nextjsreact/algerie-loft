# Security Middleware Implementation Guide

This document provides a comprehensive guide to the security middleware implementation for the client reservation flow. The security system provides multiple layers of protection including input validation, rate limiting, CSRF protection, and SQL injection prevention.

## Overview

The security middleware system consists of several components:

1. **Input Validation & Sanitization** - Prevents XSS, SQL injection, and validates data integrity
2. **Rate Limiting** - Prevents abuse and DDoS attacks
3. **CSRF Protection** - Protects against cross-site request forgery
4. **Authentication & Authorization** - Ensures proper access control
5. **Audit Logging** - Tracks security events and violations
6. **Suspicious Activity Detection** - Identifies and blocks malicious behavior

## Components

### 1. Input Validation (`lib/security/input-validation.ts`)

Provides comprehensive input validation and sanitization:

```typescript
import { validateAndSanitizeObject, sanitizeString } from '@/lib/security/input-validation';

// Sanitize individual strings
const cleanInput = sanitizeString(userInput, {
  preventXss: true,
  preventSqlInjection: true,
  maxLength: 255
});

// Validate and sanitize objects
const result = validateAndSanitizeObject(requestData, schema, {
  allowHtml: false,
  preventSqlInjection: true
});
```

**Features:**
- XSS prevention with HTML sanitization
- SQL injection detection and prevention
- Path traversal protection
- Command injection detection
- File upload validation
- Header validation

### 2. CSRF Protection (`lib/security/csrf-protection.ts`)

Protects against cross-site request forgery attacks:

```typescript
import { createCsrfMiddleware, generateCsrfToken } from '@/lib/security/csrf-protection';

// Create CSRF middleware
const csrfMiddleware = createCsrfMiddleware({
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token'
});

// Generate token for forms
const token = generateCsrfToken();
```

**Features:**
- Token generation and validation
- Cookie-based token storage
- Form and header token support
- Automatic token refresh
- Secure token hashing

### 3. Rate Limiting (`lib/security/rate-limiting.ts`)

Prevents abuse through configurable rate limiting:

```typescript
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiting';

// Check rate limit
const result = await checkRateLimit(clientIp, 'login');
if (!result.allowed) {
  // Handle rate limit exceeded
}
```

**Predefined Limits:**
- Login: 5 attempts per 15 minutes
- Registration: 3 per hour
- Booking: 2 per minute
- File Upload: 5 per minute
- API General: 100 per minute

### 4. Security Middleware (`lib/security/security-middleware.ts`)

Comprehensive middleware that combines all security features:

```typescript
import { withSecurity, SecurityPresets } from '@/lib/security/security-middleware';

// Secure an endpoint
export const POST = withSecurity(
  async (request, context) => {
    // Your handler logic
    const { sanitizedData, clientIp, securityViolations } = context;
    // ...
  },
  SecurityPresets.auth(loginSchema)
);
```

## Usage Examples

### 1. Securing Authentication Endpoints

```typescript
// app/api/auth/login/route.ts
import { withSecurity, SecurityPresets } from '@/lib/security/security-middleware';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function loginHandler(request: NextRequest, context: any) {
  const { sanitizedData } = context;
  // Handle login with sanitized data
}

export const POST = withSecurity(
  loginHandler,
  SecurityPresets.auth(loginSchema)
);
```

### 2. Securing Booking Endpoints

```typescript
// app/api/reservations/route.ts
import { withSecurity, SecurityPresets } from '@/lib/security/security-middleware';

const reservationSchema = z.object({
  loft_id: z.string().uuid(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guest_count: z.number().int().min(1).max(20)
});

export const POST = withSecurity(
  reservationHandler,
  SecurityPresets.booking(reservationSchema)
);
```

### 3. Using Security Utils

```typescript
import { createSecureRoute, CommonSchemas, SecurityScenarios } from '@/lib/security/security-utils';

// Create a secure route with multiple methods
export const { GET, POST, PUT, DELETE } = createSecureRoute({
  GET: async (request, context) => {
    // Handle GET
  },
  POST: async (request, context) => {
    // Handle POST
  },
  security: SecurityScenarios.userDashboard(CommonSchemas.search)
});
```

## Database Schema

The security system requires several database tables:

### Core Security Tables

```sql
-- Rate limiting
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE,
  identifier VARCHAR(255),
  endpoint VARCHAR(100),
  hits INTEGER,
  window_start BIGINT,
  reset_time BIGINT,
  max_requests INTEGER,
  window_ms INTEGER
);

-- Blocked identifiers
CREATE TABLE blocked_identifiers (
  id UUID PRIMARY KEY,
  identifier VARCHAR(255),
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Security events
CREATE TABLE security_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50),
  severity VARCHAR(20),
  identifier VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Authentication Security Tables

```sql
-- Failed login attempts
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);

-- User sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  client_ip VARCHAR(45),
  user_agent TEXT,
  login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
);
```

## Configuration

### Environment Variables

```env
# Security settings
SECURITY_RATE_LIMIT_ENABLED=true
SECURITY_CSRF_ENABLED=true
SECURITY_SUSPICIOUS_ACTIVITY_DETECTION=true

# Rate limiting
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW=900000

# CSRF
CSRF_TOKEN_LENGTH=32
CSRF_COOKIE_NAME=csrf-token
```

### Security Presets

The system provides several security presets for common scenarios:

- `SecurityPresets.auth()` - Authentication endpoints
- `SecurityPresets.booking()` - Booking/reservation endpoints
- `SecurityPresets.upload()` - File upload endpoints
- `SecurityPresets.api()` - General API endpoints
- `SecurityPresets.public()` - Public endpoints

## Monitoring and Alerts

### Security Events

The system logs various security events:

- Rate limit violations
- CSRF token failures
- Input validation violations
- Suspicious activity detection
- Failed authentication attempts

### Monitoring Queries

```sql
-- Get security statistics
SELECT * FROM get_security_stats('2024-01-01', '2024-01-31');

-- Check recent security events
SELECT * FROM security_events 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY severity DESC, created_at DESC;

-- Monitor rate limit violations
SELECT endpoint, COUNT(*) as violations
FROM rate_limits 
WHERE hits > max_requests 
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint;
```

## Best Practices

### 1. Input Validation

- Always validate and sanitize user input
- Use strict schemas with Zod
- Implement both client and server-side validation
- Log validation violations for monitoring

### 2. Rate Limiting

- Apply appropriate rate limits based on endpoint sensitivity
- Use different limits for authenticated vs anonymous users
- Monitor rate limit violations for abuse patterns
- Implement progressive penalties for repeat offenders

### 3. CSRF Protection

- Enable CSRF protection for all state-changing operations
- Use secure, httpOnly cookies for token storage
- Implement token refresh for long-running sessions
- Validate tokens on both header and form submissions

### 4. Authentication Security

- Implement account lockout after failed attempts
- Log all authentication events
- Use secure session management
- Implement device tracking for suspicious activity

### 5. Error Handling

- Never expose sensitive information in error messages
- Log detailed errors server-side for debugging
- Return generic error messages to clients
- Implement proper error boundaries

## Troubleshooting

### Common Issues

1. **Rate Limit False Positives**
   - Check if rate limits are too restrictive
   - Verify IP extraction is working correctly
   - Consider implementing user-based rate limiting

2. **CSRF Token Failures**
   - Ensure tokens are properly included in requests
   - Check cookie settings (secure, sameSite)
   - Verify token expiration settings

3. **Input Validation Errors**
   - Review validation schemas for correctness
   - Check for overly strict sanitization rules
   - Verify file upload configurations

### Debugging

Enable debug logging:

```typescript
// In your environment
DEBUG_SECURITY=true

// In code
logger.debug('Security middleware processing', {
  endpoint: request.url,
  method: request.method,
  clientIp,
  violations: securityViolations
});
```

## Performance Considerations

### Database Optimization

- Regularly clean up expired records
- Use appropriate indexes for security tables
- Consider partitioning large security event tables
- Implement connection pooling for high-traffic scenarios

### Caching

- Cache rate limit data in Redis for better performance
- Use in-memory caching for frequently accessed security rules
- Implement distributed caching for multi-server deployments

### Monitoring

- Set up alerts for security violations
- Monitor database performance for security tables
- Track response times for security middleware
- Implement health checks for security components

## Migration Guide

To implement the security middleware in existing endpoints:

1. **Install Dependencies**
   ```bash
   npm install zod isomorphic-dompurify bcryptjs
   ```

2. **Run Database Migrations**
   ```sql
   -- Execute security-tables-schema.sql
   -- Execute auth-security-tables.sql
   ```

3. **Update Existing Endpoints**
   ```typescript
   // Before
   export async function POST(request: NextRequest) {
     // Handler logic
   }
   
   // After
   export const POST = withSecurity(
     async (request, context) => {
       // Handler logic with security context
     },
     SecurityPresets.api(validationSchema)
   );
   ```

4. **Configure Environment Variables**
   - Set up rate limiting configurations
   - Configure CSRF settings
   - Enable security features

5. **Test Security Features**
   - Verify rate limiting works
   - Test CSRF protection
   - Validate input sanitization
   - Check audit logging

## Security Checklist

- [ ] Input validation implemented for all endpoints
- [ ] Rate limiting configured appropriately
- [ ] CSRF protection enabled for state-changing operations
- [ ] SQL injection prevention measures in place
- [ ] XSS protection implemented
- [ ] Authentication and authorization properly secured
- [ ] Audit logging configured
- [ ] Security monitoring set up
- [ ] Database security tables created
- [ ] Error handling implemented securely
- [ ] Security headers configured
- [ ] File upload validation implemented
- [ ] Suspicious activity detection enabled

## Support

For questions or issues with the security middleware:

1. Check the troubleshooting section above
2. Review the security event logs
3. Consult the API documentation
4. Contact the development team

Remember: Security is an ongoing process. Regularly review and update security measures based on new threats and requirements.