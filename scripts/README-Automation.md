# Environment Management Automation Scripts

This directory contains automation scripts for managing test, training, and development environments. These scripts automate common workflows like environment refresh, setup, and maintenance.

## 🚀 Quick Start

### Windows Users
```cmd
# Interactive menu for all automation tasks
scripts\automation-menu.bat

# Or run specific tasks directly:
scripts\daily-refresh.bat
scripts\weekly-refresh.bat
scripts\setup-training-environment.bat
scripts\setup-development-environment.bat
```

### Linux/Mac Users
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run specific tasks:
./scripts/daily-refresh.sh
./scripts/weekly-refresh.sh
./scripts/setup-training-environment.sh
./scripts/setup-development-environment.sh
```

### PowerShell Users
```powershell
# Start workflow automation
.\scripts\start-automation-workflows.ps1 -Action start

# Check status
.\scripts\start-automation-workflows.ps1 -Action status
```

## 📋 Available Automation Scripts

### 1. Daily Environment Refresh
**Files:** `daily-refresh.bat`, `daily-refresh.sh`

Automatically refreshes test and training environments with fresh production data.

**Features:**
- Clones production data with anonymization
- Updates test and training environments
- Validates environment health
- Sends notifications on success/failure
- Runs on weekdays at 2:00 AM (configurable)

**Usage:**
```cmd
# Windows
scripts\daily-refresh.bat

# Linux/Mac
./scripts/daily-refresh.sh
```

### 2. Weekly Environment Refresh
**Files:** `weekly-refresh.bat`, `weekly-refresh.sh`

Performs comprehensive weekly maintenance of all environments.

**Features:**
- Deep cleanup and optimization
- Database performance tuning
- Schema synchronization
- Backup management
- Comprehensive validation
- Detailed reporting

**Usage:**
```cmd
# Windows
scripts\weekly-refresh.bat

# Linux/Mac
./scripts/weekly-refresh.sh
```

### 3. Training Environment Setup
**Files:** `setup-training-environment.bat`, `setup-training-environment.sh`

Creates complete training environments with realistic data and user accounts.

**Features:**
- Sample data generation (lofts, reservations, transactions)
- Training user accounts with different roles
- Training scenarios and documentation
- Audit system and notifications
- Auto-cleanup scheduling

**Usage:**
```cmd
# Windows
scripts\setup-training-environment.bat

# Linux/Mac
./scripts/setup-training-environment.sh
```

### 4. Development Environment Setup
**Files:** `setup-development-environment.bat`, `setup-development-environment.sh`

Quick setup of development environments for coding.

**Features:**
- Fast minimal data setup
- Developer user accounts
- Debug mode and hot reload
- Development tools configuration
- Local database support

**Setup Modes:**
- **Default:** Standard setup with sample data
- **Minimal:** Fastest setup with minimal data
- **Custom:** Use custom configuration file

**Usage:**
```cmd
# Windows
scripts\setup-development-environment.bat

# Linux/Mac
./scripts/setup-development-environment.sh
```

### 5. Workflow Automation
**File:** `start-automation-workflows.ps1`

Orchestrates and manages all automation workflows.

**Features:**
- Scheduled task management
- Workflow monitoring
- Configuration management
- Health checks and alerts

**Usage:**
```powershell
# Start workflows
.\scripts\start-automation-workflows.ps1 -Action start

# Check status
.\scripts\start-automation-workflows.ps1 -Action status

