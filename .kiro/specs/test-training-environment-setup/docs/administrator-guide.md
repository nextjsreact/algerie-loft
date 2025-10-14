# Administrator Guide - Environment Management System

## Overview

This guide provides comprehensive instructions for administrators managing the Test/Training Environment Setup System. As an administrator, you have full access to environment creation, management, and monitoring capabilities.

## Getting Started

### Prerequisites
- Administrative access to production Supabase project
- Node.js 18+ installed
- Access to environment configuration files
- Understanding of database administration concepts

### Initial Setup
1. **Configure Environment Variables**
   ```bash
   # Copy environment template
   cp .env.example .env.production
   cp .env.example .env.test
   cp .env.example .env.training
   
   # Configure each environment file with appropriate credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm run build
   ```

3. **Verify Production Access**
   ```bash
   # Test production connection (read-only)
   npm run validate --environment=production
   ```

## Core Administrative Tasks

### 1. Environment Creation

#### Creating a Test Environment
```bash
# Create new test environment from production
npm run clone --source=production --target=test --anonymize --include-all

# Monitor progress
npm run status --operation=<operation-id>
```

**Options:**
- `--anonymize`: Anonymize sensitive data (recommended)
- `--include-all`: Include audit logs, conversations, and reservations
- `--preserve-roles`: Maintain user role structure
- `--batch-size=1000`: Set batch size for large tables

#### Creating a Training Environment
```bash
# Create training environment with sample data
npm run clone --source=production --target=training --anonymize --generate-samples

# Add training-specific users
npm run setup:training-users --environment=training
```

### 2. Environment Management

#### Switching Between Environments
```bash
# Switch to test environment
npm run switch --environment=test

# Verify current environment
npm run current-env

# Switch back to production (read-only)
npm run switch --environment=production --read-only
```

#### Environment Status Monitoring
```bash
# Check all environments
npm run status --all

# Detailed health check
npm run health --environment=test --detailed

# View environment statistics
npm run stats --environment=test
```

### 3. Schema Management

#### Schema Synchronization
```bash
# Compare schemas between environments
npm run schema:compare --source=production --target=test

# Generate migration script
npm run schema:migrate --source=production --target=test --output=migration.sql

# Apply migration
npm run schema:apply --target=test --migration=migration.sql --confirm
```

#### Schema Backup and Restore
```bash
# Backup schema
npm run schema:backup --environment=test --output=schema_backup.sql

# Restore schema
npm run schema:restore --environment=test --input=schema_backup.sql --confirm
```

### 4. Data Management

#### Data Anonymization
```bash
# Re-anonymize specific tables
npm run anonymize --environment=test --tables=users,customers,reservations

# Update anonymization rules
npm run anonymize:rules --update --file=anonymization-rules.json

# Verify anonymization completeness
npm run anonymize:verify --environment=test
```

#### Data Refresh
```bash
# Refresh test environment with latest production data
npm run refresh --source=production --target=test --anonymize

# Partial refresh (specific tables only)
npm run refresh --source=production --target=test --tables=transactions,tasks
```

### 5. Backup and Recovery

#### Creating Backups
```bash
# Full environment backup
npm run backup --environment=test --type=full --output=test_backup_$(date +%Y%m%d)

# Schema-only backup
npm run backup --environment=test --type=schema --output=schema_backup.sql

# Data-only backup
npm run backup --environment=test --type=data --output=data_backup.sql
```

#### Restoring from Backup
```bash
# Restore full environment
npm run restore --environment=test --input=test_backup_20241013 --confirm

# Restore with rollback point
npm run restore --environment=test --input=backup.sql --create-rollback
```

### 6. Monitoring and Alerting

#### Setting Up Monitoring
```bash
# Enable continuous monitoring
npm run monitor:enable --environment=test --interval=5m

# Configure alerts
npm run alerts:configure --email=admin@company.com --slack-webhook=<webhook-url>

# View monitoring dashboard
npm run dashboard --port=3001
```

#### Viewing Logs and Reports
```bash
# View operation logs
npm run logs --operation=<operation-id> --detailed

# Generate environment report
npm run report --environment=test --output=report.html

# Export audit logs
npm run audit:export --environment=test --date-range=7d
```

## Advanced Administration

### 1. Custom Anonymization Rules

Create custom anonymization rules for specific business needs:

