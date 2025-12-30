#!/usr/bin/env tsx
/**
 * Next.js 16 Migration - Compatibility Checker Script
 * 
 * This script analyzes the current application for Next.js 16 compatibility
 * and provides detailed recommendations for a safe migration.
 * 
 * Usage:
 *   npm run migration:compatibility
 *   or
 *   npx tsx scripts/migration/check-compatibility.ts
 */

import { CompatibilityChecker } from '../../lib/migration/compatibility-checker'
import chalk from 'chalk'

async function main() {
  console.log(chalk.blue.bold('🔍 Next.js 16 Migration Compatibility Checker\n'))
  
  try {
    const checker = new CompatibilityChecker()
    
    // Step 1: Analyze dependencies
    console.log(chalk.yellow('📦 Analyzing dependencies...'))
    const analysis = await checker.analyzeDependencies()
    
    console.log(`${chalk.green('✅')} Total packages: ${analysis.totalPackages}`)
    console.log(`${chalk.green('✅')} Compatible: ${analysis.compatiblePackages.length}`)
    console.log(`${chalk.yellow('⚠️ ')} Incompatible: ${analysis.incompatiblePackages.length}`)
    console.log(`${chalk.gray('❓')} Unknown: ${analysis.unknownPackages.length}`)
    
    // Show incompatible packages
    if (analysis.incompatiblePackages.length > 0) {
      console.log(chalk.red('\n❌ Incompatible packages:'))
      analysis.incompatiblePackages.forEach(pkg => {
        console.log(`  • ${pkg.name}@${pkg.currentVersion} (${pkg.riskLevel} risk)`)
      })
    }
    
    // Show upgrade recommendations
    if (analysis.recommendedUpgrades.length > 0) {
      console.log(chalk.blue('\n🔧 Recommended upgrades:'))
      analysis.recommendedUpgrades.forEach(upgrade => {
        console.log(`  • ${upgrade.packageName}: ${upgrade.fromVersion} → ${upgrade.toVersion}`)
        console.log(`    Reason: ${upgrade.reason}`)
        if (upgrade.breakingChanges.length > 0) {
          console.log(`    Breaking changes: ${upgrade.breakingChanges.join(', ')}`)
        }
      })
    }
    
    // Step 2: Check overall compatibility
    console.log(chalk.yellow('\n🚀 Checking Next.js 16 compatibility...'))
    const report = await checker.checkNextjs16Compatibility()
    
    if (report.overallCompatible) {
      console.log(chalk.green('✅ Your application is ready for Next.js 16 migration!'))
    } else {
      console.log(chalk.red('❌ Compatibility issues found that need to be resolved'))
    }
    
    console.log(`⏱️  Estimated migration time: ${report.estimatedMigrationTime} minutes`)
    
    // Show issues
    if (report.issues.length > 0) {
      console.log(chalk.red('\n📋 Issues to resolve:'))
      report.issues.forEach((issue, index) => {
        const severityColor = {
          low: chalk.yellow,
          medium: chalk.orange,
          high: chalk.red,
          critical: chalk.red.bold
        }[issue.severity] || chalk.gray
        
        console.log(`  ${index + 1}. ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.description}`)
        console.log(`     ${chalk.gray('Solution:')} ${issue.solution}`)
        console.log(`     ${chalk.gray('Files:')} ${issue.affectedFiles.join(', ')}`)
      })
    }
    
    // Show recommendations
    console.log(chalk.blue('\n💡 Recommendations:'))
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
    
    // Step 3: Show upgrade path
    console.log(chalk.yellow('\n🛤️  Migration Path:'))
    const upgradePath = checker.getUpgradePath()
    const path = upgradePath[0]
    
    console.log(`📅 Estimated duration: ${path.estimatedDuration} minutes`)
    console.log(`⚠️  Risk assessment: ${path.riskAssessment}`)
    console.log('\n📝 Steps:')
    
    path.steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step.description}`)
      if (step.command) {
        console.log(`     ${chalk.gray('Command:')} ${chalk.cyan(step.command)}`)
      }
      console.log(`     ${chalk.gray('Validation:')} ${step.validation}`)
    })
    
    // Step 4: Validate upgrade path
    console.log(chalk.yellow('\n🔍 Validating upgrade path...'))
    const validation = await checker.validateUpgradePath(path)
    
    if (validation.success) {
      console.log(chalk.green('✅ Upgrade path is valid and ready to execute'))
    } else {
      console.log(chalk.red('❌ Upgrade path validation failed'))
      validation.errors.forEach(error => {
        console.log(`  • ${chalk.red(error)}`)
      })
    }
    
    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'))
      validation.warnings.forEach(warning => {
        console.log(`  • ${chalk.yellow(warning)}`)
      })
    }
    
    // Final summary
    console.log(chalk.blue.bold('\n📊 Summary:'))
    console.log(`• Total packages analyzed: ${analysis.totalPackages}`)
    console.log(`• Compatibility issues: ${report.issues.length}`)
    console.log(`• Upgrade recommendations: ${analysis.recommendedUpgrades.length}`)
    console.log(`• Migration ready: ${report.overallCompatible ? chalk.green('Yes') : chalk.red('No')}`)
    
    if (!report.overallCompatible) {
      console.log(chalk.yellow('\n⚠️  Please resolve the compatibility issues before proceeding with migration.'))
      console.log(chalk.blue('💡 Run this script again after making the recommended changes.'))
    } else {
      console.log(chalk.green('\n🎉 Your application is ready for Next.js 16 migration!'))
      console.log(chalk.blue('💡 You can now proceed with the migration using the backup and migration tools.'))
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error during compatibility check:'), error)
    process.exit(1)
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as checkCompatibility }