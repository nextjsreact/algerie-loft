#!/usr/bin/env node

/**
 * Standalone backup script
 * Usage: node scripts/create-backup.js [type]
 * Example: node scripts/create-backup.js FULL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BACKUP_TYPE = process.argv[2] || 'MANUAL';
const BACKUP_DIR = path.resolve(__dirname, '../backups');

async function createBackup() {
  console.log('🚀 Starting database backup...');
  console.log(`📦 Type: ${BACKUP_TYPE}`);
  
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const filename = `${BACKUP_TYPE.toLowerCase()}_${timestamp}_${randomSuffix}.sql`;
  const outputPath = path.join(BACKUP_DIR, filename);

  // Get database credentials
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

  if (!dbUrl || !dbPassword) {
    console.error('❌ Error: Database credentials not found');
    console.error('Please set SUPABASE_DB_PASSWORD in .env.local');
    process.exit(1);
  }

  const projectRef = dbUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Error: Invalid Supabase URL format');
    process.exit(1);
  }

  const dbHost = `aws-0-eu-central-1.pooler.supabase.com`;
  const dbPort = 6543;
  const dbName = 'postgres';
  const dbUser = `postgres.${projectRef}`;

  console.log(`📡 Connecting to: ${dbHost}:${dbPort}`);
  console.log(`👤 User: ${dbUser}`);

  try {
    // Create temporary files for system and user schemas
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const systemFile = path.join(tempDir, `system_${Date.now()}.sql`);
    const userFile = path.join(tempDir, `user_${Date.now()}.sql`);

    // Dump auth and storage schemas (data only)
    console.log('📝 Step 1/2: Dumping auth and storage data...');
    execSync(`pg_dump -h ${dbHost} -p ${dbPort} -U "${dbUser}" -d ${dbName} --data-only --schema=auth --schema=storage --inserts --exclude-table="auth.sessions" --exclude-table="auth.refresh_tokens" --exclude-table="auth.mfa_*" --exclude-table="auth.flow_state" --exclude-table="auth.one_time_tokens" --exclude-table="auth.audit_log_entries" -f "${systemFile}"`, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    const systemStats = fs.statSync(systemFile);
    console.log(`✅ System schemas dumped: ${(systemStats.size / 1024).toFixed(2)} KB`);

    // Dump user schemas (schema + data)
    console.log('📝 Step 2/2: Dumping user schemas...');
    execSync(`pg_dump -h ${dbHost} -p ${dbPort} -U "${dbUser}" -d ${dbName} --clean --if-exists --exclude-schema=auth --exclude-schema=storage --exclude-schema=realtime --exclude-schema=extensions --exclude-schema=graphql --exclude-schema=graphql_public --exclude-schema=vault --exclude-schema=pgbouncer --exclude-schema=pgsodium --exclude-schema=pgsodium_masks --exclude-schema=supabase_functions --exclude-schema=supabase_migrations -f "${userFile}"`, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    const userStats = fs.statSync(userFile);
    console.log(`✅ User schemas dumped: ${(userStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Merge files
    console.log('📋 Merging dumps...');
    const systemContent = fs.readFileSync(systemFile, 'utf8');
    const userContent = fs.readFileSync(userFile, 'utf8');

    const finalContent = `-- =====================================================
-- COMPLETE DATABASE BACKUP
-- Generated: ${new Date().toISOString()}
-- Type: ${BACKUP_TYPE}
-- =====================================================

-- =====================================================
-- PART 1: AUTH AND STORAGE DATA
-- =====================================================

${systemContent}

-- =====================================================
-- PART 2: USER SCHEMAS (SCHEMA + DATA)
-- =====================================================

${userContent}
`;

    fs.writeFileSync(outputPath, finalContent, 'utf8');

    // Cleanup temp files
    fs.unlinkSync(systemFile);
    fs.unlinkSync(userFile);

    // Calculate stats
    const finalStats = fs.statSync(outputPath);
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex');

    console.log('');
    console.log('✅ Backup completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 File: ${filename}`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`📊 Size: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔐 Checksum: ${checksum}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

createBackup();
