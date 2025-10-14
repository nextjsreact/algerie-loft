#!/usr/bin/env tsx

/**
 * CLI and Automation Test Runner
 * 
 * Comprehensive test runner for CLI commands and automation scripts
 * with detailed reporting and coverage analysis.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

interface TestSuite {
  name: string
  description: string
  testFiles: string[]
  timeout: number
  coverage: boolean
}

interface TestResult {
  suite: string
  passed: boolean
  duration: number
  coverage?: CoverageResult
  errors: string[]
  warnings: string[]
}

interface CoverageResult {
  lines: number
  functions: number
  branches: number
  statements: number
}

class CLIAutomationTestRunner {
  private testSuites: TestSuite[]
  private results: TestResult[]
  private startTime: number

  constructor() {
    this.testSuites = [
      {
        name: 'CLI Commands',
        description: 'Test CLI commands with various parameters and production safety',
        testFiles: ['__tests__/lib/environment-management/cli.test.ts'],
        timeout: 30000,
        coverage: true
      },
      {
        name: 'Automation Scripts',
        description: 'Test automation scripts end-to-end functionality',
        testFiles: ['__tests__/lib/environment-management/automation.test.ts'],
        timeout: 45000,
        coverage: true
      },
      {
        name: 'Environment Switching',
        description: 'Test environment switching reliability and recovery',
        testFiles: ['__tests__/lib/environment-management/environment-switching.test.ts'],
        timeout: 30000,
        coverage: true
      },
      {
        name: 'Integration Tests',
        description: 'Test CLI and automation integration workflows',
        testFiles: ['__tests__/lib/environment-management/cli-automation-integration.test.ts'],
        timeout: 60000,
        coverage: true
      }
    ]
    this.results = []
    this.startTime = Date.now()
  }

  /**
   * Run all test suites
   */
  public async runAllTests(): Promise<void> {
    console.log('🧪 CLI and Automation Test Runner')
    console.log('=' .repeat(60))
    console.log(`📅 Started at: ${new Date().toLocaleString()}`)
    console.log(`🎯 Test suites: ${this.testSuites.length}`)
    console.log('')

    // Ensure coverage directory exists
    this.ensureCoverageDirectory()

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite)
    }

    // Generate final report
    await this.generateFinalReport()
  }

  /**
   * Run individual test suite
   */
  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🔍 Running ${suite.name}`)
    console.log(`   ${suite.description}`)
    console.log(`   Files: ${suite.testFiles.length}`)
    console.log(`   Timeout: ${suite.timeout}ms`)

    const suiteStartTime = Date.now()
    let passed = false
    const errors: string[] = []
    const warnings: string[] = []
    let coverage: CoverageResult | undefined

    try {
      // Build Jest command
      const jestCommand = this.buildJestCommand(suite)
      
      console.log(`   Command: ${jestCommand}`)
      console.log('')

      // Execute tests
      const output = execSync(jestCommand, {
        encoding: 'utf-8',
        timeout: suite.timeout,
        stdio: 'pipe'
      })

      passed = true
      console.log('   ✅ Tests passed')

      // Extract coverage if enabled
      if (suite.coverage) {
        coverage = this.extractCoverage(output)
        if (coverage) {
          console.log(`   📊 Coverage: ${coverage.lines}% lines, ${coverage.functions}% functions`)
        }
      }

    } catch (error: any) {
      passed = false
      const errorMessage = error.message || 'Unknown error'
      errors.push(errorMessage)
      
      console.log('   ❌ Tests failed')
      console.log(`   Error: ${errorMessage}`)

      // Check if it's a timeout
      if (errorMessage.includes('timeout')) {
        warnings.push(`Test suite exceeded timeout of ${suite.timeout}ms`)
      }

      // Extract partial results if available
      if (error.stdout) {
        const partialCoverage = this.extractCoverage(error.stdout)
        if (partialCoverage) {
          coverage = partialCoverage
          console.log(`   📊 Partial coverage: ${coverage.lines}% lines`)
        }
      }
    }

    const duration = Date.now() - suiteStartTime

    // Store result
    this.results.push({
      suite: suite.name,
      passed,
      duration,
      coverage,
      errors,
      warnings
    })

    console.log(`   ⏱️  Duration: ${Math.round(duration / 1000)}s`)
    console.log('')
  }

  /**
   * Build Jest command for test suite
   */
  private buildJestCommand(suite: TestSuite): string {
    const baseCommand = 'npx jest'
    const configFile = '--config=jest.cli-automation.config.js'
    const testFiles = suite.testFiles.join(' ')
    const timeout = `--testTimeout=${suite.timeout}`
    const coverage = suite.coverage ? '--coverage' : ''
    const verbose = '--verbose'
    const runInBand = '--runInBand' // Run tests serially for better output

    return [
      baseCommand,
      configFile,
      testFiles,
      timeout,
      coverage,
      verbose,
      runInBand
    ].filter(Boolean).join(' ')
  }

  /**
   * Extract coverage information from Jest output
   */
  private extractCoverage(output: string): CoverageResult | undefined {
    try {
      // Look for coverage summary in Jest output
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/)
      
      if (coverageMatch) {
        return {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        }
      }

      // Alternative pattern for coverage
      const altCoverageMatch = output.match(/Coverage summary[\s\S]*?Lines\s*:\s*([\d.]+)%[\s\S]*?Functions\s*:\s*([\d.]+)%[\s\S]*?Branches\s*:\s*([\d.]+)%[\s\S]*?Statements\s*:\s*([\d.]+)%/)
      
      if (altCoverageMatch) {
        return {
          lines: parseFloat(altCoverageMatch[1]),
          functions: parseFloat(altCoverageMatch[2]),
          branches: parseFloat(altCoverageMatch[3]),
          statements: parseFloat(altCoverageMatch[4])
        }
      }

      return undefined
    } catch (error) {
      console.warn('   ⚠️  Could not extract coverage information')
      return undefined
    }
  }

  /**
   * Ensure coverage directory exists
   */
  private ensureCoverageDirectory(): void {
    const coverageDir = join(process.cwd(), 'coverage', 'cli-automation')
    if (!existsSync(coverageDir)) {
      mkdirSync(coverageDir, { recursive: true })
    }
  }

  /**
   * Generate final test report
   */
  private async generateFinalReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime
    const passedSuites = this.results.filter(r => r.passed).length
    const failedSuites = this.results.filter(r => !r.passed).length
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0)
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0)

    console.log('📋 Final Test Report')
    console.log('=' .repeat(60))
    console.log(`⏱️  Total duration: ${Math.round(totalDuration / 1000)}s`)
    console.log(`✅ Passed suites: ${passedSuites}/${this.testSuites.length}`)
    console.log(`❌ Failed suites: ${failedSuites}/${this.testSuites.length}`)
    console.log(`🚨 Total errors: ${totalErrors}`)
    console.log(`⚠️  Total warnings: ${totalWarnings}`)
    console.log('')

    // Detailed results
    console.log('📊 Detailed Results:')
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      const duration = Math.round(result.duration / 1000)
      
      console.log(`${status} ${result.suite} (${duration}s)`)
      
      if (result.coverage) {
        console.log(`   📊 Coverage: ${result.coverage.lines}% lines, ${result.coverage.functions}% functions, ${result.coverage.branches}% branches`)
      }
      
      if (result.errors.length > 0) {
        console.log(`   🚨 Errors: ${result.errors.length}`)
        result.errors.forEach(error => {
          console.log(`      • ${error.split('\n')[0]}`) // First line only
        })
      }
      
      if (result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.length}`)
        result.warnings.forEach(warning => {
          console.log(`      • ${warning}`)
        })
      }
    })

    // Overall coverage
    const overallCoverage = this.calculateOverallCoverage()
    if (overallCoverage) {
      console.log('')
      console.log('📈 Overall Coverage:')
      console.log(`   Lines: ${overallCoverage.lines.toFixed(1)}%`)
      console.log(`   Functions: ${overallCoverage.functions.toFixed(1)}%`)
      console.log(`   Branches: ${overallCoverage.branches.toFixed(1)}%`)
      console.log(`   Statements: ${overallCoverage.statements.toFixed(1)}%`)
    }

    // Generate JSON report
    await this.generateJSONReport()

    // Final status
    console.log('')
    if (failedSuites === 0) {
      console.log('🎉 All test suites passed!')
      process.exit(0)
    } else {
      console.log(`💥 ${failedSuites} test suite(s) failed`)
      process.exit(1)
    }
  }

  /**
   * Calculate overall coverage across all suites
   */
  private calculateOverallCoverage(): CoverageResult | undefined {
    const coverageResults = this.results
      .map(r => r.coverage)
      .filter((c): c is CoverageResult => c !== undefined)

    if (coverageResults.length === 0) {
      return undefined
    }

    const avgCoverage = {
      lines: coverageResults.reduce((sum, c) => sum + c.lines, 0) / coverageResults.length,
      functions: coverageResults.reduce((sum, c) => sum + c.functions, 0) / coverageResults.length,
      branches: coverageResults.reduce((sum, c) => sum + c.branches, 0) / coverageResults.length,
      statements: coverageResults.reduce((sum, c) => sum + c.statements, 0) / coverageResults.length
    }

    return avgCoverage
  }

  /**
   * Generate JSON report for CI/CD integration
   */
  private async generateJSONReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      summary: {
        totalSuites: this.testSuites.length,
        passedSuites: this.results.filter(r => r.passed).length,
        failedSuites: this.results.filter(r => !r.passed).length,
        totalErrors: this.results.reduce((sum, r) => sum + r.errors.length, 0),
        totalWarnings: this.results.reduce((sum, r) => sum + r.warnings.length, 0)
      },
      coverage: this.calculateOverallCoverage(),
      results: this.results,
      testSuites: this.testSuites
    }

    const reportPath = join(process.cwd(), 'coverage', 'cli-automation', 'test-report.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📄 JSON report saved to: ${reportPath}`)
  }

  /**
   * Run specific test suite by name
   */
  public async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name.toLowerCase().includes(suiteName.toLowerCase()))
    
    if (!suite) {
      console.error(`❌ Test suite '${suiteName}' not found`)
      console.log('Available suites:')
      this.testSuites.forEach(s => console.log(`  • ${s.name}`))
      process.exit(1)
    }

    console.log(`🎯 Running specific test suite: ${suite.name}`)
    console.log('')

    this.ensureCoverageDirectory()
    await this.runTestSuite(suite)
    await this.generateFinalReport()
  }

  /**
   * List available test suites
   */
  public listTestSuites(): void {
    console.log('📋 Available Test Suites:')
    console.log('')
    
    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`)
      console.log(`   ${suite.description}`)
      console.log(`   Files: ${suite.testFiles.length}`)
      console.log(`   Timeout: ${suite.timeout}ms`)
      console.log('')
    })
  }
}

// CLI execution
async function main() {
  const runner = new CLIAutomationTestRunner()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Run all tests
    await runner.runAllTests()
  } else if (args[0] === 'list') {
    // List available test suites
    runner.listTestSuites()
  } else if (args[0] === 'run' && args[1]) {
    // Run specific test suite
    await runner.runSpecificSuite(args[1])
  } else {
    console.log('Usage:')
    console.log('  tsx scripts/test-cli-automation.ts           # Run all test suites')
    console.log('  tsx scripts/test-cli-automation.ts list      # List available test suites')
    console.log('  tsx scripts/test-cli-automation.ts run <suite>  # Run specific test suite')
    console.log('')
    console.log('Examples:')
    console.log('  tsx scripts/test-cli-automation.ts run cli')
    console.log('  tsx scripts/test-cli-automation.ts run automation')
    console.log('  tsx scripts/test-cli-automation.ts run switching')
    console.log('  tsx scripts/test-cli-automation.ts run integration')
    process.exit(1)
  }
}

// Always run main when this script is executed
main().catch(error => {
  console.error('❌ Test runner failed:', error.message)
  process.exit(1)
})

export { CLIAutomationTestRunner }