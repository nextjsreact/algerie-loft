# Partner Security Implementation Guide

## Overview

This document describes the comprehensive security implementation for the partner dashboard, including data isolation, authentication checks, and audit logging.

## Components

### 1. Partner Data Isolation Service

**Location:** `lib/security/partner-data-isolation.ts`

The `PartnerDataIsolation` class provides methods to ensure partners can only access their own data.

#### Key Features:

- **Property Ownership Verification**: Verifies that a property belongs to a specific partner
- **Reservation Access Verification**: Ensures partners can only access reservations for their properties
- **Data Fetching with Isolation**: Provides methods to fetch properties and reservations with automatic filtering
- **RLS Policy Verification**: Tests that Row Level Security policies are correctly applied
- **Audit Logging**: Logs all data access attempts for security monitoring

#### Usage Example:

```typescript
import { PartnerDataIsolation } from '@/lib/security/partner-data-isolation';

// Verify property ownership
const ownershipResult = await PartnerDataIsolation.verifyPropertyOwnership(
  propertyId,
  partnerId,
  supabase
);

if (!ownershipResult.success) {
  // Handle access denied
  return { error: ownershipResult.error };
}

// Get partner properties with isolation
const propertiesResult = await PartnerDataIsolation.getPartnerProperties(
  partnerId,
  { status: 'available', limit: 10 },
  supabase
);
```

### 2. Partner Authentication Guard

**Location:** `lib/security/partner-auth-guard.ts`

The `PartnerAuthGuard` class provides comprehensive authentication and authorization checks.

#### Key Features:

- **Session Verification**: Checks if user has a valid session
- **Role Verification**: Ensures user has partner role
- **Status Verification**: Checks partner verification status (active, pending, etc.)
- **Session Expiration Handling**: Detects and handles expired sessions
- **Session Refresh**: Automatically refreshes sessions that are about to expire
- **Secure Logout**: Clears sensitive data on logout

#### Usage Example:

```typescript
import { requirePartner } from '@/lib/security/partner-auth-guard';

// In a server component
export default async function PartnerDashboardPage({ params }) {
  // This will redirect if authentication fails
  const { session, partnerId, partnerStatus } = await requirePartner(
    params.locale,
    {
      requireActive: true,
      allowedStatuses: ['active']
    }
  );

  // Continue with authenticated partner
}
```

### 3. Client-Side Authentication Hook

**Location:** `hooks/use-partner-auth.ts`

The `usePartnerAuth` hook provides client-side authentication state management.

#### Key Features:

- **Authentication State**: Tracks authentication status, session, and partner info
- **Automatic Session Refresh**: Refreshes session every 15 minutes
- **Expiration Detection**: Detects sessions about to expire and refreshes them
- **Logout Handling**: Provides logout functionality with cleanup

#### Usage Example:

```typescript
'use client';

import { usePartnerAuth } from '@/hooks/use-partner-auth';

export function PartnerDashboard() {
  const {
    isAuthenticated,
    isLoading,
    session,
    partnerId,
    partnerStatus,
    logout
  } = usePartnerAuth({
    locale: 'fr',
    requireActive: true
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect automatically
  }

  return <DashboardContent />;
}
```

### 4. Authentication API Endpoints

#### Verify Endpoint
**Location:** `app/api/partner/auth/verify/route.ts`

Verifies partner authentication and returns session information.

```typescript
GET /api/partner/auth/verify?locale=fr
```

Response:
```json
{
  "success": true,
  "session": { ... },
  "partnerId": "uuid",
  "partnerStatus": "active"
}
```

#### Refresh Endpoint
**Location:** `app/api/partner/auth/refresh/route.ts`

Refreshes the partner's authentication session.

```typescript
POST /api/partner/auth/refresh
```

#### Logout Endpoint
**Location:** `app/api/partner/auth/logout/route.ts`

Handles partner logout and clears sensitive data.

```typescript
POST /api/partner/auth/logout
```

### 5. Audit Logging System

**Location:** `database/partner-data-access-logs.sql`

Database schema for logging all partner data access attempts.

#### Features:

- **Comprehensive Logging**: Logs all data access attempts with details
- **Security Monitoring**: Detects suspicious access patterns
- **Data Retention**: Automatically cleans logs older than 90 days
- **Access Statistics**: Provides statistics on partner data access

#### Database Functions:

```sql
-- Get access statistics for a partner
SELECT * FROM get_partner_access_stats('partner-uuid', 30);

-- Detect suspicious access patterns
SELECT * FROM detect_suspicious_partner_access('partner-uuid', 5);

-- Clean old logs
SELECT cleanup_old_partner_access_logs();
```

