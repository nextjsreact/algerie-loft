#!/usr/bin/env node

/**
 * Clone Backup to Another Environment
 * 
 * Clones a complete backup to a different Supabase environment
 * Useful for: prod → test, prod → dev, test → dev
 * 
 * Usage:
 *   node scripts/clone-backup-to-env.cjs <backup-folder> <target-env>
 *   
 * Example:
 *   node scripts/clone-backup-to-env.cjs complete_backup_2026-02-27T14-33-45-045Z test
 *   node scripts/clone-backup-to-env.cjs complete_backup_2026-02-27T14-33-45-045Z dev
 * 
 * Target environments: test, dev
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function cloneBackupToEnv(backupPath, targetEnv) {
  console.log(`🔄 Cloning backup to ${targetEnv.toUpperCase()} environment...`);
  console.log('');

  // Verify backup exists
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Error: Backup folder not found: ${backupPath}`);
    process.exit(1);
  }

  const sqlFile = path.join(backupPath, 'database.sql');
  const storageDir = path.join(backupPath, 'storage');
  const configFile = path.join(backupPath, 'config.json');

  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Error: database.sql not found in backup`);
    process.exit(1);
  }

  // Load config
  let config = {};
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    console.log(`📋 Source backup info:`);
    console.log(`   Created: ${config.timestamp}`);
    console.log(`   Type: ${config.backup_type}`);
    console.log('');
  }

  // Load target environment credentials
  const envFile = path.resolve(__dirname, `../.env.${targetEnv}`);
  if (!fs.existsSync(envFile)) {
    console.error(`❌ Error: Environment file not found: .env.${targetEnv}`);
    process.exit(1);
  }

  console.log(`📂 Loading credentials from: .env.${targetEnv}`);
  require('dotenv').config({ path: envFile });

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dbUrl || !dbPassword) {
    console.error(`❌ Error: Database credentials not found in .env.${targetEnv}`);
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD');
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

  console.log(`🎯 Target: ${targetEnv.toUpperCase()} (${projectRef})`);
  console.log('');

  // Confirm cloning
  console.log(`⚠️  WARNING: This will OVERWRITE the ${targetEnv.toUpperCase()} database!`);
  console.log('');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // ============================================
    // STEP 1: Clone SQL Database
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 STEP 1/2: Cloning SQL to ${targetEnv.toUpperCase()}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('   Executing SQL restore...');
    execSync(`psql -h ${dbHost} -p ${dbPort} -U "${dbUser}" -d postgres -f "${sqlFile}"`, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    console.log(`   ✅ SQL cloned to ${targetEnv.toUpperCase()} successfully`);
    console.log('');

    // ============================================
    // STEP 2: Clone Storage Files
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 STEP 2/2: Cloning storage to ${targetEnv.toUpperCase()}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!fs.existsSync(storageDir)) {
      console.log('   ℹ️  No storage files to clone');
    } else if (!serviceKey) {
      console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY not found');
      console.log('   Storage files must be uploaded manually');
    } else {
      // Create Supabase client for target
      const supabase = createClient(dbUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      await cloneStorageFiles(supabase, storageDir);
    }

    console.log('');
    console.log('✅ CLONING COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`🎉 Backup successfully cloned to ${targetEnv.toUpperCase()} environment!`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Source: ${config.project_ref || 'Unknown'}`);
    console.log(`   Target: ${projectRef} (${targetEnv})`);
    console.log('');

  } catch (error) {
    console.error('❌ Cloning failed:', error.message);
    process.exit(1);
  }
}

async function cloneStorageFiles(supabase, storageDir) {
  let totalFiles = 0;
  let totalSize = 0;

  const buckets = fs.readdirSync(storageDir);

  for (const bucketName of buckets) {
    const bucketPath = path.join(storageDir, bucketName);
    if (!fs.statSync(bucketPath).isDirectory()) continue;

    console.log(`   📦 Cloning bucket: ${bucketName}`);

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

    // Upload all files
    const result = await uploadBucketFiles(supabase, bucketName, bucketPath, '');
    totalFiles += result.files;
    totalSize += result.size;

    console.log(`      ✅ Uploaded ${result.files} file(s) (${(result.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log(`   ✅ Storage cloning complete: ${totalFiles} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
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
      const result = await uploadBucketFiles(supabase, bucketName, itemPath, remotePath);
      totalFiles += result.files;
      totalSize += result.size;
    } else {
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

if (args.length < 2) {
  console.error('Usage: node scripts/clone-backup-to-env.cjs <backup-folder> <target-env>');
  console.error('');
  console.error('Target environments: test, dev');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/clone-backup-to-env.cjs complete_backup_2026-02-27T14-33-45-045Z test');
  console.error('  node scripts/clone-backup-to-env.cjs complete_backup_2026-02-27T14-33-45-045Z dev');
  console.error('');
  console.error('Note: Requires .env.test or .env.dev file with target credentials');
  process.exit(1);
}

const backupName = args[0];
const targetEnv = args[1].toLowerCase();

if (!['test', 'dev'].includes(targetEnv)) {
  console.error('❌ Error: Invalid target environment. Must be "test" or "dev"');
  process.exit(1);
}

const backupPath = path.resolve(__dirname, '../backups', backupName);
cloneBackupToEnv(backupPath, targetEnv);
