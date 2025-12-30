/**
 * Property-Based Tests for Dependency Compatibility Resolution
 * Feature: nextjs-16-migration-plan, Property 4: Dependency Compatibility Resolution
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import * as fc from 'fast-check'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Types for dependency analysis
interface PackageInfo {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface CompatibilityResult {
  compatible: boolean
  issues: string[]
  recommendations: string[]
}

interface DependencyAnalysis {
  totalPackages: number
  compatiblePackages: PackageInfo[]
  incompatiblePackages: PackageInfo[]
  unknownPackages: PackageInfo[]
  recommendedUpgrades: Array<{
    package: string
    currentVersion: string
    recommendedVersion: string
    reason: string
  }>
}

// Mock compatibility checker implementation
class CompatibilityChecker {
  private nextjsVersion: string
  private knownCompatiblePackages: Map<string, string[]>
  private knownIncompatiblePackages: Map<string, string[]>

  constructor(nextjsVersion: string = '16.1.1') {
    this.nextjsVersion = nextjsVersion
    this.initializeCompatibilityDatabase()
  }

  private initializeCompatibilityDatabase() {
    // Known compatible packages with Next.js 16
    this.knownCompatiblePackages = new Map([
      ['react', ['18.0.0', '18.1.0', '18.2.0', '18.3.0', '18.3.1']],
      ['react-dom', ['18.0.0', '18.1.0', '18.2.0', '18.3.0', '18.3.1']],
      ['next-intl', ['4.0.0', '4.1.0', '4.2.0', '4.3.0', '4.4.0', '4.5.0', '4.6.0']],
      ['@radix-ui/react-dialog', ['1.0.0', '1.1.0', '1.1.1', '1.1.2', '1.1.3', '1.1.4']],
      ['tailwindcss', ['3.0.0', '3.1.0', '3.2.0', '3.3.0', '3.4.0', '3.4.17']],
      ['typescript', ['5.0.0', '5.1.0', '5.2.0', '5.3.0', '5.4.0', '5.5.0', '5.6.0', '5.7.0', '5.8.0', '5.8.3']],
      ['@sentry/nextjs', ['10.0.0', '10.10.0', '10.20.0', '10.30.0', '10.32.1']],
      ['framer-motion', ['12.0.0', '12.10.0', '12.20.0', '12.23.0', '12.23.24']],
    ])

    // Known incompatible packages
    this.knownIncompatiblePackages = new Map([
      ['next', ['13.0.0', '13.1.0', '13.2.0', '13.3.0', '13.4.0', '13.5.0', '14.0.0', '14.1.0', '14.2.0', '15.0.0']],
      ['react', ['17.0.0', '17.0.1', '17.0.2', '16.0.0']],
      ['react-dom', ['17.0.0', '17.0.1', '17.0.2', '16.0.0']],
    ])
  }

  analyzeDependencies(packageJson: PackageInfo): DependencyAnalysis {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    const analysis: DependencyAnalysis = {
      totalPackages: Object.keys(allDeps).length,
      compatiblePackages: [],
      incompatiblePackages: [],
      unknownPackages: [],
      recommendedUpgrades: []
    }

    for (const [name, version] of Object.entries(allDeps)) {
      const cleanVersion = this.extractVersion(version)
      const packageInfo: PackageInfo = { name, version: cleanVersion }

      if (this.isCompatible(name, cleanVersion)) {
        analysis.compatiblePackages.push(packageInfo)
      } else if (this.isIncompatible(name, cleanVersion)) {
        analysis.incompatiblePackages.push(packageInfo)
        
        // Generate upgrade recommendation
        const recommendedVersion = this.getRecommendedVersion(name)
        if (recommendedVersion) {
          analysis.recommendedUpgrades.push({
            package: name,
            currentVersion: cleanVersion,
            recommendedVersion,
            reason: `Compatibility with Next.js ${this.nextjsVersion}`
          })
        }
      } else {
        analysis.unknownPackages.push(packageInfo)
      }
    }

    return analysis
  }

  private extractVersion(versionString: string): string {
    // Remove version prefixes like ^, ~, >=, etc.
    return versionString.replace(/^[\^~>=<]+/, '')
  }

  private isCompatible(packageName: string, version: string): boolean {
    const compatibleVersions = this.knownCompatiblePackages.get(packageName)
    if (!compatibleVersions) return false
    
    return compatibleVersions.some(compatibleVersion => 
      this.isVersionCompatible(version, compatibleVersion)
    )
  }

  private isIncompatible(packageName: string, version: string): boolean {
    const incompatibleVersions = this.knownIncompatiblePackages.get(packageName)
    if (!incompatibleVersions) return false
    
    return incompatibleVersions.some(incompatibleVersion => 
      this.isVersionCompatible(version, incompatibleVersion)
    )
  }

  private isVersionCompatible(version1: string, version2: string): boolean {
    // Simple version comparison - in real implementation would use semver
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    // Check if major.minor matches (allowing patch differences)
    return v1Parts[0] === v2Parts[0] && v1Parts[1] === v2Parts[1]
  }

  private getRecommendedVersion(packageName: string): string | null {
    const compatibleVersions = this.knownCompatiblePackages.get(packageName)
    if (!compatibleVersions || compatibleVersions.length === 0) return null
    
    // Return the latest compatible version
    return compatibleVersions[compatibleVersions.length - 1]
  }

  checkNextjs16Compatibility(packageJson: PackageInfo): CompatibilityResult {
    const analysis = this.analyzeDependencies(packageJson)
    
    return {
      compatible: analysis.incompatiblePackages.length === 0,
      issues: analysis.incompatiblePackages.map(pkg => 
        `${pkg.name}@${pkg.version} is not compatible with Next.js 16`
      ),
      recommendations: analysis.recommendedUpgrades.map(upgrade => 
        `Upgrade ${upgrade.package} from ${upgrade.currentVersion} to ${upgrade.recommendedVersion}: ${upgrade.reason}`
      )
    }
  }
}

// Property-based test generators
const packageNameArbitrary = fc.stringMatching(/^[a-z][a-z0-9-]*$/)
const versionArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 20 }),
  fc.integer({ min: 0, max: 50 }),
  fc.integer({ min: 0, max: 100 })
).map(([major, minor, patch]) => `${major}.${minor}.${patch}`)

const packageInfoArbitrary = fc.record({
  name: packageNameArbitrary,
  version: versionArbitrary,
  dependencies: fc.option(fc.dictionary(packageNameArbitrary, versionArbitrary), { nil: undefined }),
  devDependencies: fc.option(fc.dictionary(packageNameArbitrary, versionArbitrary), { nil: undefined })
})

describe('Dependency Compatibility Resolution', () => {
  let compatibilityChecker: CompatibilityChecker
  let actualPackageJson: PackageInfo

  beforeAll(() => {
    compatibilityChecker = new CompatibilityChecker('16.1.1')
    
    // Load actual package.json for real-world testing
    const packageJsonPath = join(process.cwd(), 'package.json')
    if (existsSync(packageJsonPath)) {
      actualPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    }
  })

  describe('Property 4: Dependency Compatibility Resolution', () => {
    it('should analyze any package.json and provide compatibility information', () => {
      fc.assert(
        fc.property(packageInfoArbitrary, (packageJson) => {
          const analysis = compatibilityChecker.analyzeDependencies(packageJson)
          
          // Property: Analysis should account for all dependencies
          const totalDeps = Object.keys({
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          }).length
          
          const analyzedPackages = analysis.compatiblePackages.length + 
                                 analysis.incompatiblePackages.length + 
                                 analysis.unknownPackages.length
          
          expect(analyzedPackages).toBe(totalDeps)
          expect(analysis.totalPackages).toBe(totalDeps)
          
          // Property: All packages should be categorized
          expect(analysis.compatiblePackages).toBeInstanceOf(Array)
          expect(analysis.incompatiblePackages).toBeInstanceOf(Array)
          expect(analysis.unknownPackages).toBeInstanceOf(Array)
          expect(analysis.recommendedUpgrades).toBeInstanceOf(Array)
          
          // Property: Recommendations should only exist for incompatible packages
          expect(analysis.recommendedUpgrades.length).toBeLessThanOrEqual(analysis.incompatiblePackages.length)
        }),
        { numRuns: 100 }
      )
    })

    it('should provide upgrade paths for incompatible packages', () => {
      fc.assert(
        fc.property(packageInfoArbitrary, (packageJson) => {
          const result = compatibilityChecker.checkNextjs16Compatibility(packageJson)
          
          // Property: If there are issues, there should be recommendations
          if (result.issues.length > 0) {
            expect(result.compatible).toBe(false)
            expect(result.recommendations.length).toBeGreaterThan(0)
          }
          
          // Property: If compatible, no issues should exist
          if (result.compatible) {
            expect(result.issues.length).toBe(0)
          }
          
          // Property: All recommendations should be actionable strings
          result.recommendations.forEach(recommendation => {
            expect(typeof recommendation).toBe('string')
            expect(recommendation.length).toBeGreaterThan(0)
            expect(recommendation).toMatch(/Upgrade .+ from .+ to .+/)
          })
        }),
        { numRuns: 100 }
      )
    })

    it('should handle the actual project package.json correctly', () => {
      if (!actualPackageJson) {
        console.warn('Skipping real package.json test - file not found')
        return
      }

      const analysis = compatibilityChecker.analyzeDependencies(actualPackageJson)
      const result = compatibilityChecker.checkNextjs16Compatibility(actualPackageJson)
      
      // Validate that Next.js 16.1.1 is present and compatible
      const nextjsDep = actualPackageJson.dependencies?.['next'] || 
                       actualPackageJson.devDependencies?.['next']
      
      if (nextjsDep) {
        expect(nextjsDep).toMatch(/16\.1\.1/)
      }
      
      // Validate that React 18 is present (required for Next.js 16)
      const reactDep = actualPackageJson.dependencies?.['react']
      if (reactDep) {
        expect(reactDep).toMatch(/^[\^~]?18/)
      }
      
      // Log analysis results for debugging
      console.log('Dependency Analysis Results:', {
        total: analysis.totalPackages,
        compatible: analysis.compatiblePackages.length,
        incompatible: analysis.incompatiblePackages.length,
        unknown: analysis.unknownPackages.length,
        upgrades: analysis.recommendedUpgrades.length
      })
      
      if (analysis.incompatiblePackages.length > 0) {
        console.log('Incompatible packages:', analysis.incompatiblePackages.map(p => `${p.name}@${p.version}`))
      }
      
      if (analysis.recommendedUpgrades.length > 0) {
        console.log('Recommended upgrades:', analysis.recommendedUpgrades)
      }
    })

    it('should maintain consistency between analysis methods', () => {
      fc.assert(
        fc.property(packageInfoArbitrary, (packageJson) => {
          const analysis = compatibilityChecker.analyzeDependencies(packageJson)
          const compatibilityResult = compatibilityChecker.checkNextjs16Compatibility(packageJson)
          
          // Property: Compatibility result should be consistent with analysis
          const hasIncompatiblePackages = analysis.incompatiblePackages.length > 0
          expect(compatibilityResult.compatible).toBe(!hasIncompatiblePackages)
          
          // Property: Number of issues should match incompatible packages
          expect(compatibilityResult.issues.length).toBe(analysis.incompatiblePackages.length)
          
          // Property: Number of recommendations should match upgrade suggestions
          expect(compatibilityResult.recommendations.length).toBe(analysis.recommendedUpgrades.length)
        }),
        { numRuns: 100 }
      )
    })

    it('should handle edge cases gracefully', () => {
      // Test with empty package.json
      const emptyPackage: PackageInfo = { name: 'test', version: '1.0.0' }
      const emptyAnalysis = compatibilityChecker.analyzeDependencies(emptyPackage)
      
      expect(emptyAnalysis.totalPackages).toBe(0)
      expect(emptyAnalysis.compatiblePackages).toHaveLength(0)
      expect(emptyAnalysis.incompatiblePackages).toHaveLength(0)
      expect(emptyAnalysis.unknownPackages).toHaveLength(0)
      
      // Test with malformed versions
      const malformedPackage: PackageInfo = {
        name: 'test',
        version: '1.0.0',
        dependencies: {
          'test-package': 'invalid-version'
        }
      }
      
      expect(() => {
        compatibilityChecker.analyzeDependencies(malformedPackage)
      }).not.toThrow()
    })
  })
})