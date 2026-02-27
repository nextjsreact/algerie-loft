# Supabase Backup CLI

Complete backup and restore solution for Supabase databases including storage files.

## Features

✅ **Complete Backups**
- Full PostgreSQL database dump (all schemas: auth, storage, public, custom)
- All storage files from all buckets
- Configuration and metadata
- Automatic restoration scripts
- Integrity verification with checksums

✅ **Easy Restoration**
- One-command restore
- Automatic storage file upload
- Progress tracking
- Error handling

✅ **Environment Cloning**
- Clone production to test/dev
- Safe data migration
- Configurable target environments

✅ **Universal**
- Works with any Supabase project
- No application-specific code
- Framework agnostic (Next.js, React, Vue, etc.)

## Installation

### Global Installation
```bash
npm install -g supabase-backup-cli
```

### Local Installation
```bash
npm install --save-dev supabase-backup-cli
```

## Prerequisites

1. **Node.js** >= 18.0.0
2. **PostgreSQL Client Tools** (`pg_dump`, `psql`)
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql-client`

3. **Supabase Project Credentials**
   - Project URL
   - Database Password
   - Service Role Key

## Quick Start

### 1. Configure Environment

Create a `.env` file or `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Create a Backup

```bash
# Using global installation
supabase-backup create

# Using npx
npx supabase-backup-cli create

# Using package.json script
npm run backup
```

### 3. Restore a Backup

```bash
# Restore to current environment
supabase-backup restore complete_backup_2026-02-27T14-33-45-045Z

# Restore to specific environment
supabase-backup restore complete_backup_2026-02-27T14-33-45-045Z --env production
```

### 4. Clone to Another Environment

```bash
# Clone to test environment
supabase-backup clone complete_backup_2026-02-27T14-33-45-045Z test

# Clone to dev environment
supabase-backup clone complete_backup_2026-02-27T14-33-45-045Z dev
```

## CLI Commands

### `create`
Create a complete backup of your Supabase database and storage.

```bash
supabase-backup create [options]

Options:
  -o, --output <path>     Output directory (default: ./backups)
  -e, --env <file>        Environment file (default: .env.local)
  --no-storage            Skip storage files backup
  --compression           Enable compression (gzip)
  -v, --verbose           Verbose output
```

**Example:**
```bash
supabase-backup create --output ./my-backups --verbose
```

### `restore`
Restore a backup to a Supabase database.

```bash
supabase-backup restore <backup-folder> [options]

Options:
  -e, --env <file>        Environment file (default: .env.local)
  --no-storage            Skip storage files restoration
  --sql-only              Restore only SQL database
  --storage-only          Restore only storage files
  -y, --yes               Skip confirmation prompt
  -v, --verbose           Verbose output
```

**Example:**
```bash
supabase-backup restore complete_backup_2026-02-27T14-33-45-045Z --yes
```

### `clone`
Clone a backup to another environment.

```bash
supabase-backup clone <backup-folder> <target-env> [options]

Options:
  --env-file <file>       Target environment file (default: .env.<target-env>)
  --no-storage            Skip storage files
  -y, --yes               Skip confirmation prompt
  -v, --verbose           Verbose output
```

**Example:**
```bash
supabase-backup clone complete_backup_2026-02-27T14-33-45-045Z test
```

### `list`
List all available backups.

```bash
supabase-backup list [options]

Options:
  -p, --path <path>       Backups directory (default: ./backups)
  --json                  Output as JSON
```

### `verify`
Verify backup integrity.

```bash
supabase-backup verify <backup-folder> [options]

Options:
  --checksums             Verify file checksums
  --sql                   Verify SQL dump syntax
  -v, --verbose           Verbose output
```

### `info`
Show detailed information about a backup.

```bash
supabase-backup info <backup-folder>
```

## Backup Structure

