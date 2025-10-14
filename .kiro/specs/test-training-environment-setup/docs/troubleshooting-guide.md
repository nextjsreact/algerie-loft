# Troubleshooting Guide - Environment Management System

## Overview

This comprehensive troubleshooting guide helps diagnose and resolve common issues with the Test/Training Environment Setup System. Issues are organized by category with step-by-step resolution procedures.

## Quick Diagnostic Commands

Before diving into specific issues, run these diagnostic commands to get an overview of system health:

```bash
# Check overall system status
npm run system:status --all

# Run comprehensive health check
npm run health:check --environment=all --detailed

# Check recent operation logs
npm run logs --recent --level=error

# Verify environment configurations
npm run config:verify --all-environments
```

## Connection and Authentication Issues

### Issue: Cannot Connect to Database

**Symptoms:**
- Connection timeout errors
- Authentication failed messages
- "Database not found" errors

**Diagnostic Steps:**
```bash
# Test database connectivity
npm run test:connection --environment=<env-name>

# Verify credentials
npm run config:verify --environment=<env-name> --check-credentials

# Check network connectivity
npm run network:test --target=<supabase-url>
```

**Resolution Steps:**

1. **Verify Environment Configuration**
   ```bash
   # Check environment variables
   npm run config:show --environment=<env-name>
   
   # Validate Supabase credentials
   npm run validate:credentials --environment=<env-name>
   ```

2. **Test Network Connectivity**
   ```bash
   # Test Supabase endpoint
   curl -I <SUPABASE_URL>/rest/v1/
   
   # Check DNS resolution
   nslookup <supabase-project-id>.supabase.co
   ```

3. **Verify Database Permissions**
   ```bash
   # Test service role permissions
   npm run test:permissions --environment=<env-name> --role=service

   # Check RLS policies
   npm run check:rls --environment=<env-name>
   ```

**Common Fixes:**
- Update expired Supabase credentials
- Check firewall/proxy settings
- Verify environment variable names and values
- Ensure service role has necessary permissions

### Issue: Production Safety Blocks Legitimate Operations

**Symptoms:**
- "Production write operation blocked" errors
- Safety guard preventing necessary operations
- Read-only enforcement too restrictive

**Diagnostic Steps:**
```bash
# Check safety guard status
npm run safety:status --environment=production

# Review safety logs
npm run safety:logs --timeframe=1h

# Verify environment type detection
npm run environment:detect --environment=<env-name>
```

**Resolution Steps:**

1. **Verify Environment Type**
   ```bash
   # Confirm environment classification
   npm run environment:verify --environment=<env-name>
   
   # Update environment type if incorrect
   npm run environment:set-type --environment=<env-name> --type=<correct-type>
   ```

2. **Review Safety Configuration**
   ```bash
   # Check safety settings
   npm run safety:config --show
   
   # Temporarily disable specific safety checks (use with extreme caution)
   npm run safety:disable --check=<check-name> --temporary --duration=1h
   ```

3. **Emergency Override (Admin Only)**
   ```bash
   # Emergency override for critical operations
   npm run safety:override --operation=<operation-id> --admin-confirm --reason="<reason>"
   ```

## Clone Operation Issues

### Issue: Clone Operation Fails or Hangs

**Symptoms:**
- Clone operations timeout
- Partial data cloning
- Operation stuck in "in_progress" status

**Diagnostic Steps:**
```bash
# Check operation status
npm run operation:status --id=<operation-id>

# View detailed operation logs
npm run operation:logs --id=<operation-id> --detailed

# Check resource usage
npm run monitor:resources --during-operation=<operation-id>
```

**Resolution Steps:**

1. **Identify Bottleneck**
   ```bash
   # Check which table is causing issues
   npm run operation:analyze --id=<operation-id>
   
   # Monitor database performance
   npm run db:performance --environment=<source-env> --environment=<target-env>
   ```

2. **Restart Failed Operation**
   ```bash
   # Stop current operation
   npm run operation:stop --id=<operation-id>
   
   # Resume from last checkpoint
   npm run operation:resume --id=<operation-id> --from-checkpoint
   
   # Or restart completely
   npm run clone --source=<source> --target=<target> --resume-failed=<operation-id>
   ```