## Security Best Practices

### 1. Always Verify Ownership

Before allowing any operation on a resource, verify that the partner owns it:

```typescript
// ❌ BAD: Direct access without verification
const property = await supabase
  .from('lofts')
  .select('*')
  .eq('id', propertyId)
  .single();

// ✅ GOOD: Verify ownership first
const ownershipResult = await PartnerDataIsolation.verifyPropertyOwnership(
  propertyId,
  partnerId,
  supabase
);

if (!ownershipResult.success) {
  return { error: 'Access denied' };
}
```

### 2. Use Data Isolation Methods

Always use the data isolation service methods instead of direct queries:

```typescript
// ❌ BAD: Direct query without isolation
const properties = await supabase
  .from('lofts')
  .select('*')
  .eq('partner_id', partnerId);

// ✅ GOOD: Use isolation service
const propertiesResult = await PartnerDataIsolation.getPartnerProperties(
  partnerId,
  {},
  supabase
);
```

### 3. Check Authentication on Every Page Load

Use the authentication guard in all partner pages:

```typescript
// Server component
export default async function PartnerPage({ params }) {
  await requirePartner(params.locale);
  // ... rest of component
}

// Client component
export function PartnerClientPage() {
  const { isAuthenticated, isLoading } = usePartnerAuth();
  
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return null;
  
  // ... rest of component
}
```

### 4. Handle Session Expiration Gracefully

Always provide clear feedback when sessions expire:

```typescript
const { isAuthenticated, error } = usePartnerAuth({
  onSessionExpired: () => {
    toast.error('Your session has expired. Please log in again.');
  }
});
```

### 5. Clear Sensitive Data on Logout

Always use the proper logout methods that clear sensitive data:

```typescript
// ❌ BAD: Direct sign out
await supabase.auth.signOut();

// ✅ GOOD: Use auth guard logout
await PartnerAuthGuard.clearSensitiveData();
```

## Testing

### Running Security Tests

A comprehensive test script is provided to verify security implementation:

```bash
# Run security tests
npx ts-node scripts/test-partner-security.ts
```

The test script verifies:
- RLS policies are correctly configured
- Property ownership verification works
- Reservation access verification works
- Data isolation between partners is enforced
- Audit logging is functional

### Manual Testing Checklist

- [ ] Partner can only see their own properties
- [ ] Partner cannot access other partners' properties
- [ ] Partner can only see reservations for their properties
- [ ] Session expires after 24 hours
- [ ] Session is refreshed automatically
- [ ] Logout clears all sensitive data
- [ ] Unauthorized access is properly blocked
- [ ] All data access is logged in audit table

## Database Setup

To set up the audit logging system, run the SQL migration:

```bash
# Apply the migration
psql -h your-db-host -U your-user -d your-database -f database/partner-data-access-logs.sql
```

Or use Supabase dashboard to run the SQL script.

## Monitoring and Alerts

### Access Log Monitoring

Monitor the `partner_data_access_logs` table for:

1. **Failed Access Attempts**: High number of failed attempts may indicate an attack
2. **Unusual Access Patterns**: Accessing many different resources quickly
3. **Cross-Partner Access Attempts**: Attempts to access other partners' data

### Setting Up Alerts

Create alerts for suspicious patterns:

```sql
-- Alert on high failed access rate
SELECT partner_id, COUNT(*) as failed_attempts
FROM partner_data_access_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '5 minutes'
GROUP BY partner_id
HAVING COUNT(*) >= 10;
```

## Compliance

This implementation helps meet compliance requirements for:

- **GDPR**: Audit logging and data access tracking
- **SOC 2**: Access controls and monitoring
- **ISO 27001**: Information security management

## Troubleshooting

### Issue: Partner can see other partners' data

**Solution**: Verify RLS policies are enabled and correctly configured:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('lofts', 'reservations');

-- Should return rowsecurity = true for both tables
```

### Issue: Session expires too quickly

**Solution**: Check session refresh is working:

```typescript
// Verify refresh is being called
const { refreshAuth } = usePartnerAuth();
await refreshAuth();
```

### Issue: Audit logs not being created

**Solution**: Verify service role key is configured:

```bash
# Check environment variable
echo $SUPABASE_SERVICE_ROLE_KEY
```

## Future Enhancements

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **IP Whitelisting**: Allow partners to whitelist IP addresses
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Anomaly Detection**: ML-based detection of unusual access patterns
5. **Real-time Alerts**: Push notifications for security events

## Support

For security issues or questions, contact the security team or create a ticket in the issue tracker.

**Important**: Never share security-related information in public channels.
