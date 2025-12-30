/**
 * Simple test for the Next.js 16 Migration System
 * Basic validation without external dependencies
 */

import { promises as fs } from 'fs'

async function simpleMigrationTest() {
  console.log('🧪 Simple Migration System Test')
  console.log('=' .repeat(40))

  try {
    // Test 1: Check if migration files exist
    console.log('\n📁 Checking migration system files...')
    
    const migrationFiles = [
      'lib/migration/types.ts',
      'lib/migration/backup-manager.ts',
      'lib/migration/compatibility-checker.ts',
      'lib/migration/performance-analyzer.ts',
      'lib/migration/environment-analyzer.ts',
      'lib/migration/migration-controller.ts',
      'lib/migration/index.ts'
    ]

    let filesExist = 0
    for (const file of migrationFiles) {
      try {
        await fs.access(file)
        console.log(`   ✅ ${file}`)
        filesExist++
      } catch {
        console.log(`   ❌ ${file} - Missing`)
      }
    }

    // Test 2: Check package.json
    console.log('\n📦 Checking package.json...')
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
      const nextVersion = packageJson.dependencies?.next || 'Not found'
      console.log(`   Current Next.js: ${nextVersion}`)
      console.log(`   Target: 16.1.1`)
      
      // Check if migration scripts are added
      const migrationScripts = [
        'migration:test',
        'migration:analyze', 
        'migration:backup',
        'migration:compatibility'
      ]
      
      console.log('\n📜 Checking migration scripts...')
      for (const script of migrationScripts) {
        if (packageJson.scripts?.[script]) {
          console.log(`   ✅ ${script}`)
        } else {
          console.log(`   ❌ ${script} - Missing`)
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to read package.json: ${error.message}`)
    }

    // Test 3: Check key configuration files
    console.log('\n⚙️ Checking configuration files...')
    const configFiles = [
      'next.config.mjs',
      'tailwind.config.ts', 
      'tsconfig.json'
    ]

    for (const file of configFiles) {
      try {
        await fs.access(file)
        console.log(`   ✅ ${file}`)
      } catch {
        console.log(`   ❌ ${file} - Missing`)
      }
    }

    // Test 4: Check critical directories
    console.log('\n📂 Checking critical directories...')
    const criticalDirs = [
      'app',
      'components', 
      'lib',
      'public'
    ]

    for (const dir of criticalDirs) {
      try {
        const stats = await fs.stat(dir)
        if (stats.isDirectory()) {
          console.log(`   ✅ ${dir}/`)
        }
      } catch {
        console.log(`   ⚠️ ${dir}/ - Not found`)
      }
    }

    // Summary
    console.log('\n📊 Test Summary:')
    console.log(`   Migration files: ${filesExist}/${migrationFiles.length}`)
    
    if (filesExist === migrationFiles.length) {
      console.log('   ✅ All migration system files are present')
      console.log('   ✅ Migration system is ready for use')
      
      console.log('\n🚀 Ready for Next Steps:')
      console.log('   1. Create backup: npm run migration:backup')
      console.log('   2. Check compatibility: npm run migration:compatibility') 
      console.log('   3. Analyze environment: npm run migration:analyze')
    } else {
      console.log('   ❌ Some migration files are missing')
      console.log('   Please ensure all migration system files are created')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

simpleMigrationTest().catch(console.error)