# Use custom config
.\scripts\start-automation-workflows.ps1 -Action start -ConfigPath "my-config.json"
```

## ⚙️ Configuration

### Default Configuration
The automation scripts use sensible defaults, but you can customize them:

1. Copy the template: `cp scripts/automation-config.template.json scripts/automation-config.json`
2. Edit the configuration file
3. Use the custom config: `--ConfigPath scripts/automation-config.json`

### Configuration Options

#### Daily Refresh
```json
{
  "dailyRefresh": {
    "enabled": true,
    "config": {
      "targetEnvironments": ["test", "training"],
      "refreshTime": "02:00",
      "weekdaysOnly": true,
      "anonymizeData": true,
      "createBackups": true,
      "notificationEmail": "admin@example.com"
    }
  }
}
```

#### Training Environment
```json
{
  "autoTrainingSetup": {
    "config": {
      "sampleDataSize": "medium",
      "trainingUserRoles": [
        {
          "role": "admin",
          "count": 1,
          "permissions": ["all"]
        }
      ],
      "autoCleanupAfterDays": 30
    }
  }
}
```

## 🔒 Production Safety

**CRITICAL:** All automation scripts include production safety measures:

- ✅ Production is ALWAYS read-only
- ✅ Multiple confirmation prompts
- ✅ Automatic safety guards
- ✅ Operation blocking for dangerous actions
- ✅ Audit trails and logging

## 📅 Scheduling

### Windows Task Scheduler
```cmd
# Schedule daily refresh
schtasks /create /tn "Daily Environment Refresh" /tr "C:\path\to\scripts\daily-refresh.bat" /sc daily /st 02:00

# Schedule weekly refresh  
schtasks /create /tn "Weekly Environment Refresh" /tr "C:\path\to\scripts\weekly-refresh.bat" /sc weekly /d SUN /st 01:00
```

### Linux Cron
```bash
# Edit crontab
crontab -e

# Add daily refresh (2 AM weekdays)
0 2 * * 1-5 /path/to/scripts/daily-refresh.sh

# Add weekly refresh (1 AM Sundays)
0 1 * * 0 /path/to/scripts/weekly-refresh.sh
```

## 🔍 Monitoring and Logs

### Log Locations
- **Windows:** `%TEMP%\environment-automation\`
- **Linux/Mac:** `/tmp/environment-automation/`

### Health Checks
```cmd
# Check automation status
npx tsx lib/environment-management/automation/schedule-manager.ts status

# Validate environment health
npx tsx lib/environment-management/validation/environment-validator.ts
```

## 🚨 Troubleshooting

### Common Issues

#### Node.js Not Found
```bash
# Install Node.js
# Windows: Download from nodejs.org
# Linux: sudo apt install nodejs npm
# Mac: brew install node
```

#### Permission Denied (Linux/Mac)
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

#### PowerShell Execution Policy
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Environment Variables
```bash
# Check environment configuration
npx tsx lib/environment-management/core/environment-config-manager.ts validate
```

### Getting Help

1. **Check logs** in the log directory
2. **Run validation** scripts to diagnose issues
3. **Use debug mode** by setting `DEBUG=true`
4. **Check prerequisites** with `scripts/check-prerequisites.bat`

## 📚 Advanced Usage

### Custom Automation Scripts

Create your own automation by extending the base classes:

```typescript
import { EnvironmentCloner } from '../lib/environment-management/environment-cloner'
import { EnvironmentValidator } from '../lib/environment-management/environment-validator'

class CustomAutomation {
  async runCustomWorkflow() {
    // Your custom automation logic
  }
}
```

### Integration with CI/CD

```yaml
# GitHub Actions example
name: Environment Refresh
on:
  schedule:
    - cron: '0 2 * * 1-5'  # Weekdays at 2 AM
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Run Daily Refresh
        run: ./scripts/daily-refresh.sh
```

## 🎯 Best Practices

1. **Test First:** Always test automation scripts in development
2. **Monitor:** Set up monitoring and alerting for automation failures
3. **Backup:** Ensure backups are created before major operations
4. **Validate:** Run validation checks after automation completes
5. **Document:** Keep automation logs and document any customizations
6. **Security:** Never store production credentials in scripts
7. **Schedule:** Use appropriate scheduling to avoid peak usage times

## 📞 Support

For issues with automation scripts:

1. Check the troubleshooting section above
2. Review automation logs
3. Run diagnostic scripts
4. Contact the development team with log details

---

**Remember:** These automation scripts are designed to make environment management easier and safer. Always review the configuration before running in production environments.