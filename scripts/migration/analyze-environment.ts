#!/usr/bin/env node
/**
 * Environment Analysis Script for Next.js 16 Migration
 * Analyzes the current application environment and generates a comprehensive report
 */

import { MigrationController, EnvironmentAnalyzer } from '../../lib/migration/index.js'
import { promises as fs } from 'fs'

async function main() {
  console.log('🔍 Next.js 16 Migration - Environment Analysis')
  console.log('=' .repeat(50))

  try {
    const controller = new MigrationController()
    const environmentAnalyzer = new EnvironmentAnalyzer()
    
    // Perform comprehensive analysis
    console.log('\n📊 Analyzing current environment...')
    const analysis = await controller.analyzeCurrent()
    
    // Generate detailed report
    console.log('\n📝 Generating analysis report...')
    const report = await environmentAnalyzer.generateAnalysisReport(analysis)
    
    // Save report to file
    const reportFile = 'migration-analysis-report.md'
    await fs.writeFile(reportFile, report)
    
    console.log(`\n✅ Analysis completed successfully!`)
    console.log(`📄 Report saved to: ${reportFile}`)
    
    // Display summary
    console.log('\n📋 Analysis Summary:')
    console.log(`   Next.js Version: ${analysis.nextjsVersion}`)
    console.log(`   Total Dependencies: ${analysis.dependencies.length}`)
    
    const incompatibleDeps = analysis.dependencies.filter(d => !d.nextjs16Compatible)
    const highRiskDeps = analysis.dependencies.filter(d => d.riskLevel === 'high')
    
    console.log(`   Incompatible Dependencies: ${incompatibleDeps.length}`)
    console.log(`   High Risk Dependencies: ${highRiskDeps.length}`)
    console.log(`   Test Coverage: ${analysis.testCoverage.percentage.toFixed(1)}%`)
    console.log(`   Critical Features: ${analysis.criticalFeatures.filter(f => f.critical).length}`)
    
    // Show readiness assessment
    const readinessScore = calculateReadinessScore(analysis)
    console.log(`   Migration Readiness: ${readinessScore}/100`)
    
    if (readinessScore >= 80) {
      console.log('   Status: ✅ Ready for migration')
    } else if (readinessScore >= 60) {
      console.log('   Status: ⚠️ Needs preparation')
    } else {
      console.log('   Status: ❌ Significant issues need resolution')
    }
    
    // Show next steps
    console.log('\n🚀 Next Steps:')
    if (incompatibleDeps.length > 0) {
      console.log('   1. Review and update incompatible dependencies')
    }
    if (analysis.testCoverage.percentage < 70) {
      console.log('   2. Improve test coverage for better validation')
    }
    console.log('   3. Create a backup before starting migration')
    console.log('   4. Run: npm run migration:create-backup')
    console.log('   5. Run: npm run migration:plan')
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

function calculateReadinessScore(analysis: any): number {
  let score = 100

  const incompatibleDeps = analysis.dependencies.filter((d: any) => !d.nextjs16Compatible)
  score -= incompatibleDeps.length * 5

  const highRiskDeps = analysis.dependencies.filter((d: any) => d.riskLevel === 'high')
  score -= highRiskDeps.length * 10

  const configsNeedingMigration = analysis.customConfigurations.filter((c: any) => c.migrationRequired)
  score -= configsNeedingMigration.length * 5

  if (analysis.testCoverage.percentage < 50) {
    score -= 20
  } else if (analysis.testCoverage.percentage < 70) {
    score -= 10
  }

  return Math.max(0, score)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}