3. **Optimize Clone Parameters**
   ```bash
   # Reduce batch size for large tables
   npm run clone --source=<source> --target=<target> --batch-size=500
   
   # Enable parallel processing
   npm run clone --source=<source> --target=<target> --parallel-tables=3
   
   # Skip problematic tables temporarily
   npm run clone --source=<source> --target=<target> --skip-tables=large_table_1,large_table_2
   ```

### Issue: Data Anonymization Failures

**Symptoms:**
- Anonymization rules not applied
- Data integrity violations after anonymization
- Incomplete anonymization reports

**Diagnostic Steps:**
```bash
# Check anonymization rules
npm run anonymize:rules --list --environment=<env-name>

# Verify anonymization completeness
npm run anonymize:verify --environment=<env-name> --detailed

# Check for data integrity issues
npm run validate:integrity --environment=<env-name> --post-anonymization
```

**Resolution Steps:**

1. **Fix Anonymization Rules**
   ```bash
   # Update problematic rules
   npm run anonymize:rules --update --table=<table-name> --column=<column-name>
   
   # Test rules on sample data
   npm run anonymize:test --rules=<rules-file> --sample-size=100
   ```

2. **Re-run Anonymization**
   ```bash
   # Re-anonymize specific tables
   npm run anonymize --environment=<env-name> --tables=<table-list> --force
   
   # Fix relationship preservation
   npm run anonymize:fix-relationships --environment=<env-name>
   ```

3. **Validate Results**
   ```bash
   # Comprehensive anonymization check
   npm run anonymize:audit --environment=<env-name> --generate-report
   
   # Check for remaining sensitive data
   npm run security:scan --environment=<env-name> --check-pii
   ```

## Schema and Migration Issues

### Issue: Schema Synchronization Failures

**Symptoms:**
- Migration scripts fail to apply
- Schema differences not detected correctly
- Dependency resolution errors

**Diagnostic Steps:**
```bash
# Compare schemas in detail
npm run schema:compare --source=<source-env> --target=<target-env> --detailed

# Check for schema conflicts
npm run schema:conflicts --environment=<target-env>

# Analyze dependencies
npm run schema:dependencies --environment=<target-env> --analyze
```

**Resolution Steps:**

1. **Resolve Schema Conflicts**
   ```bash
   # Identify conflicting objects
   npm run schema:conflicts --environment=<target-env> --list
   
   # Backup current schema
   npm run schema:backup --environment=<target-env> --output=schema_backup_$(date +%Y%m%d).sql
   
   # Resolve conflicts manually or automatically
   npm run schema:resolve-conflicts --environment=<target-env> --auto
   ```

2. **Fix Dependency Issues**
   ```bash
   # Reorder migration steps
   npm run schema:reorder --migration=<migration-file> --resolve-dependencies
   
   # Apply migrations in correct order
   npm run schema:apply --environment=<target-env> --migration=<migration-file> --force-order
   ```

3. **Manual Schema Fixes**
   ```bash
   # Generate corrective migration
   npm run schema:generate-fix --source=<source-env> --target=<target-env> --output=fix_migration.sql
   
   # Apply manual fixes
   npm run schema:apply --environment=<target-env> --migration=fix_migration.sql --manual-review
   ```

### Issue: Missing or Corrupted Database Objects

**Symptoms:**
- Functions or triggers missing after migration
- RLS policies not applied correctly
- Indexes missing or incorrect

**Diagnostic Steps:**
```bash
# Check for missing objects
npm run schema:check-missing --environment=<env-name> --compare-to=production

# Verify function definitions
npm run schema:verify-functions --environment=<env-name>

# Check trigger functionality
npm run schema:test-triggers --environment=<env-name>
```

**Resolution Steps:**

1. **Restore Missing Objects**
   ```bash
   # Restore functions from production
   npm run schema:restore-functions --source=production --target=<env-name>
   
   # Recreate missing triggers
   npm run schema:restore-triggers --source=production --target=<env-name>
   
   # Restore RLS policies
   npm run schema:restore-policies --source=production --target=<env-name>
   ```

2. **Verify Object Functionality**
   ```bash
   # Test restored functions
   npm run test:functions --environment=<env-name>
   
   # Test trigger functionality
   npm run test:triggers --environment=<env-name>
   
   # Verify RLS policies
   npm run test:rls --environment=<env-name>
   ```

## Performance Issues

### Issue: Slow Clone Operations

