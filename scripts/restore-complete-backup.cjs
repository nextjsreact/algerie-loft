#!/usr/bin/env node

/**
 * Complete Backup Restoration Script
 * 
 * Restores a complete backup including:
 * - SQL database dump
 * - Storage files (photos, documents)
 * - Configuration
 * 
 * Usage:
 *   node scripts/restore-complete-backup.cjs <backup-folder-name>
 *   
 * Example:
 *   node scripts/restore-complete-backup.cjs complete_backup_2026-02-27T14-33-45-045Z
 * 
 * Or from within the backup folder:
 *   cd backups/complete_backup_2026-02-27T14-33-45-045Z
 *   node restore.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function restoreBackup(backupPath) {
  console.log('🔄 Starting complete backup restoration...');
  console.log('');

  // Verify backup exists
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Error: Backup folder not found: ${backupPath}`);
    process.exit(1);
  }

  const sqlFile = path.join(backupPath, 'database.sql');
  const storageDir = path.join(backupPath, 'storage');
  const configFile = path.join(backupPath, 'config.json');

  // Verify required files
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Error: database.sql not found in backup`);
    process.exit(1);
  }

  // Load config
  let config = {};
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    console.log(`📋 Backup info:`);
    console.log(`   Created: ${config.timestamp}`);
    console.log(`   Type: ${config.backup_type}`);
    console.log('');
  }

  // Get target credentials
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dbUrl || !dbPassword) {
    console.error('❌ Error: Database credentials not found');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD in .env.local');
    process.exit(1);
  }

  const projectRef = dbUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Error: Invalid Supabase URL format');
    process.exit(1);
  }

  const dbHost = 'aws-0-eu-central-1.pooler.supabase.com';
  const dbPort = 6543;
  const dbUser = `postgres.${projectRef}`;

  console.log(`🎯 Target: ${projectRef}`);
  console.log('');

  // Confirm restoration
  console.log('⚠️  WARNING: This will OVERWRITE the target database!');
  console.log('');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // ============================================
    // STEP 1: Restore SQL Database
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 STEP 1/2: Restoring SQL database...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('   Executing SQL restore...');
    execSync(`psql -h ${dbHost} -p ${dbPort} -U "${dbUser}" -d postgres -f "${sqlFile}"`, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    console.log('   ✅ SQL database restored successfully');
    console.log('');

    // ============================================
    // STEP 2: Restore Storage Files
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 STEP 2/2: Restoring storage files...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!fs.existsSync(storageDir)) {
      console.log('   ℹ️  No storage files to restore');
    } else if (!serviceKey) {
      console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY not found');
      console.log('   Storage files are in: ' + storageDir);
      console.log('   You must upload them manually to Supabase Storage');
    } else {
      // Create Supabase client
      const supabase = createClient(dbUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      await restoreStorageFiles(supabase, storageDir);
    }

    console.log('');
    console.log('✅ RESTORATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎉 Your database has been restored successfully!');
    console.log('');

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  }
}

async function restoreStorageFiles(supabase, storageDir) {
  let totalFiles = 0;
  let totalSize = 0;

  // Get all buckets in storage directory
  const buckets = fs.readdirSync(storageDir);

  for (const bucketName of buckets) {
    const bucketPath = path.join(storageDir, bucketName);
    if (!fs.statSync(bucketPath).isDirectory()) continue;

    console.log(`   📦 Restoring bucket: ${bucketName}`);

    // Ensure bucket exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const bucketExists = existingBuckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      console.log(`      Creating bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      if (error) {
        console.log(`      ⚠️  Could not create bucket: ${error.message}`);
        continue;
      }
    }

    // Upload all files in bucket
    const result = await uploadBucketFiles(supabase, bucketName, bucketPath, '');
    totalFiles += result.files;
    totalSize += result.size;

    console.log(`      ✅ Uploaded ${result.files} file(s) (${(result.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log(`   ✅ Storage restoration complete: ${totalFiles} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
}

async function uploadBucketFiles(supabase, bucketName, dirPath, prefix) {
  let totalFiles = 0;
  let totalSize = 0;

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const remotePath = prefix ? `${prefix}/${item}` : item;
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Recurse into subdirectory
      const result = await uploadBucketFiles(supabase, bucketName, itemPath, remotePath);
      totalFiles += result.files;
      totalSize += result.size;
    } else {
      // Upload file
      try {
        console.log(`      ⬆️  Uploading: ${remotePath}...`);
        
        const fileBuffer = fs.readFileSync(itemPath);
        
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(remotePath, fileBuffer, {
            contentType: getContentType(item),
            upsert: true
          });

        if (error) {
          console.log(`      ⚠️  Failed: ${remotePath} - ${error.message}`);
        } else {
          totalFiles++;
          totalSize += stats.size;
          console.log(`      ✓ ${remotePath} (${(stats.size / 1024).toFixed(2)} KB)`);
        }
      } catch (err) {
        console.log(`      ⚠️  Failed: ${remotePath} - ${err.message}`);
      }
    }
  }

  return { files: totalFiles, size: totalSize };
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.sql': 'application/sql',
    '.txt': 'text/plain',
    '.json': 'application/json'
  };
  return types[ext] || 'application/octet-stream';
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  // Check if we're running from within a backup folder
  const currentDir = process.cwd();
  if (fs.existsSync(path.join(currentDir, 'database.sql')) && 
      fs.existsSync(path.join(currentDir, 'config.json'))) {
    // We're in a backup folder
    restoreBackup(currentDir);
  } else {
    console.error('Usage: node scripts/restore-complete-backup.cjs <backup-folder-name>');
    console.error('');
    console.error('Example:');
    console.error('  node scripts/restore-complete-backup.cjs complete_backup_2026-02-27T14-33-45-045Z');
    console.error('');
    console.error('Or run from within the backup folder:');
    console.error('  cd backups/complete_backup_2026-02-27T14-33-45-045Z');
    console.error('  node restore.cjs');
    process.exit(1);
  }
} else {
  const backupName = args[0];
  const backupPath = path.resolve(__dirname, '../backups', backupName);
  restoreBackup(backupPath);
}
