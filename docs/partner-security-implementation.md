# Partner Dashboard Security Implementation

This document provides a comprehensive guide to the security implementation for the Partner Dashboard System, including Row Level Security (RLS) policies, audit logging, and security middleware.

## Overview

The Partner Dashboard Security System implements multiple layers of security:

1. **Row Level Security (RLS)** - Database-level access control
2. **Audit Logging** - Comprehensive activity tracking
3. **Security Middleware** - API-level validation and protection
4. **Input Sanitization** - Protection against malicious input

## 1. Row Level Security (RLS) Policies

### Implementation Files
- `database/partner-rls-security-policies.sql` - Complete RLS policy setup

### Key Features

#### Partner Data Isolation
- Partners can only access their own data
- Complete isolation between different partners
- Admin override capabilities for management

#### Table-Level Policies

**Partners Table:**
```sql
-- Partners can view their own profile only
CREATE POLICY "partners_view_own_profile" ON partners
    FOR SELECT USING (user_id = auth.uid());

-- Partners can update their own profile (limited fields)
CREATE POLICY "partners_update_own_profile" ON partners
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (verification_status = OLD.verification_status);
```

**Lofts Table:**
```sql
-- Partners can only view their own properties
CREATE POLICY "lofts_partner_view_own_properties" ON lofts
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners 
            WHERE user_id = auth.uid() 
            AND verification_status = 'approved'
        )
    );
```

**Reservations Table:**
```sql
-- Partners can only view reservations for their properties
CREATE POLICY "reservations_partner_view_own_property_bookings" ON reservations
    FOR SELECT USING (
        loft_id IN (
            SELECT l.id FROM lofts l
            JOIN partners p ON l.partner_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.verification_status = 'approved'
        )
    );
```

### Security Validation Functions

```sql
-- Function to validate partner ownership of a loft
CREATE OR REPLACE FUNCTION partner_owns_loft(loft_id UUID, partner_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN;

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN;

-- Function to check if user is an approved partner
CREATE OR REPLACE FUNCTION is_approved_partner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN;
```

## 2. Audit Logging System

### Implementation Files
- `database/partner-audit-logging-system.sql` - Complete audit system

### Audit Tables

#### Main Audit Log
```sql
CREATE TABLE partner_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    partner_id UUID REFERENCES partners(id),
    admin_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Property Access Log
```sql
CREATE TABLE partner_property_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    partner_id UUID REFERENCES partners(id),
    loft_id UUID REFERENCES lofts(id),
    access_type TEXT NOT NULL,
    access_granted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Admin Action Log
```sql
CREATE TABLE partner_admin_action_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id),
    target_partner_id UUID REFERENCES partners(id),
    action_type TEXT NOT NULL,
    action_result TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automatic Triggers

The system includes automatic triggers that log all changes to partner-related data:

```sql
-- Audit trigger for partners table
CREATE TRIGGER partners_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON partners
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Audit trigger for partner validation requests
CREATE TRIGGER partner_validation_requests_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON partner_validation_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Enhanced Management Functions

```sql
-- Enhanced approve partner function with audit logging
CREATE OR REPLACE FUNCTION approve_partner_with_audit(
    partner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN;

-- Enhanced reject partner function with audit logging
CREATE OR REPLACE FUNCTION reject_partner_with_audit(
    partner_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN;
```

## 3. Security Middleware

### Implementation Files
- `lib/middleware/partner-security.ts` - Core security middleware
- `lib/middleware/api-security-helpers.ts` - API route helpers

### Rate Limiting

The system implements comprehensive rate limiting:

```typescript
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'partner-login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again later'
  },
  'partner-dashboard': {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many dashboard requests, please slow down'
  }
};
```

### Input Validation

Comprehensive input validation using Zod schemas:

```typescript
export const partnerRegistrationSchema = z.object({
  personal_info: z.object({
    full_name: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Full name contains invalid characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]{8,20}$/, 'Invalid phone number format'),
    address: z.string().min(10, 'Address must be at least 10 characters')
  }),
  // ... more validation rules
});
```

### Security Validation

Multi-level security validation:

```typescript
export function validateAndSanitizeInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): SecurityValidationResult {
  // Zod validation
  const validatedData = schema.parse(data);
  
  // Additional security checks based on level
  if (securityLevel === 'high' || securityLevel === 'critical') {
    // Check for XSS patterns
    if (containsXSSPatterns(dataString)) {
      additionalErrors.push('Input contains potentially malicious content');
    }
    
    // Check for SQL injection patterns
    if (containsSQLInjectionPatterns(dataString)) {
      additionalErrors.push('Input contains potentially malicious SQL patterns');
    }
  }
}
```

## 4. API Route Security Helpers

### Usage Examples

#### Partner Dashboard Endpoint
```typescript
import { withPartnerDashboardSecurity } from '@/lib/middleware/api-security-helpers';

export const GET = withPartnerDashboardSecurity(async (request, context) => {
  const { partnerId, supabase } = getPartnerContext(context);
  
  // Your endpoint logic here
  const dashboardData = await getDashboardData(supabase, partnerId);
  
  return createSuccessResponse(dashboardData);
});
```

