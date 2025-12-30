#!/usr/bin/env tsx

/**
 * Migration Step 1: Analysis and Planning
 * Professional approach - step by step
 */

import { MigrationController } from '../lib/migration/migration-controller'
import { BackupManager } from '../lib/migration/backup-manager'

async function step1_AnalysisAndPlanning() {
  console.log('🚀 Migration Step 1: Analysis and Planning\n')
  
  try {
    // Initialize components
    console.log('📦 Initializing migration system...')
    const migrationController = new MigrationController()
    const backupManager = new BackupManager()
    console.log('✅ Migration system initialized\n')
    
    // Step 1.1: Create backup
    console.log('📦 Creating full backup of source application...')
    const backup = await backupManager.createFullBackup()
    console.log(`✅ Backup created successfully`)
    console.log(`   Backup ID: ${backup.id}`)
    console.log(`   Size: ${backup.size} bytes`)
    console.log(`   Files included: ${backup.includedFiles.length}\n`)
    
    // Step 1.2: Analyze current state
    console.log('🔍 Analyzing current application state...')
    const analysis = await migrationController.analyzeCurrent()
    console.log('✅ Analysis completed successfully')
    console.log(`   Next.js version: ${analysis.nextjsVersion}`)
    console.log(`   Dependencies: ${analysis.dependencies.length}`)
    console.log(`   Critical features: ${analysis.criticalFeatures.length}`)
    console.log(`   Test coverage: ${analysis.testCoverage.percentage}%\n`)
    
    // Step 1.3: Check compatibility
    console.log('🔧 Checking Next.js 16 compatibility...')
    const compatibilityReport = await migrationController.checkCompatibility()
    console.log('✅ Compatibility check completed')
    console.log(`   Overall compatible: ${compatibilityReport.overallCompatible}`)
    console.log(`   Compatible packages: ${compatibilityReport.compatiblePackages}`)
    console.log(`   Issues found: ${compatibilityReport.issues.length}\n`)
    
    // Step 1.4: Create migration plan
    console.log('📋 Creating detailed migration plan...')
    const plan = await migrationController.planMigration()
    console.log('✅ Migration plan created successfully')
    console.log(`   Total steps: ${plan.totalSteps}`)
    console.log(`   Estimated duration: ${plan.estimatedDuration} minutes`)
    console.log(`   Phases: ${plan.phases.length}\n`)
    
    console.log('🎉 Step 1 completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`✅ Backup created: ${backup.id}`)
    console.log(`✅ Application analyzed: ${analysis.criticalFeatures.length} features`)
    console.log(`✅ Compatibility checked: ${compatibilityReport.overallCompatible ? 'Compatible' : 'Issues found'}`)
    console.log(`✅ Migration plan ready: ${plan.totalSteps} steps`)
    
    console.log('\n🚀 Ready for Step 2: Execute Migration')
    console.log('Run: tsx scripts/migration-step2.ts')
    
  } catch (error) {
    console.error('\n❌ Step 1 failed!')
    console.error('Error:', error instanceof Error ? error.message : error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check that all migration components are properly installed')
    console.log('2. Verify file permissions')
    console.log('3. Check available disk space for backups')
    process.exit(1)
  }
}

// Execute
step1_AnalysisAndPlanning()