```
complete_backup_2026-02-27T14-33-45-045Z/
├── database.sql          # Complete PostgreSQL dump
├── storage/              # Storage files organized by bucket
│   ├── loft-photos/
│   ├── documents/
│   └── avatars/
├── config.json           # Backup metadata
├── restore.cjs           # Standalone restoration script
├── checksums.json        # File integrity checksums
└── README.md             # Backup-specific instructions
```

## Package.json Integration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "backup": "supabase-backup create",
    "backup:restore": "supabase-backup restore",
    "backup:list": "supabase-backup list",
    "backup:clone-to-test": "supabase-backup clone",
    "backup:clone-to-dev": "supabase-backup clone"
  }
}
```

## Environment Files

### Production (.env or .env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_DB_PASSWORD=prod_password
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
```

### Test (.env.test)
```env
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
SUPABASE_DB_PASSWORD=test_password
SUPABASE_SERVICE_ROLE_KEY=test_service_key
```

### Development (.env.dev)
```env
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_DB_PASSWORD=dev_password
SUPABASE_SERVICE_ROLE_KEY=dev_service_key
```

## Programmatic Usage

You can also use the package programmatically in your Node.js code:

```javascript
const { createBackup, restoreBackup, cloneBackup } = require('supabase-backup-cli');

// Create backup
await createBackup({
  outputDir: './backups',
  envFile: '.env.local',
  includeStorage: true,
  verbose: true
});

// Restore backup
await restoreBackup('complete_backup_2026-02-27T14-33-45-045Z', {
  envFile: '.env.local',
  includeStorage: true,
  skipConfirmation: false
});

// Clone to another environment
await cloneBackup('complete_backup_2026-02-27T14-33-45-045Z', 'test', {
  envFile: '.env.test',
  includeStorage: true
});
```

## Advanced Usage

### Automated Backups with Cron

**Linux/macOS:**
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * cd /path/to/project && supabase-backup create >> /var/log/supabase-backup.log 2>&1
```

**Windows Task Scheduler:**
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "supabase-backup" -Argument "create" -WorkingDirectory "C:\path\to\project"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "SupabaseBackup"
```

### Backup Rotation

Keep only the last N backups:

```bash
# Keep last 7 backups
supabase-backup list --json | jq -r '.[7:] | .[].path' | xargs rm -rf
```

### Compression

Enable compression to save disk space:

```bash
supabase-backup create --compression
```

### Selective Restore

Restore only specific components:

```bash
# SQL only
supabase-backup restore backup_folder --sql-only

# Storage only
supabase-backup restore backup_folder --storage-only
```

## Troubleshooting

### Error: "pg_dump not found"
Install PostgreSQL client tools and add to PATH.

### Error: "Database credentials not found"
Ensure your `.env` file contains all required variables.

### Error: "Permission denied" on storage
Check that your service role key has storage permissions.

### Slow backup/restore
- Use `--no-storage` to skip large files
- Enable `--compression` for faster transfers
- Check network connection to Supabase

## Security Best Practices

1. **Never commit backups to Git**
   - Add `backups/` to `.gitignore`
   - Backups contain sensitive data

2. **Secure storage**
   - Store backups in encrypted locations
   - Use secure file transfer protocols
   - Implement access controls

3. **Environment separation**
   - Use different credentials for each environment
   - Never use production credentials in dev/test

4. **Regular testing**
   - Test restoration regularly
   - Verify backup integrity
   - Practice disaster recovery

## Limitations

- Requires PostgreSQL client tools installed locally
- Does not work in serverless environments (Vercel, AWS Lambda)
- Large databases may take significant time
- Storage files are downloaded/uploaded sequentially

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: https://github.com/yourusername/supabase-backup-cli/issues
- Documentation: https://github.com/yourusername/supabase-backup-cli/wiki
- Email: support@example.com

## Changelog

### v1.0.0 (2026-02-27)
- Initial release
- Complete backup and restore functionality
- Environment cloning support
- CLI interface
- Programmatic API

---

**Made with ❤️ for the Supabase community**