#### Partner Property Details Endpoint
```typescript
import { withPartnerPropertyDetailsSecurity } from '@/lib/middleware/api-security-helpers';

export const GET = withPartnerPropertyDetailsSecurity(async (request, context) => {
  const { partnerId, supabase } = getPartnerContext(context);
  const { loftId } = context.params;
  
  // Ownership is automatically validated by the middleware
  const propertyDetails = await getPropertyDetails(supabase, loftId);
  
  return createSuccessResponse(propertyDetails);
});
```

#### Admin Partner Validation Endpoint
```typescript
import { withAdminPartnerValidationSecurity } from '@/lib/middleware/api-security-helpers';

export const POST = withAdminPartnerValidationSecurity(async (request, context) => {
  const { userId, supabase } = getPartnerContext(context);
  const body = await request.json();
  
  // Input is automatically validated by the middleware
  const result = await processPartnerValidation(supabase, body, userId);
  
  return createSuccessResponse(result);
});
```

## 5. Input Sanitization

### Implementation File
- `lib/utils/input-sanitization.ts` - Comprehensive sanitization utilities

### Sanitization Functions

```typescript
// HTML sanitization
export function sanitizeHtml(input: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}): string;

// Text sanitization
export function sanitizeText(input: string, options?: {
  maxLength?: number;
  allowSpecialChars?: boolean;
  allowNumbers?: boolean;
  allowSpaces?: boolean;
}): string;

// Email sanitization
export function sanitizeEmail(input: string): string;

// Phone number sanitization
export function sanitizePhoneNumber(input: string): string;
```

### Partner-Specific Sanitization

```typescript
// Sanitize partner registration data
export function sanitizePartnerRegistrationData(data: any): any {
  return {
    personal_info: {
      full_name: sanitizeText(data.personal_info?.full_name, {
        allowSpaces: true,
        allowSpecialChars: false,
        maxLength: 100
      }),
      email: sanitizeEmail(data.personal_info?.email),
      phone: sanitizePhoneNumber(data.personal_info?.phone),
      // ... more sanitization
    }
  };
}
```

## 6. Security Best Practices

### Database Security
1. **Always use RLS policies** - Never rely solely on application-level security
2. **Principle of least privilege** - Grant only necessary permissions
3. **Audit everything** - Log all data access and modifications
4. **Regular security reviews** - Periodically review and update policies

### API Security
1. **Rate limiting** - Implement appropriate rate limits for all endpoints
2. **Input validation** - Validate and sanitize all input data
3. **Authentication verification** - Always verify user authentication and authorization
4. **Error handling** - Don't expose sensitive information in error messages

### Middleware Security
1. **Defense in depth** - Implement multiple security layers
2. **Fail securely** - Default to denying access when in doubt
3. **Log security events** - Track all security-related activities
4. **Regular updates** - Keep security libraries and dependencies updated

## 7. Deployment and Monitoring

### Database Setup
1. Run the RLS policies script: `database/partner-rls-security-policies.sql`
2. Run the audit logging script: `database/partner-audit-logging-system.sql`
3. Verify all policies are active and working correctly

### Application Setup
1. Ensure all API routes use appropriate security middleware
2. Configure rate limiting parameters for your environment
3. Set up monitoring for security events and audit logs

### Monitoring
1. **Monitor audit logs** - Regularly review audit logs for suspicious activity
2. **Track rate limiting** - Monitor rate limit violations
3. **Security alerts** - Set up alerts for critical security events
4. **Performance monitoring** - Ensure security measures don't impact performance

## 8. Testing Security Implementation

### RLS Policy Testing
```sql
-- Test partner data isolation
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "partner-user-id"}';

-- Should only return partner's own data
SELECT * FROM partners;
SELECT * FROM lofts;
SELECT * FROM reservations;
```

### API Security Testing
```typescript
// Test rate limiting
for (let i = 0; i < 10; i++) {
  await fetch('/api/partner/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
  });
}
// Should return 429 after 5 attempts

// Test input validation
await fetch('/api/partner/register', {
  method: 'POST',
  body: JSON.stringify({
    personal_info: {
      full_name: '<script>alert("xss")</script>',
      email: 'invalid-email'
    }
  })
});
// Should return validation errors
```

## 9. Troubleshooting

### Common Issues

1. **RLS policies not working**
   - Verify policies are enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
   - Check policy conditions and user context

2. **Rate limiting too restrictive**
   - Adjust rate limit configurations in `partner-security.ts`
   - Consider different limits for different user types

3. **Input validation errors**
   - Check Zod schema definitions
   - Verify sanitization functions are working correctly

4. **Audit logs not being created**
   - Verify triggers are installed and active
   - Check function permissions and execution

### Debug Commands

```sql
-- Check active RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('partners', 'lofts', 'reservations');

-- Check audit log entries
SELECT * FROM partner_audit_log 
ORDER BY created_at DESC 
LIMIT 10;

-- Check rate limit store (if using database storage)
SELECT * FROM rate_limit_store 
WHERE key LIKE 'partner-%';
```

This comprehensive security implementation provides enterprise-level protection for the Partner Dashboard System while maintaining usability and performance.