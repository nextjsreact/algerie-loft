# Partner Dashboard System Deployment Guide

## Overview

This guide covers the deployment and monitoring setup for the Partner Dashboard System, including staging environment setup, production deployment, and monitoring configuration.

## Prerequisites

- Node.js 18+ installed
- Supabase project configured
- Environment variables properly set
- Database schema deployed
- SSL certificates configured

## Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Email Configuration (for notifications)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id

# Partner System Configuration
PARTNER_REGISTRATION_ENABLED=true
AUTO_APPROVAL_ENABLED=false
MAX_PROPERTIES_PER_PARTNER=50
DOCUMENT_UPLOAD_MAX_SIZE=10485760
```

### Environment-Specific Configurations

#### Staging Environment
```bash
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
NODE_ENV=staging
PARTNER_REGISTRATION_ENABLED=true
AUTO_APPROVAL_ENABLED=true  # For testing
```

#### Production Environment
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
PARTNER_REGISTRATION_ENABLED=true
AUTO_APPROVAL_ENABLED=false  # Require manual approval
```

## Database Deployment

### 1. Schema Migration

Run the following SQL scripts in order:

```sql
-- 1. Create partners table (if not exists)
\i database/partners-schema.sql

-- 2. Create partner validation requests table
\i database/partner-validation-requests-schema.sql

-- 3. Set up Row Level Security policies
\i database/partner-rls-policies.sql

-- 4. Create audit triggers
\i database/partner-audit-triggers.sql

-- 5. Create indexes for performance
\i database/partner-indexes.sql
```

### 2. Data Migration (if upgrading)

```sql
-- Migrate existing data if upgrading from previous version
-- This would include any data transformation scripts
```

### 3. Verify Database Setup

```bash
# Run database verification script
npm run verify-database
```

## Application Deployment

### Staging Deployment

1. **Build Application**
   ```bash
   npm run build
   npm run test
   ```

2. **Deploy to Staging**
   ```bash
   # Using Vercel
   vercel --env staging

   # Or using Docker
   docker build -t partner-system-staging .
   docker run -p 3000:3000 --env-file .env.staging partner-system-staging
   ```

3. **Run Staging Tests**
   ```bash
   npm run test:staging
   npm run test:e2e:staging
   ```

### Production Deployment

1. **Pre-deployment Checklist**
   - [ ] All tests passing
   - [ ] Database migrations applied
   - [ ] Environment variables configured
   - [ ] SSL certificates valid
   - [ ] Monitoring configured
   - [ ] Backup procedures in place

2. **Deploy Application**
   ```bash
   # Using Vercel
   vercel --prod

   # Or using Docker
   docker build -t partner-system-prod .
   docker run -p 3000:3000 --env-file .env.production partner-system-prod
   ```

3. **Post-deployment Verification**
   ```bash
   # Run health checks
   curl https://your-domain.com/api/health
   
   # Verify partner system endpoints
   curl https://your-domain.com/api/partner/health
   
   # Run smoke tests
   npm run test:smoke
   ```

## Monitoring Setup

### 1. Application Performance Monitoring

#### Sentry Configuration
```javascript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Partner system specific tags
  initialScope: {
    tags: {
      component: "partner-system"
    }
  },
  
  // Custom error filtering
  beforeSend(event) {
    // Filter out partner-specific sensitive data
    if (event.extra?.partnerData) {
      delete event.extra.partnerData.verification_documents;
      delete event.extra.partnerData.bank_details;
    }
    return event;
  }
});
```

#### Custom Metrics
```typescript
// lib/monitoring/partner-metrics.ts
export class PartnerMetrics {
  static trackPartnerRegistration(partnerId: string) {
    // Track partner registration events
    analytics.track('partner_registered', {
      partner_id: partnerId,
      timestamp: new Date().toISOString()
    });
  }
  
  static trackPartnerApproval(partnerId: string, approved: boolean) {
    analytics.track('partner_approval', {
      partner_id: partnerId,
      approved,
      timestamp: new Date().toISOString()
    });
  }
  
  static trackDashboardAccess(partnerId: string) {
    analytics.track('partner_dashboard_access', {
      partner_id: partnerId,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Database Monitoring

#### Performance Monitoring Queries
```sql
-- Monitor partner system performance
CREATE OR REPLACE VIEW partner_system_metrics AS
SELECT 
  'partner_registrations_today' as metric,
  COUNT(*) as value
