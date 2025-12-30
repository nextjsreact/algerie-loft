/**
 * Compatibility Checker for Next.js 16 Migration
 * Analyzes dependencies and configurations for Next.js 16 compatibility
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type {
  DependencyAnalysis,
  CompatibilityReport,
  UpgradePath,
  ValidationResult,
  CompatibilityResult,
  PackageInfo,
  UpgradeRecommendation,
  CompatibilityIssue
} from './types'

export class CompatibilityChecker {
  private packageJsonPath: string
  private nextConfigPath: string

  constructor(
    packageJsonPath = 'package.json',
    nextConfigPath = 'next.config.mjs'
  ) {
    this.packageJsonPath = packageJsonPath
    this.nextConfigPath = nextConfigPath
  }

  /**
   * Analyze all dependencies for Next.js 16 compatibility
   */
  async analyzeDependencies(): Promise<DependencyAnalysis> {
    const packageJson = await this.readPackageJson()
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    const compatiblePackages: PackageInfo[] = []
    const incompatiblePackages: PackageInfo[] = []
    const unknownPackages: PackageInfo[] = []
    const recommendedUpgrades: UpgradeRecommendation[] = []

    for (const [name, version] of Object.entries(allDependencies)) {
      const packageInfo = await this.analyzePackage(name, version as string)
      
      if (packageInfo.compatible) {
        compatiblePackages.push(packageInfo)
      } else if (packageInfo.riskLevel === 'high') {
        incompatiblePackages.push(packageInfo)
        
        // Generate upgrade recommendation
        const upgrade = await this.generateUpgradeRecommendation(packageInfo)
        if (upgrade) {
          recommendedUpgrades.push(upgrade)
        }
      } else {
        unknownPackages.push(packageInfo)
      }
    }

    return {
      totalPackages: Object.keys(allDependencies).length,
      compatiblePackages,
      incompatiblePackages,
      unknownPackages,
      recommendedUpgrades
    }
  }

  /**
   * Check overall Next.js 16 compatibility
   */
  async checkNextjs16Compatibility(): Promise<CompatibilityReport> {
    const issues: CompatibilityIssue[] = []
    const recommendations: string[] = []
    let estimatedMigrationTime = 0

    // Check current Next.js version
    const packageJson = await this.readPackageJson()
    const currentNextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next
    
    if (!currentNextVersion) {
      issues.push({
        type: 'dependency',
        severity: 'critical',
        description: 'Next.js is not installed',
        affectedFiles: ['package.json'],
        solution: 'Install Next.js 16.1.1'
      })
      estimatedMigrationTime += 30
    } else {
      const versionNumber = this.extractVersionNumber(currentNextVersion)
      if (versionNumber < 16) {
        issues.push({
          type: 'dependency',
          severity: 'high',
          description: `Next.js version ${currentNextVersion} needs upgrade to 16.x`,
          affectedFiles: ['package.json'],
          solution: 'Upgrade to Next.js 16.1.1'
        })
        estimatedMigrationTime += 60
      }
    }

    // Check React version compatibility
    const reactVersion = packageJson.dependencies?.react
    if (reactVersion) {
      const reactVersionNumber = this.extractVersionNumber(reactVersion)
      if (reactVersionNumber < 18) {
        issues.push({
          type: 'dependency',
          severity: 'high',
          description: `React version ${reactVersion} is not compatible with Next.js 16`,
          affectedFiles: ['package.json'],
          solution: 'Upgrade React to version 18 or higher'
        })
        estimatedMigrationTime += 45
      }
    }

    // Check critical dependencies
    const criticalDeps = await this.checkCriticalDependencies(packageJson)
    issues.push(...criticalDeps.issues)
    estimatedMigrationTime += criticalDeps.estimatedTime

    // Check configuration files
    const configIssues = await this.checkConfigurationFiles()
    issues.push(...configIssues.issues)
    estimatedMigrationTime += configIssues.estimatedTime

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('Your application appears to be ready for Next.js 16 migration')
    } else {
      recommendations.push('Review and resolve the identified compatibility issues before migration')
      recommendations.push('Create a backup before starting the migration process')
      recommendations.push('Test the migration in a development environment first')
    }

    return {
      overallCompatible: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      recommendations,
      estimatedMigrationTime
    }
  }

  /**
   * Get upgrade path for the migration
   */
  getUpgradePath(): UpgradePath[] {
    return [
      {
        steps: [
          {
            id: 'backup',
            description: 'Create full application backup',
            validation: 'Verify backup integrity'
          },
          {
            id: 'update-next',
            description: 'Update Next.js to version 16.1.1',
            command: 'npm install next@16.1.1',
            validation: 'Check Next.js version in package.json'
          },
          {
            id: 'update-react',
            description: 'Update React to compatible version',
            command: 'npm install react@^18 react-dom@^18',
            validation: 'Verify React version compatibility'
          },
          {
            id: 'update-deps',
            description: 'Update other dependencies',
            validation: 'Run dependency compatibility check'
          },
          {
            id: 'test-build',
            description: 'Test application build',
            command: 'npm run build',
            validation: 'Successful build without errors'
          },
          {
            id: 'test-functionality',
            description: 'Test critical functionality',
            validation: 'All tests pass and features work'
          }
        ],
        estimatedDuration: 120, // minutes
        riskAssessment: 'Medium risk - thorough testing required'
      }
    ]
  }

  /**
   * Validate a specific upgrade path
   */
  async validateUpgradePath(path: UpgradePath): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if all required tools are available
    const requiredCommands = path.steps
      .map(step => step.command)
      .filter(Boolean)
      .map(cmd => cmd!.split(' ')[0])

    for (const cmd of requiredCommands) {
      const available = await this.isCommandAvailable(cmd)
      if (!available) {
        errors.push(`Required command '${cmd}' is not available`)
      }
    }

    // Validate step dependencies
    for (const step of path.steps) {
      if (step.files) {
        for (const file of step.files) {
          const exists = await fs.access(file).then(() => true).catch(() => false)
          if (!exists) {
            warnings.push(`File ${file} referenced in step '${step.id}' does not exist`)
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      details: {
        totalSteps: path.steps.length,
        estimatedDuration: path.estimatedDuration
      }
    }
  }

  /**
   * Test compatibility of a specific package
   */
  async testPackageCompatibility(packageName: string, version: string): Promise<CompatibilityResult> {
    const knownCompatibility = this.getKnownCompatibility(packageName, version)
    
    if (knownCompatibility) {
      return knownCompatibility
    }

    // For unknown packages, provide conservative assessment
    return {
      compatible: false,
      version,
      issues: ['Compatibility with Next.js 16 is unknown'],
      recommendations: [
        'Check package documentation for Next.js 16 compatibility',
        'Test package functionality after migration',
        'Consider finding alternative packages if issues arise'
      ]
    }
  }

  // Private helper methods

  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile(this.packageJsonPath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async analyzePackage(name: string, version: string): Promise<PackageInfo> {
    const compatibility = await this.testPackageCompatibility(name, version)
    
    return {
      name,
      currentVersion: version,
      latestVersion: version, // Would need to fetch from npm registry in real implementation
      nextjs16Version: this.getRecommendedVersion(name),
      compatible: compatibility.compatible,
      riskLevel: this.assessRiskLevel(name, compatibility)
    }
  }

  private extractVersionNumber(version: string): number {
    const match = version.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  private getKnownCompatibility(packageName: string, version: string): CompatibilityResult | null {
    // Known compatibility matrix for common packages
    const compatibilityMatrix: Record<string, CompatibilityResult> = {
      'next-intl': {
        compatible: true,
        version,
        issues: [],
        recommendations: ['next-intl 4.3.5+ is compatible with Next.js 16']
      },
      '@radix-ui/react-dialog': {
        compatible: true,
        version,
        issues: [],
        recommendations: ['Radix UI components are compatible with Next.js 16']
      },
      '@supabase/supabase-js': {
        compatible: true,
        version,
        issues: [],
        recommendations: ['Supabase client is compatible with Next.js 16']
      },
      'framer-motion': {
        compatible: true,
        version,
        issues: [],
        recommendations: ['Framer Motion is compatible with Next.js 16']
      },
      'tailwindcss': {
        compatible: true,
        version,
        issues: [],
        recommendations: ['Tailwind CSS is compatible with Next.js 16']
      },
      '@sentry/nextjs': {
        compatible: true,
        version,
        issues: [],
        recommendations: ['Sentry Next.js SDK is compatible with Next.js 16']
      },
      'react': {
        compatible: this.extractVersionNumber(version) >= 18,
        version,
        issues: this.extractVersionNumber(version) < 18 ? ['React 18+ required for Next.js 16'] : [],
        recommendations: this.extractVersionNumber(version) < 18 ? ['Upgrade to React 18'] : []
      },
      'react-dom': {
        compatible: this.extractVersionNumber(version) >= 18,
        version,
        issues: this.extractVersionNumber(version) < 18 ? ['React DOM 18+ required for Next.js 16'] : [],
        recommendations: this.extractVersionNumber(version) < 18 ? ['Upgrade to React DOM 18'] : []
      }
    }

    return compatibilityMatrix[packageName] || null
  }

  private getRecommendedVersion(packageName: string): string | undefined {
    const recommendations: Record<string, string> = {
      'next-intl': '^4.3.5',
      'react': '^18',
      'react-dom': '^18',
      '@sentry/nextjs': '^10.20.0',
      'tailwindcss': '^3.4.17'
    }

    return recommendations[packageName]
  }

  private assessRiskLevel(packageName: string, compatibility: CompatibilityResult): 'low' | 'medium' | 'high' {
    if (compatibility.compatible) {
      return 'low'
    }

    // Critical packages that could break the application
    const criticalPackages = ['react', 'react-dom', 'next-intl', '@sentry/nextjs']
    if (criticalPackages.includes(packageName)) {
      return 'high'
    }

    return 'medium'
  }

  private async generateUpgradeRecommendation(packageInfo: PackageInfo): Promise<UpgradeRecommendation | null> {
    if (packageInfo.compatible) {
      return null
    }

    const recommendedVersion = this.getRecommendedVersion(packageInfo.name)
    if (!recommendedVersion) {
      return null
    }

    return {
      packageName: packageInfo.name,
      fromVersion: packageInfo.currentVersion,
      toVersion: recommendedVersion,
      reason: 'Required for Next.js 16 compatibility',
      breakingChanges: this.getKnownBreakingChanges(packageInfo.name),
      migrationSteps: [
        `Update ${packageInfo.name} to ${recommendedVersion}`,
        'Test functionality after upgrade',
        'Update any deprecated API usage'
      ]
    }
  }

  private getKnownBreakingChanges(packageName: string): string[] {
    const breakingChanges: Record<string, string[]> = {
      'react': [
        'Automatic batching changes',
        'Stricter StrictMode behavior',
        'New JSX transform (if not already using)'
      ],
      'react-dom': [
        'createRoot API changes',
        'Hydration warnings are now errors',
        'Suspense behavior changes'
      ]
    }

    return breakingChanges[packageName] || []
  }

  private async checkCriticalDependencies(packageJson: any): Promise<{ issues: CompatibilityIssue[], estimatedTime: number }> {
    const issues: CompatibilityIssue[] = []
    let estimatedTime = 0

    const criticalDeps = [
      'next-intl',
      '@supabase/supabase-js',
      '@sentry/nextjs',
      'tailwindcss'
    ]

    for (const dep of criticalDeps) {
      const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
      if (version) {
        const compatibility = await this.testPackageCompatibility(dep, version)
        if (!compatibility.compatible) {
          issues.push({
            type: 'dependency',
            severity: 'medium',
            description: `${dep} may have compatibility issues with Next.js 16`,
            affectedFiles: ['package.json'],
            solution: `Update ${dep} to a Next.js 16 compatible version`
          })
          estimatedTime += 15
        }
      }
    }

    return { issues, estimatedTime }
  }

  private async checkConfigurationFiles(): Promise<{ issues: CompatibilityIssue[], estimatedTime: number }> {
    const issues: CompatibilityIssue[] = []
    let estimatedTime = 0

    // Check next.config.mjs
    try {
      const configExists = await fs.access(this.nextConfigPath).then(() => true).catch(() => false)
      if (configExists) {
        const configContent = await fs.readFile(this.nextConfigPath, 'utf-8')
        
        // Check for potential issues
        if (configContent.includes('experimental.')) {
          issues.push({
            type: 'configuration',
            severity: 'medium',
            description: 'Experimental features in next.config.mjs may need review',
            affectedFiles: [this.nextConfigPath],
            solution: 'Review experimental features for Next.js 16 compatibility'
          })
          estimatedTime += 20
        }

        if (configContent.includes('webpack:')) {
          issues.push({
            type: 'configuration',
            severity: 'low',
            description: 'Custom webpack configuration may need updates',
            affectedFiles: [this.nextConfigPath],
            solution: 'Test webpack configuration with Next.js 16'
          })
          estimatedTime += 15
        }
      }
    } catch (error) {
      // Config file issues are not critical
    }

    return { issues, estimatedTime }
  }

  private async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      await execAsync(`${command} --version`)
      return true
    } catch {
      return false
    }
  }
}