**Symptoms:**
- Clone operations taking excessive time
- High CPU or memory usage during cloning
- Database timeouts during large table transfers

**Diagnostic Steps:**
```bash
# Monitor operation performance
npm run monitor:operation --id=<operation-id> --real-time

# Check database performance
npm run db:performance --environment=<source-env> --environment=<target-env>

# Analyze slow queries
npm run analyze:slow-queries --during-operation=<operation-id>
```

**Resolution Steps:**

1. **Optimize Clone Parameters**
   ```bash
   # Reduce batch size
   npm run config:set --key=clone.batchSize --value=1000
   
   # Increase parallel processing
   npm run config:set --key=clone.parallelTables --value=5
   
   # Enable compression
   npm run config:set --key=clone.compression --value=true
   ```

2. **Database Optimization**
   ```bash
   # Optimize source database
   npm run db:optimize --environment=<source-env> --for-reading
   
   # Optimize target database
   npm run db:optimize --environment=<target-env> --for-writing
   
   # Update database statistics
   npm run db:analyze --environment=<source-env>
   ```

3. **Resource Management**
   ```bash
   # Increase memory allocation
   export NODE_OPTIONS="--max-old-space-size=8192"
   
   # Use streaming for large tables
   npm run clone --source=<source> --target=<target> --stream-large-tables
   ```

### Issue: High Memory Usage

**Symptoms:**
- Out of memory errors during operations
- System becoming unresponsive
- Memory leaks in long-running operations

**Diagnostic Steps:**
```bash
# Monitor memory usage
npm run monitor:memory --operation=<operation-id>

# Check for memory leaks
npm run analyze:memory --operation=<operation-id> --detect-leaks

# Profile memory usage
npm run profile:memory --operation=<operation-id>
```

**Resolution Steps:**

1. **Optimize Memory Usage**
   ```bash
   # Enable streaming mode
   npm run config:set --key=clone.streamingMode --value=true
   
   # Reduce batch sizes
   npm run config:set --key=clone.batchSize --value=500
   
   # Enable garbage collection optimization
   export NODE_OPTIONS="--optimize-for-size --gc-interval=100"
   ```

2. **Process Management**
   ```bash
   # Split large operations
   npm run clone --source=<source> --target=<target> --split-by-size --max-table-size=1GB
   
   # Use worker processes
   npm run clone --source=<source> --target=<target> --use-workers --worker-count=4
   ```

## Data Integrity Issues

### Issue: Data Corruption or Inconsistency

**Symptoms:**
- Foreign key constraint violations
- Missing related records
- Data format inconsistencies

**Diagnostic Steps:**
```bash
# Check data integrity
npm run validate:integrity --environment=<env-name> --comprehensive

# Check foreign key relationships
npm run validate:relationships --environment=<env-name>

# Compare data with source
npm run compare:data --source=<source-env> --target=<target-env> --sample-size=1000
```

**Resolution Steps:**

1. **Fix Data Relationships**
   ```bash
   # Repair foreign key relationships
   npm run repair:relationships --environment=<env-name> --auto-fix
   
   # Restore missing related records
   npm run restore:missing-records --environment=<env-name> --from=<source-env>
   ```

2. **Data Validation and Cleanup**
   ```bash
   # Clean up orphaned records
   npm run cleanup:orphaned --environment=<env-name>
   
   # Fix data format issues
   npm run fix:data-formats --environment=<env-name> --auto
   
   # Validate data consistency
   npm run validate:consistency --environment=<env-name> --fix-issues
   ```

### Issue: Incomplete Data Transfer

**Symptoms:**
- Missing records in target environment
- Partial table transfers
- Inconsistent record counts

**Diagnostic Steps:**
```bash
# Compare record counts
npm run compare:counts --source=<source-env> --target=<target-env>

# Check for missing data
npm run check:missing-data --source=<source-env> --target=<target-env>

# Analyze transfer completeness
npm run analyze:transfer --operation=<operation-id> --completeness-check
```

**Resolution Steps:**

1. **Identify Missing Data**
   ```bash
   # List missing records
   npm run list:missing --source=<source-env> --target=<target-env> --table=<table-name>
   
   # Generate missing data report
   npm run report:missing-data --source=<source-env> --target=<target-env> --output=missing_data.html
   ```