FROM partners 
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT 
  'pending_validations' as metric,
  COUNT(*) as value
FROM partner_validation_requests 
WHERE status = 'pending'

UNION ALL

SELECT 
  'active_partners' as metric,
  COUNT(*) as value
FROM partners 
WHERE verification_status = 'approved';
```

#### Automated Alerts
```sql
-- Create function to check system health
CREATE OR REPLACE FUNCTION check_partner_system_health()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
  -- Check for pending validations older than 7 days
  RETURN QUERY
  SELECT 
    'old_pending_validations'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
    CONCAT(COUNT(*), ' validations pending for more than 7 days')::TEXT
  FROM partner_validation_requests 
  WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days';
  
  -- Check for failed partner logins
  RETURN QUERY
  SELECT 
    'partner_login_failures'::TEXT,
    CASE WHEN COUNT(*) > 10 THEN 'WARNING' ELSE 'OK' END::TEXT,
    CONCAT(COUNT(*), ' failed login attempts in last hour')::TEXT
  FROM audit_logs 
  WHERE table_name = 'auth_attempts' 
    AND action = 'FAILED_LOGIN'
    AND timestamp > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

### 3. Business Metrics Dashboard

#### Key Performance Indicators
```typescript
// lib/monitoring/partner-kpis.ts
export interface PartnerSystemKPIs {
  // Registration Metrics
  daily_registrations: number;
  weekly_registrations: number;
  registration_conversion_rate: number;
  
  // Approval Metrics
  average_approval_time_hours: number;
  approval_rate: number;
  pending_validations: number;
  
  // Usage Metrics
  active_partners: number;
  daily_active_partners: number;
  dashboard_usage_rate: number;
  
  // Revenue Metrics
  total_partner_revenue: number;
  average_revenue_per_partner: number;
  revenue_growth_rate: number;
  
  // System Health
  api_response_time_ms: number;
  error_rate: number;
  uptime_percentage: number;
}

export class PartnerKPICollector {
  static async collectKPIs(): Promise<PartnerSystemKPIs> {
    // Implementation to collect all KPIs
    // This would query the database and external services
  }
}
```

### 4. Alerting Configuration

#### Critical Alerts
```yaml
# alerts.yml
alerts:
  - name: "Partner System Down"
    condition: "uptime < 99%"
    severity: "critical"
    channels: ["email", "slack", "pagerduty"]
    
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    severity: "warning"
    channels: ["email", "slack"]
    
  - name: "Slow API Response"
    condition: "api_response_time > 2000ms"
    severity: "warning"
    channels: ["slack"]
    
  - name: "Old Pending Validations"
    condition: "pending_validations_older_than_7_days > 0"
    severity: "info"
    channels: ["email"]
```

## Health Check Endpoints

### Application Health Check
```typescript
// app/api/health/route.ts
export async function GET() {
  const healthChecks = {
    database: await checkDatabaseConnection(),
    partner_system: await checkPartnerSystemHealth(),
    external_services: await checkExternalServices(),
    timestamp: new Date().toISOString()
  };
  
  const isHealthy = Object.values(healthChecks).every(
    check => check !== false && check?.status !== 'error'
  );
  
  return NextResponse.json(healthChecks, {
    status: isHealthy ? 200 : 503
  });
}
```

### Partner System Specific Health Check
```typescript
// app/api/partner/health/route.ts
export async function GET() {
  const partnerHealthChecks = {
    registration_api: await testPartnerRegistration(),
    dashboard_api: await testPartnerDashboard(),
    admin_api: await testAdminEndpoints(),
    database_policies: await testRLSPolicies(),
    integration_points: await testIntegrationPoints()
  };
  
  return NextResponse.json(partnerHealthChecks);
}
```

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
# backup-partner-data.sh

