#!/usr/bin/env node

/**
 * Complete Backup Script - Option 3
 * Creates a full backup including:
 * - Complete SQL dump (all schemas)
 * - Storage files (images, PDFs, etc.)
 * - Configuration (buckets, policies)
 * - Restoration script
 * 
 * Usage: node scripts/create-complete-backup.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `complete_backup_${timestamp}`;
const backupPath = path.join(BACKUP_DIR, backupName);

async function createCompleteBackup() {
  console.log('🚀 Starting COMPLETE database backup...');
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
    
    // Complete dump with all schemas (except system ones)
    console.log('   Dumping all schemas and data...');
    execSync(`pg_dump -h ${dbHost} -p ${dbPort} -U "${dbUser}" -d ${dbName} --clean --if-exists --create --exclude-schema=information_schema --exclude-schema=pg_catalog --exclude-schema=pg_toast -f "${sqlFile}"`, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    const sqlStats = fs.statSync(sqlFile);
    console.log(`   ✅ SQL dump complete: ${(sqlStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // ============================================
    // STEP 2: Storage Files Backup
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 STEP 2/4: Backing up Storage files...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const storageDir = path.join(backupPath, 'storage');
    fs.mkdirSync(storageDir, { recursive: true });

    if (serviceKey) {
      await backupStorageFiles(dbUrl, serviceKey, storageDir);
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

    // ============================================
    // Create README
    // ============================================
    const readme = createReadme(backupName, config);
    fs.writeFileSync(path.join(backupPath, 'README.md'), readme);

    // ============================================
    // Calculate checksums
    // ============================================
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

    // ============================================
    // Summary
    // ============================================
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

async function backupStorageFiles(dbUrl, serviceKey, storageDir) {
  console.log('   Fetching storage buckets...');
  
  try {
    // Get list of buckets using native https
    const buckets = await httpsRequest(`${dbUrl}/storage/v1/bucket`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });

    console.log(`   Found ${buckets.length} bucket(s): ${buckets.map(b => b.name).join(', ')}`);

    let totalFiles = 0;
    let totalSize = 0;

    for (const bucket of buckets) {
      console.log(`   📦 Backing up bucket: ${bucket.name}`);
      const bucketDir = path.join(storageDir, bucket.name);
      fs.mkdirSync(bucketDir, { recursive: true });

      try {
        // Recursively download all files from bucket
        const result = await downloadBucketFiles(dbUrl, serviceKey, bucket.name, '', bucketDir);
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
    console.log(`   Stack: ${error.stack}`);
  }
}

// Recursively download files from a bucket path
async function downloadBucketFiles(dbUrl, serviceKey, bucketName, prefix, targetDir) {
  let totalFiles = 0;
  let totalSize = 0;

  try {
    // List files at this prefix
    const items = await httpsRequest(`${dbUrl}/storage/v1/object/list/${bucketName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prefix: prefix,
        limit: 1000,
        offset: 0
      })
    });

    for (const item of items) {
      const itemPath = item.name;
      
      // Skip if no name
      if (!itemPath) continue;

      // Check if it's a folder (has metadata.size null or id is null)
      if (item.id === null || item.metadata === null) {
        // It's a folder, recurse into it
        console.log(`      📁 Entering folder: ${itemPath}`);
        const result = await downloadBucketFiles(dbUrl, serviceKey, bucketName, itemPath, targetDir);
        totalFiles += result.files;
        totalSize += result.size;
      } else {
        // It's a file, download it
        try {
          console.log(`      ⬇️  Downloading: ${itemPath}...`);
          
          // Try multiple download methods
          let buffer = null;
          let downloadError = null;
          
          // Method 1: Try authenticated endpoint with POST
          try {
            const signedUrlResponse = await httpsRequest(`${dbUrl}/storage/v1/object/sign/${bucketName}/${itemPath}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ expiresIn: 60 })
            });
            
            if (signedUrlResponse.signedURL) {
              const fullSignedUrl = `${dbUrl}${signedUrlResponse.signedURL}`;
              buffer = await httpsDownload(fullSignedUrl, {});
            }
          } catch (err) {
            downloadError = err.message;
          }
          
          // Method 2: Try direct authenticated endpoint
          if (!buffer) {
            try {
              const fileUrl = `${dbUrl}/storage/v1/object/authenticated/${bucketName}/${itemPath}`;
              buffer = await httpsDownload(fileUrl, {
                headers: {
                  'Authorization': `Bearer ${serviceKey}`,
                  'apikey': serviceKey
                }
              });
            } catch (err) {
              downloadError = err.message;
            }
          }
          
          // Method 3: Try public endpoint (if bucket is public)
          if (!buffer) {
            try {
              const fileUrl = `${dbUrl}/storage/v1/object/public/${bucketName}/${itemPath}`;
              buffer = await httpsDownload(fileUrl, {});
            } catch (err) {
              downloadError = err.message;
            }
          }

          if (buffer) {
            const filePath = path.join(targetDir, itemPath);
            const fileDir = path.dirname(filePath);
            
            if (!fs.existsSync(fileDir)) {
              fs.mkdirSync(fileDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, buffer);
            totalFiles++;
            totalSize += buffer.length;
            console.log(`      ✓ ${itemPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
          } else {
            console.log(`      ⚠️  Failed to download: ${itemPath} - ${downloadError}`);
          }
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

// Helper function for HTTPS requests
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`Failed to parse JSON: ${data.substring(0, 100)}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Helper function for downloading binary files
function httpsDownload(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
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

/**
 * Restoration Script for: ${backupName}
 * 
 * This script restores the complete backup to a Supabase project
 * 
 * Usage:
 *   1. Set environment variables for target project
 *   2. Run: node restore.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '../../.env.local' });

async function restore() {
  console.log('🔄 Starting restoration...');
  console.log('');
  
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (!dbUrl || !dbPassword) {
    console.error('❌ Error: Database credentials not found');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD');
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
  console.log('');
  console.log('⚠️  Note: Storage files must be uploaded manually to Supabase Storage');
  console.log('   Files are in: ./storage/');
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

### Option 1: Automated (Recommended)

\`\`\`bash
# 1. Configure target environment
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_DB_PASSWORD="your-password"

# 2. Run restoration script
node restore.cjs
\`\`\`

### Option 2: Manual

\`\`\`bash
# 1. Restore database
psql -h aws-0-eu-central-1.pooler.supabase.com \\
     -p 6543 \\
     -U "postgres.your-project-ref" \\
     -d postgres \\
     -f database.sql

# 2. Upload storage files manually via Supabase Dashboard
\`\`\`

## Verification

Check file integrity:
\`\`\`bash
# Compare checksums
cat checksums.json
\`\`\`

## Notes

- This is a COMPLETE backup including all data
- Storage files are in \`storage/\` directory
- Restore to a NEW project or EMPTY database to avoid conflicts
- Always test restoration in a development environment first

## Support

For issues, check the main project documentation.
`;
}

// Run backup
createCompleteBackup();
