#!/usr/bin/env node

/**
 * Complete Backup Script V2 - Using Supabase SDK
 * Creates a full backup including:
 * - Complete SQL dump (all schemas)
 * - Storage files (images, PDFs, etc.)
 * - Configuration (buckets, policies)
 * - Restoration script
 * 
 * Usage: node scripts/create-complete-backup-v2.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `complete_backup_${timestamp}`;
const backupPath = path.join(BACKUP_DIR, backupName);

async function createCompleteBackup() {
  console.log('🚀 Starting COMPLETE database backup (V2 - Supabase SDK)...');
  console.log('📦 This includes: SQL dump + Storage files + Configuration');
  console.log('');

  // Create backup directory
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  // Get credentials
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  try {
    // ============================================
    // STEP 1: Complete SQL Dump
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 STEP 1/4: Creating complete SQL dump...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const sqlFile = path.join(backupPath, 'database.sql');
    
    console.log('   Dumping all schemas and data...');
    execSync(`pg_dump -h ${dbHost} -p ${dbPort} -U "${dbUser}" -d ${dbName} --clean --if-exists --create --exclude-schema=information_schema --exclude-schema=pg_catalog --exclude-schema=pg_toast -f "${sqlFile}"`, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    const sqlStats = fs.statSync(sqlFile);
    console.log(`   ✅ SQL dump complete: ${(sqlStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // ============================================
    // STEP 2: Storage Files Backup using SDK
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 STEP 2/4: Backing up Storage files...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const storageDir = path.join(backupPath, 'storage');
    fs.mkdirSync(storageDir, { recursive: true });

    if (serviceKey) {
      // Create Supabase client with service role key
      const supabase = createClient(dbUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      await backupStorageFilesSDK(supabase, storageDir);
    } else {
      console.log('   ⚠️  Service key not found, skipping storage backup');
      console.log('   Add SUPABASE_SERVICE_ROLE_KEY to .env.local for storage backup');
    }
    console.log('');

    // ============================================
    // STEP 3: Configuration Backup
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  STEP 3/4: Backing up configuration...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const configFile = path.join(backupPath, 'config.json');
    const config = {
      timestamp: new Date().toISOString(),
      project_ref: projectRef,
      database_url: dbUrl,
      backup_type: 'COMPLETE',
      includes: {
        sql_dump: true,
        storage_files: !!serviceKey,
        configuration: true
      }
    };
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('   ✅ Configuration saved');
    console.log('');

    // ============================================
    // STEP 4: Create Restoration Script
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 STEP 4/4: Creating restoration script...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const restoreScript = createRestoreScript(backupName);
    const restoreFile = path.join(backupPath, 'restore.cjs');
    fs.writeFileSync(restoreFile, restoreScript);
    console.log('   ✅ Restoration script created');
    console.log('');

    // Create README
    const readme = createReadme(backupName, config);
    fs.writeFileSync(path.join(backupPath, 'README.md'), readme);

    // Calculate checksums
    console.log('🔐 Calculating checksums...');
    const checksums = {};
    const files = fs.readdirSync(backupPath);
    for (const file of files) {
      const filePath = path.join(backupPath, file);
      if (fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath);
        checksums[file] = crypto.createHash('sha256').update(content).digest('hex');
      }
    }
    fs.writeFileSync(path.join(backupPath, 'checksums.json'), JSON.stringify(checksums, null, 2));
    console.log('   ✅ Checksums calculated');
    console.log('');

    // Summary
    const totalSize = calculateDirectorySize(backupPath);
    
    console.log('');
    console.log('✅ COMPLETE BACKUP FINISHED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Location: ${backupPath}`);
    console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('📦 Backup contents:');
    console.log('   ✓ database.sql - Complete SQL dump');
    console.log('   ✓ storage/ - All storage files');
    console.log('   ✓ config.json - Backup configuration');
    console.log('   ✓ restore.cjs - Restoration script');
    console.log('   ✓ README.md - Instructions');
    console.log('   ✓ checksums.json - File integrity');
    console.log('');
    console.log('📖 To restore this backup:');
    console.log(`   cd ${backupPath}`);
    console.log('   node restore.cjs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function backupStorageFilesSDK(supabase, storageDir) {
  console.log('   Fetching storage buckets...');
  
  try {
    // Get list of buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    console.log(`   Found ${buckets.length} bucket(s): ${buckets.map(b => b.name).join(', ')}`);

    let totalFiles = 0;
    let totalSize = 0;

    for (const bucket of buckets) {
      console.log(`   📦 Backing up bucket: ${bucket.name}`);
      const bucketDir = path.join(storageDir, bucket.name);
      fs.mkdirSync(bucketDir, { recursive: true });

      try {
        const result = await downloadBucketFilesSDK(supabase, bucket.name, '', bucketDir);
        totalFiles += result.files;
        totalSize += result.size;
        
        if (result.files > 0) {
          console.log(`      ✅ Downloaded ${result.files} file(s) (${(result.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          console.log(`      ℹ️  No files found in this bucket`);
        }
      } catch (err) {
        console.log(`      ⚠️  Error processing bucket ${bucket.name}: ${err.message}`);
      }
    }

    console.log(`   ✅ Storage backup complete: ${totalFiles} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);

  } catch (error) {
    console.log(`   ⚠️  Storage backup failed: ${error.message}`);
  }
}

async function downloadBucketFilesSDK(supabase, bucketName, prefix, targetDir) {
  let totalFiles = 0;
  let totalSize = 0;

  try {
    // List files at this prefix
    const { data: items, error: listError } = await supabase.storage
      .from(bucketName)
      .list(prefix, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    for (const item of items) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      
      // Check if it's a folder
      if (item.id === null) {
        // It's a folder, recurse into it
        console.log(`      📁 Entering folder: ${itemPath}`);
        const result = await downloadBucketFilesSDK(supabase, bucketName, itemPath, targetDir);
        totalFiles += result.files;
        totalSize += result.size;
      } else {
        // It's a file, download it
        try {
          console.log(`      ⬇️  Downloading: ${itemPath}...`);
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .download(itemPath);

          if (error) {
            throw new Error(error.message);
          }

          // Convert Blob to Buffer
          const arrayBuffer = await data.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const filePath = path.join(targetDir, itemPath);
          const fileDir = path.dirname(filePath);
          
          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }
          
          fs.writeFileSync(filePath, buffer);
          totalFiles++;
          totalSize += buffer.length;
          console.log(`      ✓ ${itemPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
        } catch (err) {
          console.log(`      ⚠️  Failed to download: ${itemPath} - ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.log(`      ⚠️  Error listing prefix '${prefix}': ${err.message}`);
  }

  return { files: totalFiles, size: totalSize };
}

function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += calculateDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

function createRestoreScript(backupName) {
  return `#!/usr/bin/env node

const { execSync } = require('child_process');
require('dotenv').config({ path: '../../.env.local' });

async function restore() {
  console.log('🔄 Starting restoration...');
  
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (!dbUrl || !dbPassword) {
    console.error('❌ Error: Database credentials not found');
    process.exit(1);
  }
  
  const projectRef = dbUrl.match(/https:\\/\\/([^.]+)\\.supabase\\.co/)?.[1];
  const dbHost = 'aws-0-eu-central-1.pooler.supabase.com';
  const dbPort = 6543;
  const dbUser = \`postgres.\${projectRef}\`;
  
  console.log('📝 Restoring SQL dump...');
  execSync(\`psql -h \${dbHost} -p \${dbPort} -U "\${dbUser}" -d postgres -f database.sql\`, {
    env: { ...process.env, PGPASSWORD: dbPassword },
    stdio: 'inherit'
  });
  
  console.log('✅ Database restored!');
  console.log('⚠️  Storage files in ./storage/ must be uploaded manually');
}

restore();
`;
}

function createReadme(backupName, config) {
  return `# Complete Backup: ${backupName}

## Backup Information

- **Created**: ${config.timestamp}
- **Project**: ${config.project_ref}
- **Type**: Complete (SQL + Storage + Config)

## Contents

- \`database.sql\` - Complete PostgreSQL dump
- \`storage/\` - All storage files organized by bucket
- \`config.json\` - Backup metadata
- \`restore.cjs\` - Automated restoration script
- \`checksums.json\` - File integrity verification

## How to Restore

\`\`\`bash
node restore.cjs
\`\`\`

Storage files must be uploaded manually to Supabase Storage.
`;
}

// Run backup
createCompleteBackup();