# Backup partner-specific tables
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --table=partners \
  --table=partner_validation_requests \
  --table=lofts \
  --table=reservations \
  --data-only \
  --file=partner-data-backup-$(date +%Y%m%d).sql

# Upload to secure storage
aws s3 cp partner-data-backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Recovery Procedures
```bash
#!/bin/bash
# restore-partner-data.sh

# Download backup from secure storage
aws s3 cp s3://your-backup-bucket/partner-data-backup-$1.sql ./

# Restore data
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f partner-data-backup-$1.sql
```

## Rollback Procedures

### Application Rollback
```bash
#!/bin/bash
# rollback-partner-system.sh

echo "Rolling back partner system deployment..."

# Rollback application
vercel rollback --yes

# Verify rollback
curl -f https://your-domain.com/api/health || {
  echo "Rollback verification failed"
  exit 1
}

echo "Rollback completed successfully"
```

### Database Rollback
```sql
-- rollback-partner-schema.sql
-- This would contain the reverse of any schema changes
-- Always test rollback procedures in staging first
```

## Performance Optimization

### Database Optimization
```sql
-- Optimize partner system queries
ANALYZE partners;
ANALYZE partner_validation_requests;
ANALYZE lofts;
ANALYZE reservations;

-- Update statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;
```

### Application Optimization
```typescript
// Enable caching for partner data
const partnerCache = new Map();

export function getCachedPartnerData(partnerId: string) {
  const cacheKey = `partner:${partnerId}`;
  const cached = partnerCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.data;
  }
  
  // Fetch fresh data and cache it
  const freshData = fetchPartnerData(partnerId);
  partnerCache.set(cacheKey, {
    data: freshData,
    timestamp: Date.now()
  });
  
  return freshData;
}
```

## Security Considerations

### Production Security Checklist
- [ ] All environment variables secured
- [ ] Database connections encrypted
- [ ] API endpoints rate limited
- [ ] Partner data properly isolated
- [ ] Audit logging enabled
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled

### Security Monitoring
```typescript
// lib/security/partner-security-monitor.ts
export class PartnerSecurityMonitor {
  static logSuspiciousActivity(event: SecurityEvent) {
    // Log security events for partner system
    console.warn('Security Event:', {
      type: event.type,
      partnerId: event.partnerId,
      timestamp: new Date().toISOString(),
      details: event.details
    });
    
    // Send to security monitoring service
    securityService.reportEvent(event);
  }
}
```

## Maintenance Procedures

### Regular Maintenance Tasks
```bash
#!/bin/bash
# partner-system-maintenance.sh

# Clean up old validation requests
psql -c "DELETE FROM partner_validation_requests WHERE created_at < NOW() - INTERVAL '90 days' AND status != 'pending';"

# Archive old audit logs
psql -c "INSERT INTO audit_logs_archive SELECT * FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 year';"
psql -c "DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 year';"

# Update statistics
psql -c "ANALYZE;"

# Check system health
curl -f https://your-domain.com/api/partner/health
```

### Scheduled Maintenance Windows
- **Weekly**: Database optimization and cleanup
- **Monthly**: Security updates and patches
- **Quarterly**: Performance review and optimization
- **Annually**: Disaster recovery testing

## Troubleshooting Guide

### Common Issues

#### Partner Registration Failures
```bash
# Check partner registration logs
grep "partner registration" /var/log/application.log

# Verify database connectivity
psql -h $DB_HOST -U $DB_USER -c "SELECT 1;"

# Test email service
curl -X POST /api/test-email
```

#### Dashboard Loading Issues
```bash
# Check dashboard API performance
curl -w "@curl-format.txt" https://your-domain.com/api/partner/dashboard

# Monitor database queries
SELECT query, calls, total_time FROM pg_stat_statements WHERE query LIKE '%partner%';
```

#### Integration Problems
```bash
# Test integration endpoints
curl https://your-domain.com/api/integration/partner-system?action=check-compatibility

# Verify RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename IN ('partners', 'lofts', 'reservations');"
```

This deployment guide provides comprehensive instructions for deploying and monitoring the Partner Dashboard System in both staging and production environments.