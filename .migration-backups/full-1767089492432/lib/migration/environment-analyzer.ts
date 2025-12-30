/**
 * Environment Analyzer for Next.js 16 Migration
 * Analyzes the current application environment and prepares migration data
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { glob } from 'glob'
import type { 
  ApplicationAnalysis, 
  DependencyInfo, 
  ConfigInfo, 
  FeatureInfo, 
  CoverageInfo,
  PerformanceMetrics 
} from './types'
import { CompatibilityChecker } from './compatibility-checker'
import { PerformanceAnalyzer } from './performance-analyzer'

export class EnvironmentAnalyzer {
  private compatibilityChecker: CompatibilityChecker
  private performanceAnalyzer: PerformanceAnalyzer

  constructor() {
    this.compatibilityChecker = new CompatibilityChecker()
    this.performanceAnalyzer = new PerformanceAnalyzer()
  }

  /**
   * Perform complete analysis of the current environment
   */
  async analyzeCurrentEnvironment(): Promise<ApplicationAnalysis> {
    console.log('Starting comprehensive environment analysis...')

    const [
      nextjsVersion,
      dependencies,
      configurations,
      features,
      testCoverage,
      performanceBaseline
    ] = await Promise.all([
      this.getCurrentNextjsVersion(),
      this.analyzeDependencies(),
      this.analyzeConfigurations(),
      this.analyzeCriticalFeatures(),
      this.analyzeTestCoverage(),
      this.performanceAnalyzer.establishBaseline()
    ])

    const analysis: ApplicationAnalysis = {
      nextjsVersion,
      dependencies,
      customConfigurations: configurations,
      criticalFeatures: features,
      testCoverage,
      performanceBaseline,
      timestamp: new Date()
    }

    // Save analysis results
    await this.saveAnalysis(analysis)

    return analysis
  }

  /**
   * Generate analysis report
   */
  async generateAnalysisReport(analysis: ApplicationAnalysis): Promise<string> {
    let report = '# Environment Analysis Report\n\n'
    report += `Generated: ${analysis.timestamp.toISOString()}\n\n`

    // Next.js Version
    report += `## Current Next.js Version\n\n`
    report += `- **Version**: ${analysis.nextjsVersion}\n`
    report += `- **Target**: Next.js 16.1.1\n\n`

    // Dependencies Summary
    report += `## Dependencies Analysis\n\n`
    report += `- **Total Dependencies**: ${analysis.dependencies.length}\n`
    
    const compatibleDeps = analysis.dependencies.filter(d => d.nextjs16Compatible)
    const incompatibleDeps = analysis.dependencies.filter(d => !d.nextjs16Compatible)
    const highRiskDeps = analysis.dependencies.filter(d => d.riskLevel === 'high')

    report += `- **Compatible**: ${compatibleDeps.length}\n`
    report += `- **Incompatible**: ${incompatibleDeps.length}\n`
    report += `- **High Risk**: ${highRiskDeps.length}\n\n`

    if (highRiskDeps.length > 0) {
      report += `### High Risk Dependencies\n\n`
      for (const dep of highRiskDeps) {
        report += `- **${dep.name}** (${dep.currentVersion})\n`
        if (dep.upgradeNotes) {
          report += `  - ${dep.upgradeNotes}\n`
        }
      }
      report += '\n'
    }

    // Configuration Files
    report += `## Configuration Files\n\n`
    const configsNeedingMigration = analysis.customConfigurations.filter(c => c.migrationRequired)
    report += `- **Total Config Files**: ${analysis.customConfigurations.length}\n`
    report += `- **Need Migration**: ${configsNeedingMigration.length}\n\n`

    if (configsNeedingMigration.length > 0) {
      report += `### Files Requiring Migration\n\n`
      for (const config of configsNeedingMigration) {
        report += `- **${config.file}** (${config.type})\n`
        for (const customization of config.customizations) {
          report += `  - ${customization}\n`
        }
      }
      report += '\n'
    }

    // Critical Features
    report += `## Critical Features\n\n`
    const criticalFeatures = analysis.criticalFeatures.filter(f => f.critical)
    report += `- **Total Features**: ${analysis.criticalFeatures.length}\n`
    report += `- **Critical Features**: ${criticalFeatures.length}\n\n`

    for (const feature of criticalFeatures) {
      report += `### ${feature.name} (${feature.type})\n`
      report += `- **Test Coverage**: ${feature.testCoverage}%\n`
      report += `- **Dependencies**: ${feature.dependencies.join(', ')}\n`
      report += `- **Validation Required**: ${feature.validationRequired ? 'Yes' : 'No'}\n\n`
    }

    // Test Coverage
    report += `## Test Coverage\n\n`
    report += `- **Overall Coverage**: ${analysis.testCoverage.percentage.toFixed(1)}%\n`
    report += `- **Total Lines**: ${analysis.testCoverage.totalLines}\n`
    report += `- **Covered Lines**: ${analysis.testCoverage.coveredLines}\n`
    
    if (analysis.testCoverage.uncoveredFiles.length > 0) {
      report += `- **Uncovered Files**: ${analysis.testCoverage.uncoveredFiles.length}\n\n`
      report += `### Files with Low Coverage\n\n`
      for (const file of analysis.testCoverage.uncoveredFiles.slice(0, 10)) {
        report += `- ${file}\n`
      }
      if (analysis.testCoverage.uncoveredFiles.length > 10) {
        report += `- ... and ${analysis.testCoverage.uncoveredFiles.length - 10} more\n`
      }
    }
    report += '\n'

    // Performance Baseline
    report += `## Performance Baseline\n\n`
    report += `- **Build Time**: ${(analysis.performanceBaseline.buildTime / 1000).toFixed(1)}s\n`
    report += `- **Bundle Size**: ${(analysis.performanceBaseline.bundleSize / 1024 / 1024).toFixed(1)} MB\n`
    report += `- **Page Load Time**: ${analysis.performanceBaseline.pageLoadTime.toFixed(0)}ms\n`
    report += `- **First Contentful Paint**: ${analysis.performanceBaseline.firstContentfulPaint.toFixed(0)}ms\n`
    report += `- **Largest Contentful Paint**: ${analysis.performanceBaseline.largestContentfulPaint.toFixed(0)}ms\n`
    report += `- **Cumulative Layout Shift**: ${analysis.performanceBaseline.cumulativeLayoutShift.toFixed(3)}\n\n`

    // Migration Readiness
    report += `## Migration Readiness Assessment\n\n`
    const readinessScore = this.calculateReadinessScore(analysis)
    report += `- **Readiness Score**: ${readinessScore}/100\n`
    
    if (readinessScore >= 80) {
      report += `- **Status**: ✅ Ready for migration\n`
    } else if (readinessScore >= 60) {
      report += `- **Status**: ⚠️ Needs preparation\n`
    } else {
      report += `- **Status**: ❌ Significant issues need resolution\n`
    }

    report += '\n## Recommendations\n\n'
    const recommendations = this.generateRecommendations(analysis)
    for (const recommendation of recommendations) {
      report += `- ${recommendation}\n`
    }

    return report
  }

  // Private analysis methods

  private async getCurrentNextjsVersion(): Promise<string> {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
      return packageJson.dependencies?.next || packageJson.devDependencies?.next || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    try {
      const analysis = await this.compatibilityChecker.analyzeDependencies()
      
      return [
        ...analysis.compatiblePackages.map(pkg => ({
          name: pkg.name,
          currentVersion: pkg.currentVersion,
          latestVersion: pkg.latestVersion,
          nextjs16Compatible: pkg.compatible,
          upgradeRequired: false,
          riskLevel: pkg.riskLevel
        })),
        ...analysis.incompatiblePackages.map(pkg => ({
          name: pkg.name,
          currentVersion: pkg.currentVersion,
          latestVersion: pkg.latestVersion,
          nextjs16Compatible: pkg.compatible,
          upgradeRequired: true,
          riskLevel: pkg.riskLevel,
          upgradeNotes: `Requires upgrade for Next.js 16 compatibility`
        })),
        ...analysis.unknownPackages.map(pkg => ({
          name: pkg.name,
          currentVersion: pkg.currentVersion,
          latestVersion: pkg.latestVersion,
          nextjs16Compatible: false,
          upgradeRequired: false,
          riskLevel: pkg.riskLevel,
          upgradeNotes: 'Compatibility unknown - requires testing'
        }))
      ]
    } catch (error) {
      console.warn('Failed to analyze dependencies:', error)
      return []
    }
  }

  private async analyzeConfigurations(): Promise<ConfigInfo[]> {
    const configs: ConfigInfo[] = []

    const configFiles = [
      { file: 'next.config.mjs', type: 'nextjs' as const },
      { file: 'next.config.js', type: 'nextjs' as const },
      { file: 'tailwind.config.ts', type: 'other' as const },
      { file: 'tailwind.config.js', type: 'other' as const },
      { file: 'tsconfig.json', type: 'typescript' as const },
      { file: 'postcss.config.mjs', type: 'other' as const },
      { file: '.eslintrc.json', type: 'eslint' as const },
      { file: 'jest.config.js', type: 'other' as const },
      { file: 'playwright.config.ts', type: 'other' as const },
      { file: 'vitest.config.ts', type: 'other' as const }
    ]

    for (const { file, type } of configFiles) {
      try {
        const exists = await fs.access(file).then(() => true).catch(() => false)
        if (exists) {
          const content = await fs.readFile(file, 'utf-8')
          const customizations = await this.analyzeConfigCustomizations(file, content, type)
          
          configs.push({
            file,
            type,
            customizations,
            migrationRequired: customizations.length > 0,
            backupRequired: true
          })
        }
      } catch (error) {
        console.warn(`Failed to analyze config file ${file}:`, error)
      }
    }

    return configs
  }

  private async analyzeConfigCustomizations(file: string, content: string, type: ConfigInfo['type']): Promise<string[]> {
    const customizations: string[] = []

    if (type === 'nextjs') {
      if (content.includes('experimental:')) {
        customizations.push('Uses experimental features')
      }
      if (content.includes('webpack:')) {
        customizations.push('Custom webpack configuration')
      }
      if (content.includes('rewrites')) {
        customizations.push('Custom URL rewrites')
      }
      if (content.includes('redirects')) {
        customizations.push('Custom redirects')
      }
      if (content.includes('headers')) {
        customizations.push('Custom headers')
      }
    }

    if (type === 'typescript') {
      if (content.includes('"strict"')) {
        customizations.push('TypeScript strict mode configuration')
      }
      if (content.includes('"paths"')) {
        customizations.push('Custom path mappings')
      }
    }

    return customizations
  }

  private async analyzeCriticalFeatures(): Promise<FeatureInfo[]> {
    const features: FeatureInfo[] = []

    // Analyze based on file patterns and imports
    const featurePatterns = [
      {
        name: 'Authentication',
        type: 'authentication' as const,
        patterns: ['**/auth/**', '**/login/**', '**/signup/**'],
        dependencies: ['@supabase/supabase-js', 'lucia', 'oslo'],
        critical: true
      },
      {
        name: 'Internationalization',
        type: 'i18n' as const,
        patterns: ['**/i18n/**', '**/messages/**', 'middleware.ts'],
        dependencies: ['next-intl'],
        critical: true
      },
      {
        name: 'Database Integration',
        type: 'database' as const,
        patterns: ['**/lib/supabase/**', '**/database/**'],
        dependencies: ['@supabase/supabase-js'],
        critical: true
      },
      {
        name: 'Payment Processing',
        type: 'payments' as const,
        patterns: ['**/payment/**', '**/billing/**'],
        dependencies: [],
        critical: true
      },
      {
        name: 'PDF Reports',
        type: 'reports' as const,
        patterns: ['**/reports/**', '**/pdf/**'],
        dependencies: ['jspdf', 'jspdf-autotable'],
        critical: true
      },
      {
        name: 'UI Components',
        type: 'ui' as const,
        patterns: ['**/components/**'],
        dependencies: ['@radix-ui/react-dialog', 'framer-motion'],
        critical: false
      }
    ]

    for (const pattern of featurePatterns) {
      try {
        const files = await glob(pattern.patterns, { 
          ignore: ['node_modules/**', '.next/**', '.git/**']
        })
        
        if (files.length > 0) {
          const testCoverage = await this.estimateFeatureTestCoverage(files)
          
          features.push({
            name: pattern.name,
            type: pattern.type,
            critical: pattern.critical,
            testCoverage,
            dependencies: pattern.dependencies,
            validationRequired: pattern.critical
          })
        }
      } catch (error) {
        console.warn(`Failed to analyze feature ${pattern.name}:`, error)
      }
    }

    return features
  }

  private async estimateFeatureTestCoverage(files: string[]): Promise<number> {
    // Simple heuristic: check if test files exist for feature files
    let totalFiles = files.length
    let testedFiles = 0

    for (const file of files) {
      const testPatterns = [
        file.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
        file.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
        file.replace(/^/, '__tests__/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1')
      ]

      for (const testPattern of testPatterns) {
        try {
          await fs.access(testPattern)
          testedFiles++
          break
        } catch {
          // Test file doesn't exist
        }
      }
    }

    return totalFiles > 0 ? (testedFiles / totalFiles) * 100 : 0
  }

  private async analyzeTestCoverage(): Promise<CoverageInfo> {
    try {
      // Try to read coverage report if it exists
      const coverageFile = 'coverage/coverage-summary.json'
      const exists = await fs.access(coverageFile).then(() => true).catch(() => false)
      
      if (exists) {
        const coverage = JSON.parse(await fs.readFile(coverageFile, 'utf-8'))
        const total = coverage.total
        
        return {
          totalLines: total.lines.total,
          coveredLines: total.lines.covered,
          percentage: total.lines.pct,
          uncoveredFiles: []
        }
      }
    } catch (error) {
      console.warn('Failed to read coverage report:', error)
    }

    // Fallback: estimate based on test files
    const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', '.git/**', '**/*.test.*', '**/*.spec.*', '__tests__/**']
    })

    const testFiles = await glob('**/*.{test,spec}.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', '.git/**']
    })

    const estimatedCoverage = sourceFiles.length > 0 ? (testFiles.length / sourceFiles.length) * 100 : 0

    return {
      totalLines: sourceFiles.length * 50, // Estimate 50 lines per file
      coveredLines: testFiles.length * 50,
      percentage: Math.min(estimatedCoverage, 100),
      uncoveredFiles: sourceFiles.slice(0, Math.max(0, sourceFiles.length - testFiles.length))
    }
  }

  private calculateReadinessScore(analysis: ApplicationAnalysis): number {
    let score = 100

    // Deduct points for incompatible dependencies
    const incompatibleDeps = analysis.dependencies.filter(d => !d.nextjs16Compatible)
    score -= incompatibleDeps.length * 5

    // Deduct points for high-risk dependencies
    const highRiskDeps = analysis.dependencies.filter(d => d.riskLevel === 'high')
    score -= highRiskDeps.length * 10

    // Deduct points for configurations needing migration
    const configsNeedingMigration = analysis.customConfigurations.filter(c => c.migrationRequired)
    score -= configsNeedingMigration.length * 5

    // Deduct points for low test coverage
    if (analysis.testCoverage.percentage < 50) {
      score -= 20
    } else if (analysis.testCoverage.percentage < 70) {
      score -= 10
    }

    // Deduct points for critical features without validation
    const criticalFeaturesWithoutValidation = analysis.criticalFeatures.filter(f => f.critical && !f.validationRequired)
    score -= criticalFeaturesWithoutValidation.length * 5

    return Math.max(0, score)
  }

  private generateRecommendations(analysis: ApplicationAnalysis): string[] {
    const recommendations: string[] = []

    const incompatibleDeps = analysis.dependencies.filter(d => !d.nextjs16Compatible)
    if (incompatibleDeps.length > 0) {
      recommendations.push(`Update ${incompatibleDeps.length} incompatible dependencies before migration`)
    }

    const highRiskDeps = analysis.dependencies.filter(d => d.riskLevel === 'high')
    if (highRiskDeps.length > 0) {
      recommendations.push(`Carefully test ${highRiskDeps.length} high-risk dependencies after migration`)
    }

    if (analysis.testCoverage.percentage < 70) {
      recommendations.push('Improve test coverage before migration to ensure better validation')
    }

    const configsNeedingMigration = analysis.customConfigurations.filter(c => c.migrationRequired)
    if (configsNeedingMigration.length > 0) {
      recommendations.push(`Review and update ${configsNeedingMigration.length} configuration files`)
    }

    const criticalFeatures = analysis.criticalFeatures.filter(f => f.critical)
    if (criticalFeatures.length > 0) {
      recommendations.push(`Thoroughly test ${criticalFeatures.length} critical features after migration`)
    }

    recommendations.push('Create a complete backup before starting migration')
    recommendations.push('Test migration in a development environment first')
    recommendations.push('Monitor performance metrics during and after migration')

    return recommendations
  }

  private async saveAnalysis(analysis: ApplicationAnalysis): Promise<void> {
    try {
      const analysisFile = '.migration-analysis.json'
      await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2))
      console.log(`Analysis saved to ${analysisFile}`)
    } catch (error) {
      console.warn('Failed to save analysis:', error)
    }
  }
}