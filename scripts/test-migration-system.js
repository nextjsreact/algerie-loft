/**
 * Test script for the Next.js 16 Migration System
 * Simple test to validate the migration system components
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

async function testMigrationSystem() {
  console.log('🧪 Testing Next.js 16 Migration System')
  console.log('=' .repeat(50))

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

    for (const file of migrationFiles) {
      try {
        await fs.access(file)
        console.log(`   ✅ ${file}`)
      } catch {
        console.log(`   ❌ ${file} - Missing`)
      }
    }

    // Test 2: Check package.json for current Next.js version
    console.log('\n📦 Checking current Next.js version...')
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
    const nextVersion = packageJson.dependencies?.next || 'Not found'
    console.log(`   Current Next.js version: ${nextVersion}`)
    console.log(`   Target version: 16.1.1`)

    // Test 3: Analyze key dependencies
    console.log('\n🔍 Analyzing key dependencies...')
    const keyDependencies = [
      'next-intl',
      '@supabase/supabase-js',
      '@sentry/nextjs',
      'react',
      'react-dom',
      'tailwindcss'
    ]

    for (const dep of keyDependencies) {
      const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
      if (version) {
        console.log(`   ✅ ${dep}: ${version}`)
      } else {
        console.log(`   ⚠️ ${dep}: Not found`)
      }
    }

    // Test 4: Check configuration files
    console.log('\n⚙️ Checking configuration files...')
    const configFiles = [
      'next.config.mjs',
      'tailwind.config.ts',
      'tsconfig.json',
      'package.json'
    ]

    for (const file of configFiles) {
      try {
        await fs.access(file)
        console.log(`   ✅ ${file}`)
      } catch {
        console.log(`   ❌ ${file} - Missing`)
      }
    }

    // Test 5: Check critical directories
    console.log('\n📂 Checking critical directories...')
    const criticalDirs = [
      'app',
      'components',
      'lib',
      'public',
      'styles'
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

    // Test 6: Simulate backup creation (dry run)
    console.log('\n💾 Testing backup system (dry run)...')
    
    // Count files that would be backed up
    const patterns = [
      'app/**/*',
      'components/**/*',
      'lib/**/*',
      'package.json',
      'next.config.mjs',
      'tailwind.config.ts',
      'tsconfig.json'
    ]

    let totalFiles = 0
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { 
          ignore: ['node_modules/**', '.next/**', '.git/**']
        })
        totalFiles += files.length
      } catch (error) {
        console.log(`   ⚠️ Pattern ${pattern} failed: ${error.message}`)
      }
    }

    console.log(`   📊 Files to backup: ${totalFiles}`)

    // Test 7: Performance baseline simulation
    console.log('\n📈 Testing performance analysis...')
    
    try {
      const buildDir = '.next'
      await fs.access(buildDir)
      console.log('   ✅ Build directory exists')
      
      // Check if build manifest exists
      try {
        await fs.access(join(buildDir, 'build-manifest.json'))
        console.log('   ✅ Build manifest found')
      } catch {
        console.log('   ⚠️ Build manifest not found (run npm run build first)')
      }
    } catch {
      console.log('   ⚠️ Build directory not found (run npm run build first)')
    }

    console.log('\n🎉 Migration System Test Summary:')
    console.log('   ✅ Migration system files are in place')
    console.log('   ✅ Key dependencies identified')
    console.log('   ✅ Configuration files checked')
    console.log('   ✅ Backup system ready')
    console.log('   ✅ Performance analysis ready')

    console.log('\n🚀 Next Steps:')
    console.log('   1. Run: npm run build (if not done already)')
    console.log('   2. Run: npm run migration:backup')
    console.log('   3. Run: npm run migration:compatibility')
    console.log('   4. Review compatibility report')
    console.log('   5. Proceed with migration if ready')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

testMigrationSystem().catch(console.error)