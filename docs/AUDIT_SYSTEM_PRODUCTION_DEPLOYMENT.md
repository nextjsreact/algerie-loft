# Audit System Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the audit system to production. The audit system provides comprehensive tracking of all CRUD operations on critical entities (transactions, tasks, reservations, lofts).

## Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] Production Supabase project is configured
- [ ] Environment variables are set:
  - `NEXT_PUBLIC_SUPABASE_URL_PROD` or `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY_PROD` or `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Database backup is created
- [ ] Maintenance window is scheduled (recommended: 30 minutes)

### 2. Code Deployment

- [ ] All audit system code is merged to main branch
- [ ] Application is built and tested in staging
- [ ] No breaking changes in the deployment

### 3. Database Preparation

- [ ] Current database schema is documented
- [ ] Migration rollback plan is prepared
- [ ] Database performance baseline is established

## Deployment Steps

### Step 1: Execute Deployment Script

Run the automated deployment script:

```bash
npm run deploy:audit-production
```

Or manually execute:

```bash
npx ts-node scripts/deploy-audit-system-production.ts
```

### Step 2: Manual Verification

After the automated deployment, perform these manual checks:

#### Database Verification

1. **Check Audit Schema**
   ```sql
   -- Verify audit schema exists
   SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'audit';
   
   -- Check audit_logs table structure
   \d audit.audit_logs
   
   -- Verify indexes
   SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'audit';
   ```

2. **Verify Triggers**
   ```sql
   -- Check all audit triggers
   SELECT trigger_name, event_object_table, action_timing, event_manipulation
   FROM information_schema.triggers 
   WHERE trigger_name LIKE 'audit_trigger_%'
   ORDER BY event_object_table;
   ```

3. **Test Trigger Functionality**
   ```sql
   -- Test with a safe transaction (will be rolled back)
   BEGIN;
   
   -- Insert a test record
   INSERT INTO transactions (id, amount, description, loft_id, created_by) 
   VALUES (gen_random_uuid(), 100.00, 'Test audit', 
           (SELECT id FROM lofts LIMIT 1), 
           (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));
   
   -- Check if audit log was created
   SELECT * FROM audit.audit_logs WHERE table_name = 'transactions' ORDER BY timestamp DESC LIMIT 1;
   
   -- Rollback the test
   ROLLBACK;
   ```

#### API Verification

1. **Test Audit Logs API**
   ```bash
   # Test with admin credentials
   curl -X GET "https://your-domain.com/api/audit/logs?limit=5" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Test Entity Audit History**
   ```bash
   # Test entity-specific audit history
   curl -X GET "https://your-domain.com/api/audit/entity/transactions/TRANSACTION_ID" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

#### UI Verification

1. **Admin Dashboard Access**
   - [ ] Navigate to `/admin/audit`
   - [ ] Verify audit logs are displayed
   - [ ] Test filtering and search functionality
   - [ ] Test export functionality

2. **Entity Detail Pages**
   - [ ] Check transaction detail page has audit tab
   - [ ] Check task detail page has audit tab
   - [ ] Check reservation detail page has audit tab
   - [ ] Check loft detail page has audit tab

### Step 3: Performance Monitoring Setup

1. **Database Performance**
   ```sql
   -- Monitor audit table size
   SELECT 
       schemaname,
       tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       pg_stat_get_tuples_returned(c.oid) as rows_read,
       pg_stat_get_tuples_inserted(c.oid) as rows_inserted
   FROM pg_tables pt
   JOIN pg_class c ON c.relname = pt.tablename
   WHERE schemaname = 'audit';
   ```

2. **Index Performance**
   ```sql
   -- Check index usage
   SELECT 
       schemaname,
       tablename,
       indexname,
       idx_tup_read,
       idx_tup_fetch
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'audit'
   ORDER BY idx_tup_read DESC;
   ```

### Step 4: Security Configuration

1. **Row Level Security (RLS)**
   ```sql
   -- Verify RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'audit' AND tablename = 'audit_logs';
   
   -- Check RLS policies
   SELECT policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'audit' AND tablename = 'audit_logs';
   ```

2. **User Permissions**
   ```sql
   -- Verify user role distribution
   SELECT role, COUNT(*) as user_count 
   FROM profiles 
   GROUP BY role 
   ORDER BY user_count DESC;
   ```

## Post-Deployment Tasks

### 1. User Training

- [ ] Train administrators on audit dashboard usage
- [ ] Document audit access procedures
- [ ] Create user guides for audit history viewing

### 2. Monitoring Setup

- [ ] Configure audit log size alerts
- [ ] Set up performance monitoring
- [ ] Create audit access monitoring dashboards

### 3. Maintenance Procedures

- [ ] Schedule regular audit log archiving
- [ ] Set up automated integrity checks
- [ ] Configure retention policy enforcement

## Rollback Procedures

If issues are encountered during deployment:

### 1. Database Rollback

```sql
-- Disable audit triggers (emergency only)
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks;
DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations;
DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts;

-- Remove audit schema (complete rollback)
DROP SCHEMA IF EXISTS audit CASCADE;
```

### 2. Application Rollback

- Revert to previous application version
- Remove audit UI components from navigation
- Disable audit API endpoints

## Troubleshooting

### Common Issues

1. **Trigger Creation Fails**
   - Check table permissions
   - Verify audit schema exists
   - Review function dependencies

2. **RLS Policy Issues**
   - Verify user roles are correctly set
   - Check policy syntax
   - Test with different user roles

3. **Performance Issues**
   - Monitor index usage
   - Check query execution plans
   - Consider partitioning for large datasets

### Support Contacts

- Database Administrator: [DBA_EMAIL]
- System Administrator: [SYSADMIN_EMAIL]
- Development Team: [DEV_TEAM_EMAIL]

## Success Criteria

The deployment is considered successful when:

- [ ] All database schema changes are applied without errors
- [ ] Audit triggers are active on all core tables
- [ ] API endpoints respond correctly with proper authentication
- [ ] UI components display audit information correctly
- [ ] Performance metrics are within acceptable ranges
- [ ] Security policies are enforced correctly

## Maintenance Schedule

### Daily
- Monitor audit log growth
- Check for failed audit operations

### Weekly
- Review audit access patterns
- Verify system performance

### Monthly
- Archive old audit logs
- Run integrity checks
- Review security policies

### Quarterly
- Audit system performance review
- Update retention policies
- Security audit of audit system

---

**Deployment Date:** [TO_BE_FILLED]  
**Deployed By:** [TO_BE_FILLED]  
**Version:** [TO_BE_FILLED]  
**Environment:** Production