# Usage Examples

## Basic Usage

### 1. Simple Backup
```bash
# Create a backup with default settings
supabase-backup create

# Output:
# 🚀 Creating Supabase backup...
# ✅ Backup created successfully!
# 📁 Location: ./backups/complete_backup_2026-02-27T14-33-45-045Z
# 📊 Size: 110.76 MB
# 📦 Files: 84
```

### 2. Simple Restore
```bash
# Restore the latest backup
supabase-backup restore complete_backup_2026-02-27T14-33-45-045Z

# With confirmation skip
supabase-backup restore complete_backup_2026-02-27T14-33-45-045Z --yes
```

### 3. Clone to Test Environment
```bash
# Clone production backup to test
supabase-backup clone complete_backup_2026-02-27T14-33-45-045Z test
```

## Advanced Usage

### Custom Output Directory
```bash
# Save backups to a specific location
supabase-backup create --output /mnt/backups

# With compression
supabase-backup create --output /mnt/backups --compression
```

### SQL Only Operations
```bash
# Backup SQL only (skip storage files)
supabase-backup create --no-storage

# Restore SQL only
supabase-backup restore backup_folder --sql-only
```

### Storage Only Operations
```bash
# Restore only storage files
supabase-backup restore backup_folder --storage-only
```

### Verbose Mode
```bash
# See detailed progress
supabase-backup create --verbose
supabase-backup restore backup_folder --verbose
```

## Integration Examples

### Next.js Project

**package.json:**
```json
{
  "scripts": {
    "backup": "supabase-backup create",
    "backup:restore": "supabase-backup restore",
    "backup:list": "supabase-backup list",
    "backup:prod-to-test": "supabase-backup clone"
  }
}
```

**Usage:**
```bash
npm run backup
npm run backup:restore complete_backup_2026-02-27T14-33-45-045Z
npm run backup:list
```

### React Project

Same as Next.js - framework agnostic!

### Node.js Script

```javascript
const { createBackup, restoreBackup } = require('supabase-backup-cli');

async function dailyBackup() {
  const result = await createBackup({
    outputDir: './backups',
    envFile: '.env.production',
    includeStorage: true,
    verbose: false
  });

  if (result.success) {
    console.log('Backup created:', result.backupPath);
    
    // Send notification
    await sendSlackNotification(`Backup completed: ${result.totalSize} MB`);
  } else {
    console.error('Backup failed:', result.error);
    await sendAlertEmail(result.error);
  }
}

dailyBackup();
```

## Automation Examples

### Cron Job (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && supabase-backup create >> /var/log/supabase-backup.log 2>&1

# Add weekly cleanup (keep last 7 backups)
0 3 * * 0 cd /path/to/project && find ./backups -type d -name "complete_backup_*" | sort -r | tail -n +8 | xargs rm -rf
```

### Windows Task Scheduler

```powershell
# Create daily backup task
$action = New-ScheduledTaskAction `
  -Execute "supabase-backup" `
  -Argument "create" `
  -WorkingDirectory "C:\Projects\MyApp"

$trigger = New-ScheduledTaskTrigger -Daily -At 2am

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -TaskName "SupabaseBackup" `
  -Description "Daily Supabase database backup"
```

### GitHub Actions

```yaml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client
      
      - name: Install dependencies
        run: npm install -g supabase-backup-cli
      
      - name: Create backup
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_PASSWORD }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: supabase-backup create --output ./backups
      
      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Sync to S3
        run: aws s3 sync ./backups s3://my-backups-bucket/supabase/
```

## Disaster Recovery Scenarios

### Scenario 1: Accidental Data Deletion

```bash
# 1. Immediately create a backup of current state (if possible)
supabase-backup create --output ./emergency-backup

# 2. Restore from last known good backup
supabase-backup restore complete_backup_2026-02-26T02-00-00-000Z --yes

# 3. Verify restoration
supabase-backup verify complete_backup_2026-02-26T02-00-00-000Z
```

### Scenario 2: Database Corruption

```bash
# 1. Create backup of corrupted state for analysis
supabase-backup create --output ./corrupted-backup --no-storage

# 2. Restore from last good backup
supabase-backup restore complete_backup_2026-02-25T02-00-00-000Z

# 3. Manually recover any critical data from corrupted backup
```

### Scenario 3: Migration to New Project

```bash
# 1. Create complete backup from old project
supabase-backup create

# 2. Update .env with new project credentials
# Edit .env.local with new SUPABASE_URL, PASSWORD, SERVICE_KEY

# 3. Restore to new project
supabase-backup restore complete_backup_2026-02-27T14-33-45-045Z --yes
```

## Testing Scenarios

### Test Backup Integrity

```bash
# Create test backup
supabase-backup create --output ./test-backup

# Verify checksums
supabase-backup verify ./test-backup/complete_backup_* --checksums

# Verify SQL syntax
supabase-backup verify ./test-backup/complete_backup_* --sql
```

### Test Restore Process

```bash
# 1. Create backup from production
supabase-backup create

# 2. Restore to test environment
supabase-backup clone complete_backup_2026-02-27T14-33-45-045Z test

# 3. Verify test environment
# Run your test suite against test environment
npm run test:integration
```

## Multi-Environment Workflow

```bash
# Morning: Backup production
supabase-backup create --env .env.production

# Clone to test for QA
supabase-backup clone complete_backup_2026-02-27T08-00-00-000Z test

# Clone to dev for development
supabase-backup clone complete_backup_2026-02-27T08-00-00-000Z dev

# Evening: Verify all environments
supabase-backup verify complete_backup_2026-02-27T08-00-00-000Z
```

## Backup Rotation Strategy

```bash
#!/bin/bash
# backup-rotation.sh

# Create new backup
supabase-backup create

# Keep only last 7 daily backups
find ./backups -type d -name "complete_backup_*" -mtime +7 -exec rm -rf {} \;

# Keep one backup per week for last 4 weeks
# Keep one backup per month for last 12 months
# (Implementation depends on your naming convention)
```

## Monitoring and Alerts

```javascript
// monitor-backups.js
const { listBackups, verifyBackup } = require('supabase-backup-cli');
const nodemailer = require('nodemailer');

async function monitorBackups() {
  const backups = await listBackups({ backupsDir: './backups' });
  
  // Check if latest backup is recent (within 24 hours)
  const latestBackup = backups[0];
  const backupAge = Date.now() - new Date(latestBackup.created).getTime();
  const hoursOld = backupAge / (1000 * 60 * 60);
  
  if (hoursOld > 24) {
    await sendAlert(`⚠️ No backup in last 24 hours! Latest: ${hoursOld.toFixed(1)}h ago`);
  }
  
  // Verify latest backup integrity
  const verification = await verifyBackup(latestBackup.path, {
    checkChecksums: true
  });
  
  if (!verification.valid) {
    await sendAlert(`❌ Latest backup verification failed: ${verification.error}`);
  }
}

async function sendAlert(message) {
  // Send email, Slack, or other notification
  console.error(message);
}

monitorBackups();
```

## Performance Optimization

```bash
# For large databases, backup SQL only first
supabase-backup create --no-storage

# Then backup storage separately (can be done in parallel)
supabase-backup create --storage-only

# Use compression for faster transfers
supabase-backup create --compression

# Restore SQL first, then storage
supabase-backup restore backup_folder --sql-only
supabase-backup restore backup_folder --storage-only
```
