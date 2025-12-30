#!/usr/bin/env node
/**
 * Backup Creation Script for Next.js 16 Migration
 * Creates a complete backup of the application before migration
 */

import { BackupManager } from '../../lib/migration/index.js'

async function main() {
  console.log('💾 Next.js 16 Migration - Backup Creation')
  console.log('=' .repeat(50))

  try {
    const backupManager = new BackupManager()
    
    console.log('\n📦 Creating full application backup...')
    console.log('This may take a few minutes depending on your project size.')
    
    const backup = await backupManager.createFullBackup()
    
    console.log('\n✅ Backup created successfully!')
    console.log(`   Backup ID: ${backup.id}`)
    console.log(`   Timestamp: ${backup.timestamp.toISOString()}`)
    console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Files: ${backup.includedFiles.length}`)
    console.log(`   Path: ${backup.path}`)
    
    console.log('\n🔍 Validating backup integrity...')
    const validation = await backupManager.validateBackup(backup.id)
    
    if (validation.success) {
      console.log('✅ Backup validation passed')
      console.log(`   Checksum: ${backup.checksum}`)
    } else {
      console.log('❌ Backup validation failed:')
      for (const error of validation.errors) {
        console.log(`   - ${error}`)
      }
      process.exit(1)
    }
    
    console.log('\n📸 Creating named snapshot...')
    const snapshot = await backupManager.createSnapshot('Pre-Next.js-16-Migration')
    
    console.log('✅ Snapshot created successfully!')
    console.log(`   Snapshot ID: ${snapshot.id}`)
    console.log(`   Label: ${snapshot.label}`)
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Backup is ready for migration')
    console.log('   2. Run: npm run migration:analyze')
    console.log('   3. Run: npm run migration:plan')
    console.log('   4. Run: npm run migration:execute')
    
    console.log('\n💡 Rollback Information:')
    console.log(`   To restore this backup: npm run migration:restore ${backup.id}`)
    console.log(`   To restore snapshot: npm run migration:restore-snapshot ${snapshot.id}`)
    
  } catch (error) {
    console.error('\n❌ Backup creation failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}