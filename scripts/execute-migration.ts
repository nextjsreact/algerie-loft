#!/usr/bin/env tsx

/**
 * Professional Migration Execution Script
 * Migrates the complete application from source to target directory
 */

import path from 'path'
import fs from 'fs/promises'
import { MigrationController } from '../lib/migration/migration-controller'
import { BackupManager } from '../lib/migration/backup-manager'

const SOURCE_DIR = process.cwd() // Current directory (algerie-loft)
const TARGET_DIR = path.join(process.cwd(), 'loft-algerie-next16')

async function executeProfessionalMigration() {
  console.log('🚀 Starting Professional Next.js 16 Migration...\n')
  
  const migrationController = new MigrationController()
  const backupManager = new BackupManager()
  
  try {
    // Step 1: Create full backup of source
    console.log('📦 Step 1: Creating full backup of source application...')
    const backup = await backupManager.createFullBackup()
    console.log(`✅ Backup created: ${backup.id}\n`)
    
    // Step 2: Analyze current application
    console.log('🔍 Step 2: Analyzing current application...')
    const analysis = await migrationController.analyzeCurrent()
    console.log(`✅ Analysis complete. Found ${analysis.criticalFeatures.length} critical features\n`)
    
    // Step 3: Check compatibility
    console.log('🔧 Step 3: Checking Next.js 16 compatibility...')
    const compatibilityReport = await migrationController.checkCompatibility()
    console.log(`✅ Compatibility check complete. Overall compatible: ${compatibilityReport.overallCompatible}\n`)
    
    // Step 4: Create migration plan
    console.log('📋 Step 4: Creating migration plan...')
    const plan = await migrationController.planMigration()
    console.log(`✅ Migration plan created with ${plan.totalSteps} steps\n`)
    
    // Step 5: Execute migration to target directory
    console.log('⚡ Step 5: Executing migration to target directory...')
    console.log(`Source: ${SOURCE_DIR}`)
    console.log(`Target: ${TARGET_DIR}`)
    
    // Ensure target directory exists
    await fs.mkdir(TARGET_DIR, { recursive: true })
    
    const result = await migrationController.executeMigration(plan)
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!')
      console.log(`✅ All ${result.completedSteps} steps completed`)
      console.log(`📁 Migrated application is now in: ${TARGET_DIR}`)
      console.log('\n📋 Next steps:')
      console.log('1. Test the migrated application in the target directory')
      console.log('2. Run validation tests')
      console.log('3. Fix any remaining issues in the target directory')
      console.log('4. Only after full validation, replace the source')
    } else {
      console.log('\n❌ Migration failed!')
      console.log(`Error: ${result.error}`)
      console.log('Initiating automatic rollback...')
      
      const rollbackResult = await migrationController.executeAutomaticRollback()
      if (rollbackResult.success) {
        console.log('✅ Rollback completed successfully')
      } else {
        console.log('❌ Rollback failed! Manual intervention required')
      }
    }
    
  } catch (error) {
    console.error('\n💥 Critical error during migration:')
    console.error(error)
    console.log('\nInitiating emergency rollback...')
    
    try {
      const rollbackResult = await migrationController.executeAutomaticRollback()
      if (rollbackResult.success) {
        console.log('✅ Emergency rollback completed')
      } else {
        console.log('❌ Emergency rollback failed! Source may be compromised!')
      }
    } catch (rollbackError) {
      console.error('💥 Emergency rollback failed:', rollbackError)
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeProfessionalMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { executeProfessionalMigration }