```json
// anonymization-rules.json
{
  "rules": [
    {
      "tableName": "customers",
      "columnName": "email",
      "anonymizationType": "email",
      "preserveFormat": true
    },
    {
      "tableName": "reservations",
      "columnName": "guest_name",
      "anonymizationType": "name",
      "customGenerator": "faker.name.fullName"
    },
    {
      "tableName": "transactions",
      "columnName": "amount",
      "anonymizationType": "financial",
      "preserveFormat": true,
      "constraints": {
        "minValue": 10,
        "maxValue": 5000
      }
    }
  ]
}
```

Apply custom rules:
```bash
npm run anonymize:rules --apply --file=anonymization-rules.json --environment=test
```

### 2. Performance Optimization

#### Optimizing Clone Operations
```bash
# Configure parallel processing
npm run config:set --key=clone.parallelTables --value=5

# Set batch sizes for large tables
npm run config:set --key=clone.batchSize --value=2000

# Enable compression for transfers
npm run config:set --key=clone.compression --value=true
```

#### Monitoring Performance
```bash
# View performance metrics
npm run metrics --operation=<operation-id>

# Analyze slow operations
npm run analyze:performance --environment=test --timeframe=24h
```

### 3. Security Management

#### Production Safety Verification
```bash
# Verify production protection
npm run security:verify --environment=production

# Test safety guards
npm run security:test --simulate-write-attempt

# Review security logs
npm run security:logs --timeframe=7d
```

#### Access Control Management
```bash
# List user permissions
npm run permissions:list

# Grant clone permissions
npm run permissions:grant --user=developer@company.com --role=cloner

# Revoke permissions
npm run permissions:revoke --user=user@company.com --role=cloner
```

## Troubleshooting Common Issues

### Clone Operation Failures
1. **Check source environment connectivity**
   ```bash
   npm run test:connection --environment=production
   ```

2. **Verify target environment capacity**
   ```bash
   npm run check:capacity --environment=test
   ```

3. **Review operation logs**
   ```bash
   npm run logs --operation=<failed-operation-id> --level=error
   ```

### Schema Synchronization Issues
1. **Check for schema conflicts**
   ```bash
   npm run schema:conflicts --source=production --target=test
   ```

2. **Resolve dependency issues**
   ```bash
   npm run schema:dependencies --environment=test --fix
   ```

### Performance Issues
1. **Monitor resource usage**
   ```bash
   npm run monitor:resources --environment=test
   ```

2. **Optimize batch sizes**
   ```bash
   npm run optimize:batches --environment=test --auto
   ```

## Best Practices

### 1. Environment Management
- **Regular Refreshes**: Refresh test environments weekly with production data
- **Monitoring**: Enable continuous monitoring for all non-production environments
- **Backup Strategy**: Create daily backups of test environments before major changes
- **Documentation**: Document all custom configurations and procedures

### 2. Security
- **Production Access**: Always verify production connections are read-only
- **Anonymization**: Regularly audit anonymization rules for completeness
- **Access Control**: Review and update user permissions quarterly
- **Audit Logs**: Monitor audit logs for unusual activity

### 3. Performance
- **Resource Planning**: Monitor resource usage and plan capacity accordingly
- **Optimization**: Regularly review and optimize clone operation parameters
- **Scheduling**: Schedule large operations during off-peak hours
- **Cleanup**: Regularly clean up old backups and logs

## Emergency Procedures

### 1. Failed Clone Operation Recovery
```bash
# Stop failed operation
npm run operation:stop --id=<operation-id> --force

# Rollback to previous state
npm run rollback --environment=test --to-backup=<backup-id>

# Verify environment integrity
npm run validate --environment=test --comprehensive
```

### 2. Production Safety Breach
```bash
# Immediately block all operations
npm run emergency:block-all

# Review security logs
npm run security:incident-report --timeframe=1h

# Reset safety guards
npm run security:reset-guards --confirm
```

### 3. Environment Corruption
```bash
# Assess damage
npm run assess:corruption --environment=test

# Restore from backup
npm run restore --environment=test --input=<latest-backup> --force

# Verify restoration
npm run validate --environment=test --full-check
```

## Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Refresh test environments, review logs, check disk space
- **Monthly**: Update anonymization rules, review performance metrics, backup configurations
- **Quarterly**: Review access permissions, update documentation, security audit

### Getting Help
- **Documentation**: Refer to technical documentation for detailed API information
- **Logs**: Always check operation logs first for error details
- **Support**: Contact development team with operation IDs and error logs
- **Community**: Check project repository for known issues and solutions

This administrator guide provides comprehensive coverage of all administrative tasks and procedures for managing the environment cloning system effectively and securely.