2. **Transfer Missing Data**
   ```bash
   # Transfer missing records
   npm run transfer:missing --source=<source-env> --target=<target-env> --table=<table-name>
   
   # Verify transfer completeness
   npm run verify:transfer --source=<source-env> --target=<target-env> --comprehensive
   ```

## Environment-Specific Issues

### Issue: Training Environment Problems

**Symptoms:**
- Training users cannot log in
- Training data not loading correctly
- Training scenarios not working

**Diagnostic Steps:**
```bash
# Check training environment health
npm run training:health-check --environment=training

# Verify training users
npm run training:verify-users --environment=training

# Check training data integrity
npm run training:verify-data --environment=training
```

**Resolution Steps:**

1. **Fix Training Users**
   ```bash
   # Reset training user passwords
   npm run training:reset-passwords --environment=training --all-users
   
   # Recreate training users
   npm run training:create-users --environment=training --reset-existing
   ```

2. **Restore Training Data**
   ```bash
   # Reset training environment
   npm run training:reset --environment=training --full-reset
   
   # Reload training scenarios
   npm run training:load-scenarios --environment=training --all-scenarios
   ```

### Issue: Test Environment Instability

**Symptoms:**
- Frequent connection drops
- Inconsistent test results
- Environment becoming corrupted

**Diagnostic Steps:**
```bash
# Check test environment stability
npm run test:stability --environment=test --duration=1h

# Monitor connection health
npm run monitor:connections --environment=test --continuous

# Check for resource exhaustion
npm run check:resources --environment=test --detailed
```

**Resolution Steps:**

1. **Stabilize Environment**
   ```bash
   # Restart environment services
   npm run environment:restart --environment=test
   
   # Clear temporary data
   npm run cleanup:temp-data --environment=test
   
   # Optimize database performance
   npm run db:optimize --environment=test --full-optimization
   ```

2. **Prevent Future Issues**
   ```bash
   # Set up monitoring
   npm run monitor:enable --environment=test --continuous
   
   # Configure automatic cleanup
   npm run config:auto-cleanup --environment=test --schedule=daily
   ```

## Recovery Procedures

### Emergency Recovery

#### Complete Environment Failure
```bash
# Emergency stop all operations
npm run emergency:stop-all --confirm

# Assess damage
npm run assess:damage --environment=<failed-env> --comprehensive

# Restore from backup
npm run restore:emergency --environment=<failed-env> --backup=<latest-backup> --force
```

#### Data Loss Recovery
```bash
# Check backup availability
npm run backup:list --environment=<env-name> --recent

# Restore from specific backup
npm run restore --environment=<env-name> --backup=<backup-id> --verify

# Validate restored environment
npm run validate:full --environment=<env-name> --post-restore
```

### Rollback Procedures

#### Operation Rollback
```bash
# Rollback failed operation
npm run rollback --operation=<operation-id> --to-checkpoint=<checkpoint-id>

# Verify rollback success
npm run verify:rollback --operation=<operation-id> --comprehensive

# Clean up rollback artifacts
npm run cleanup:rollback --operation=<operation-id>
```

#### Environment Rollback
```bash
# Rollback environment to previous state
npm run environment:rollback --environment=<env-name> --to-backup=<backup-id>

# Verify environment integrity
npm run validate:integrity --environment=<env-name> --post-rollback

# Update environment status
npm run environment:update-status --environment=<env-name> --status=active
```

## Preventive Maintenance

### Regular Health Checks
```bash
# Daily health check
npm run health:daily --all-environments

# Weekly comprehensive check
npm run health:weekly --all-environments --detailed

# Monthly deep analysis
npm run health:monthly --all-environments --comprehensive --generate-report
```

### Automated Monitoring Setup
```bash
# Enable continuous monitoring
npm run monitor:setup --all-environments --continuous

# Configure alerting
npm run alerts:setup --email=admin@company.com --severity=warning

# Set up automated reports
npm run reports:schedule --frequency=weekly --recipients=team@company.com
```

### Backup Management
```bash
# Configure automated backups
npm run backup:schedule --environment=<env-name> --frequency=daily --retention=30d

# Verify backup integrity
npm run backup:verify --environment=<env-name> --all-backups

# Clean up old backups
npm run backup:cleanup --environment=<env-name> --older-than=90d
```

This troubleshooting guide provides comprehensive solutions for common issues and emergency procedures to maintain system reliability and data integrity.