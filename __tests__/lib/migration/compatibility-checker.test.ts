/**
 * Tests for CompatibilityChecker - Next.js 16 Migration System
 * Validates dependency analysis, compatibility checking, and upgrade recommendations
 */

import { CompatibilityChecker } from '@/lib/migration/compatibility-checker'
import { promises as fs } from 'fs'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import type { 
  DependencyAnalysis, 
  CompatibilityReport, 
  UpgradePath, 
  ValidationResult, 
  CompatibilityResult 
} from '@/lib/migration/types'

// Mock file system operations for testing
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    access: vi.fn(),
  }
}))

// Mock child_process for command availability checks
vi.mock('child_process', () => ({
  exec: vi.fn()
}))

describe('CompatibilityChecker', () => {
  let compatibilityChecker: CompatibilityChecker
  
  const mockPackageJson = {
    name: 'test-app',
    version: '1.0.0',
    dependencies: {
      'next': '^15.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'next-intl': '^4.3.5',
      '@supabase/supabase-js': '^2.50.3',
      '@radix-ui/react-dialog': '^1.1.4',
      'framer-motion': '^12.23.24',
      'tailwindcss': '^3.4.17',
      '@sentry/nextjs': '^10.20.0'
    },
    devDependencies: {
      'typescript': '^5.8.3',
      '@types/react': '^18.0.0',
      'eslint': '^9.32.0'
    }
  }

  const mockNextConfig = `
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      experimental: {
        appDir: true
      },
      webpack: (config) => {
        return config
      }
    }
    export default nextConfig
  `

  beforeEach(() => {
    compatibilityChecker = new CompatibilityChecker()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('analyzeDependencies', () => {
    it('should analyze all dependencies and categorize them correctly', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockPackageJson))

      const analysis: DependencyAnalysis = await compatibilityChecker.analyzeDependencies()

      expect(analysis).toBeDefined()
      expect(analysis.totalPackages).toBe(12) // 9 deps + 3 devDeps
      expect(analysis.compatiblePackages).toBeDefined()
      expect(analysis.incompatiblePackages).toBeDefined()
      expect(analysis.unknownPackages).toBeDefined()
      expect(analysis.recommendedUpgrades).toBeDefined()

      // Should identify Next.js as needing upgrade
      const nextjsPackage = [...analysis.compatiblePackages, ...analysis.incompatiblePackages]
        .find(pkg => pkg.name === 'next')
      expect(nextjsPackage).toBeDefined()
    })

    it('should identify compatible packages correctly', async () => {
      const compatiblePackageJson = {
        ...mockPackageJson,
        dependencies: {
          ...mockPackageJson.dependencies,
          'next': '^16.1.1', // Already compatible
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        }
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(compatiblePackageJson))

      const analysis = await compatibilityChecker.analyzeDependencies()

      const reactPackage = analysis.compatiblePackages.find(pkg => pkg.name === 'react')
      expect(reactPackage).toBeDefined()
      expect(reactPackage?.compatible).toBe(true)
      expect(reactPackage?.riskLevel).toBe('low')
    })

    it('should identify incompatible packages and generate upgrade recommendations', async () => {
      const incompatiblePackageJson = {
        ...mockPackageJson,
        dependencies: {
          ...mockPackageJson.dependencies,
          'react': '^17.0.0', // Incompatible with Next.js 16
          'react-dom': '^17.0.0'
        }
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(incompatiblePackageJson))

      const analysis = await compatibilityChecker.analyzeDependencies()

      const reactUpgrade = analysis.recommendedUpgrades.find(upgrade => upgrade.packageName === 'react')
      expect(reactUpgrade).toBeDefined()
      expect(reactUpgrade?.fromVersion).toBe('^17.0.0')
      expect(reactUpgrade?.toVersion).toBe('^18')
      expect(reactUpgrade?.reason).toContain('Next.js 16 compatibility')
    })

    it('should handle missing package.json gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      await expect(compatibilityChecker.analyzeDependencies()).rejects.toThrow('Failed to read package.json')
    })
  })

  describe('checkNextjs16Compatibility', () => {
    it('should identify Next.js version compatibility issues', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockPackageJson))
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const report: CompatibilityReport = await compatibilityChecker.checkNextjs16Compatibility()

      expect(report).toBeDefined()
      expect(report.overallCompatible).toBeDefined()
      expect(report.issues).toBeDefined()
      expect(report.recommendations).toBeDefined()
      expect(report.estimatedMigrationTime).toBeGreaterThan(0)

      // Should identify Next.js upgrade needed
      const nextjsIssue = report.issues.find(issue => 
        issue.description.includes('Next.js version') && issue.description.includes('upgrade')
      )
      expect(nextjsIssue).toBeDefined()
      expect(nextjsIssue?.severity).toBe('high')
    })

    it('should identify React version compatibility issues', async () => {
      const incompatibleReactPackageJson = {
        ...mockPackageJson,
        dependencies: {
          ...mockPackageJson.dependencies,
          'react': '^17.0.0'
        }
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(incompatibleReactPackageJson))
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const report = await compatibilityChecker.checkNextjs16Compatibility()

      const reactIssue = report.issues.find(issue => 
        issue.description.includes('React version') && issue.description.includes('not compatible')
      )
      expect(reactIssue).toBeDefined()
      expect(reactIssue?.severity).toBe('high')
    })

    it('should check configuration files for potential issues', async () => {
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson))
        .mockResolvedValueOnce(mockNextConfig)
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const report = await compatibilityChecker.checkNextjs16Compatibility()

      const configIssue = report.issues.find(issue => 
        issue.type === 'configuration'
      )
      expect(configIssue).toBeDefined()
    })

    it('should provide appropriate recommendations', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockPackageJson))
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const report = await compatibilityChecker.checkNextjs16Compatibility()

      expect(report.recommendations).toContain('Review and resolve the identified compatibility issues before migration')
      expect(report.recommendations).toContain('Create a backup before starting the migration process')
      expect(report.recommendations).toContain('Test the migration in a development environment first')
    })

    it('should report ready state when no issues found', async () => {
      const compatiblePackageJson = {
        ...mockPackageJson,
        dependencies: {
          ...mockPackageJson.dependencies,
          'next': '^16.1.1',
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        }
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(compatiblePackageJson))
      vi.mocked(fs.access).mockRejectedValue(new Error('Config not found'))

      const report = await compatibilityChecker.checkNextjs16Compatibility()

      expect(report.overallCompatible).toBe(true)
      expect(report.recommendations).toContain('Your application appears to be ready for Next.js 16 migration')
    })
  })

  describe('getUpgradePath', () => {
    it('should provide a comprehensive upgrade path', () => {
      const upgradePath: UpgradePath[] = compatibilityChecker.getUpgradePath()

      expect(upgradePath).toHaveLength(1)
      expect(upgradePath[0].steps).toBeDefined()
      expect(upgradePath[0].estimatedDuration).toBeGreaterThan(0)
      expect(upgradePath[0].riskAssessment).toBeDefined()

      // Should include essential steps
      const steps = upgradePath[0].steps
      expect(steps.find(step => step.id === 'backup')).toBeDefined()
      expect(steps.find(step => step.id === 'update-next')).toBeDefined()
      expect(steps.find(step => step.id === 'update-react')).toBeDefined()
      expect(steps.find(step => step.id === 'test-build')).toBeDefined()
    })

    it('should include proper validation for each step', () => {
      const upgradePath = compatibilityChecker.getUpgradePath()
      const steps = upgradePath[0].steps

      steps.forEach(step => {
        expect(step.validation).toBeDefined()
        expect(step.validation.length).toBeGreaterThan(0)
      })
    })
  })

  describe('validateUpgradePath', () => {
    it('should validate upgrade path successfully when all requirements are met', async () => {
      const upgradePath = compatibilityChecker.getUpgradePath()[0]
      
      // Mock command availability
      const { exec } = await import('child_process')
      vi.mocked(exec).mockImplementation((cmd, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'version info', stderr: '' } as any)
        }
        return {} as any
      })

      vi.mocked(fs.access).mockResolvedValue(undefined)

      const result: ValidationResult = await compatibilityChecker.validateUpgradePath(upgradePath)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.details.totalSteps).toBe(upgradePath.steps.length)
    })

    it('should report errors when required commands are not available', async () => {
      const upgradePath = compatibilityChecker.getUpgradePath()[0]
      
      // Mock command not available
      const { exec } = await import('child_process')
      vi.mocked(exec).mockImplementation((cmd, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Command not found'), null)
        }
        return {} as any
      })

      const result = await compatibilityChecker.validateUpgradePath(upgradePath)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Required command')
    })

    it('should report warnings for missing files', async () => {
      const upgradePath = compatibilityChecker.getUpgradePath()[0]
      
      // Add a step with files for testing
      upgradePath.steps.push({
        id: 'test-step',
        description: 'Test step with files',
        files: ['nonexistent-file.txt'],
        validation: 'Test validation'
      })

      const { exec } = await import('child_process')
      vi.mocked(exec).mockImplementation((cmd, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'version info', stderr: '' } as any)
        }
        return {} as any
      })

      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'))

      const result = await compatibilityChecker.validateUpgradePath(upgradePath)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('nonexistent-file.txt')
    })
  })

  describe('testPackageCompatibility', () => {
    it('should return known compatibility for supported packages', async () => {
      const result: CompatibilityResult = await compatibilityChecker.testPackageCompatibility('next-intl', '^4.3.5')

      expect(result.compatible).toBe(true)
      expect(result.version).toBe('^4.3.5')
      expect(result.issues).toHaveLength(0)
      expect(result.recommendations).toContain('next-intl 4.3.5+ is compatible with Next.js 16')
    })

    it('should identify incompatible React versions', async () => {
      const result = await compatibilityChecker.testPackageCompatibility('react', '^17.0.0')

      expect(result.compatible).toBe(false)
      expect(result.issues).toContain('React 18+ required for Next.js 16')
      expect(result.recommendations).toContain('Upgrade to React 18')
    })

    it('should handle unknown packages conservatively', async () => {
      const result = await compatibilityChecker.testPackageCompatibility('unknown-package', '^1.0.0')

      expect(result.compatible).toBe(false)
      expect(result.issues).toContain('Compatibility with Next.js 16 is unknown')
      expect(result.recommendations).toContain('Check package documentation for Next.js 16 compatibility')
    })

    it('should correctly identify compatible Radix UI packages', async () => {
      const result = await compatibilityChecker.testPackageCompatibility('@radix-ui/react-dialog', '^1.1.4')

      expect(result.compatible).toBe(true)
      expect(result.recommendations).toContain('Radix UI components are compatible with Next.js 16')
    })

    it('should correctly identify compatible Supabase packages', async () => {
      const result = await compatibilityChecker.testPackageCompatibility('@supabase/supabase-js', '^2.50.3')

      expect(result.compatible).toBe(true)
      expect(result.recommendations).toContain('Supabase client is compatible with Next.js 16')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed package.json', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json')

      await expect(compatibilityChecker.analyzeDependencies()).rejects.toThrow()
    })

    it('should handle missing dependencies section', async () => {
      const packageJsonWithoutDeps = {
        name: 'test-app',
        version: '1.0.0'
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(packageJsonWithoutDeps))

      const analysis = await compatibilityChecker.analyzeDependencies()

      expect(analysis.totalPackages).toBe(0)
      expect(analysis.compatiblePackages).toHaveLength(0)
      expect(analysis.incompatiblePackages).toHaveLength(0)
    })

    it('should handle file system errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'))

      await expect(compatibilityChecker.checkNextjs16Compatibility()).rejects.toThrow('Failed to read package.json')
    })
  })
})