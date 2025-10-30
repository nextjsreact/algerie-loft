#!/usr/bin/env tsx

/**
 * Test Runner for Reservation Data Consistency Implementation
 * Runs all tests and generates a comprehensive report
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors?: string[];
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

interface TestReport {
  timestamp: string;
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  suites: TestSuite[];
  summary: {
    cacheService: boolean;
    healthMonitoring: boolean;
    performanceMonitoring: boolean;
    apiEndpoints: boolean;
    integration: boolean;
    databaseOptimization: boolean;
  };
  recommendations: string[];
}

class ReservationTestRunner {
  private report: TestReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      suites: [],
      summary: {
        cacheService: false,
        healthMonitoring: false,
        performanceMonitoring: false,
        apiEndpoints: false,
        integration: false,
        databaseOptimization: false
      },
      recommendations: []
    };
  }

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Reservation System Test Suite...\n');

    const testSuites = [
      {
        name: 'Cache Service Tests',
        command: 'npx vitest run __tests__/services/loft-cache-service.test.ts',
        key: 'cacheService' as keyof typeof this.report.summary
      },
      {
        name: 'System Health Monitor Tests',
        command: 'npx vitest run __tests__/services/system-health-monitor.test.ts',
        key: 'healthMonitoring' as keyof typeof this.report.summary
      },
      {
        name: 'Performance Monitor Tests',
        command: 'npx vitest run __tests__/services/reservation-performance-monitor.test.ts',
        key: 'performanceMonitoring' as keyof typeof this.report.summary
      },
      {
        name: 'API Endpoints Tests',
        command: 'npx vitest run __tests__/api/monitoring/performance.test.ts',
        key: 'apiEndpoints' as keyof typeof this.report.summary
      },
      {
        name: 'Integration Tests',
        command: 'npx vitest run __tests__/integration/reservation-data-consistency.test.ts',
        key: 'integration' as keyof typeof this.report.summary
      },
      {
        name: 'System Validation Tests',
        command: 'npx vitest run __tests__/reservation-system-validation.test.ts',
        key: 'databaseOptimization' as keyof typeof this.report.summary
      }
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite.name, suite.command, suite.key);
    }

    this.generateSummary();
    this.generateRecommendations();
    
    return this.report;
  }

  private async runTestSuite(
    suiteName: string, 
    command: string, 
    summaryKey: keyof typeof this.report.summary
  ): Promise<void> {
    console.log(`📋 Running ${suiteName}...`);
    const startTime = Date.now();

    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const duration = Date.now() - startTime;
      const testSuite = this.parseTestOutput(suiteName, output, duration);
      
      this.report.suites.push(testSuite);
      this.report.summary[summaryKey] = testSuite.failedTests === 0;
      
      console.log(`✅ ${suiteName}: ${testSuite.passedTests}/${testSuite.totalTests} passed (${duration}ms)\n`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorOutput = error.stdout || error.stderr || error.message;
      
      const testSuite: TestSuite = {
        name: suiteName,
        tests: [{
          name: 'Suite Execution',
          status: 'failed',
          duration,
          errors: [errorOutput]
        }],
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        duration
      };

      this.report.suites.push(testSuite);
      this.report.summary[summaryKey] = false;
      
      console.log(`❌ ${suiteName}: Failed (${duration}ms)`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  private parseTestOutput(suiteName: string, output: string, duration: number): TestSuite {
    // Simple parsing - in a real implementation, you'd parse vitest JSON output
    const lines = output.split('\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    // Look for test summary in output
    for (const line of lines) {
      if (line.includes('Test Files')) {
        const match = line.match(/(\d+) passed/);
        if (match) {
          passedTests = parseInt(match[1]);
        }
        const failMatch = line.match(/(\d+) failed/);
        if (failMatch) {
          failedTests = parseInt(failMatch[1]);
        }
      }
      if (line.includes('Tests')) {
        const testMatch = line.match(/(\d+) passed/);
        if (testMatch) {
          totalTests = parseInt(testMatch[1]);
          passedTests = totalTests;
        }
      }
    }

    // If we couldn't parse, assume success if no error
    if (totalTests === 0 && output.includes('✓')) {
      totalTests = 1;
      passedTests = 1;
    }

    return {
      name: suiteName,
      tests: [], // Would be populated with individual test results in full implementation
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration
    };
  }

  private generateSummary(): void {
    this.report.totalSuites = this.report.suites.length;
    this.report.totalTests = this.report.suites.reduce((sum, suite) => sum + suite.totalTests, 0);
    this.report.passedTests = this.report.suites.reduce((sum, suite) => sum + suite.passedTests, 0);
    this.report.failedTests = this.report.suites.reduce((sum, suite) => sum + suite.failedTests, 0);
    this.report.skippedTests = this.report.suites.reduce((sum, suite) => sum + suite.skippedTests, 0);
    this.report.totalDuration = this.report.suites.reduce((sum, suite) => sum + suite.duration, 0);
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];

    // Check each component
    if (!this.report.summary.cacheService) {
      recommendations.push('❌ Cache Service: Review cache implementation and fix failing tests');
    } else {
      recommendations.push('✅ Cache Service: All tests passing - cache system is working correctly');
    }

    if (!this.report.summary.healthMonitoring) {
      recommendations.push('❌ Health Monitoring: Fix health check implementation issues');
    } else {
      recommendations.push('✅ Health Monitoring: System health monitoring is functioning properly');
    }

    if (!this.report.summary.performanceMonitoring) {
      recommendations.push('❌ Performance Monitoring: Address performance tracking issues');
    } else {
      recommendations.push('✅ Performance Monitoring: Performance tracking is working as expected');
    }

    if (!this.report.summary.apiEndpoints) {
      recommendations.push('❌ API Endpoints: Fix monitoring API endpoint issues');
    } else {
      recommendations.push('✅ API Endpoints: Monitoring APIs are functioning correctly');
    }

    if (!this.report.summary.integration) {
      recommendations.push('❌ Integration: Resolve integration test failures');
    } else {
      recommendations.push('✅ Integration: All system components are properly integrated');
    }

    if (!this.report.summary.databaseOptimization) {
      recommendations.push('❌ Database Optimization: Review database indexes and optimization');
    } else {
      recommendations.push('✅ Database Optimization: Database performance optimizations are in place');
    }

    // Overall recommendations
    const passedComponents = Object.values(this.report.summary).filter(Boolean).length;
    const totalComponents = Object.keys(this.report.summary).length;

    if (passedComponents === totalComponents) {
      recommendations.push('🎉 All components are working correctly! The reservation system is ready for production.');
    } else if (passedComponents >= totalComponents * 0.8) {
      recommendations.push('⚠️  Most components are working. Address the failing components before deployment.');
    } else {
      recommendations.push('🚨 Multiple components have issues. Comprehensive review and fixes needed.');
    }

    // Performance recommendations
    const avgDuration = this.report.totalDuration / this.report.totalSuites;
    if (avgDuration > 5000) {
      recommendations.push('⏱️  Test execution is slow. Consider optimizing test setup and mocking.');
    }

    this.report.recommendations = recommendations;
  }

  generateReport(): string {
    const successRate = (this.report.passedTests / this.report.totalTests) * 100;
    
    let reportContent = `
# Reservation System Test Report

**Generated:** ${this.report.timestamp}
**Total Duration:** ${this.report.totalDuration}ms

## Summary

- **Test Suites:** ${this.report.totalSuites}
- **Total Tests:** ${this.report.totalTests}
- **Passed:** ${this.report.passedTests} ✅
- **Failed:** ${this.report.failedTests} ❌
- **Skipped:** ${this.report.skippedTests} ⏭️
- **Success Rate:** ${successRate.toFixed(1)}%

## Component Status

| Component | Status | Tests | Duration |
|-----------|--------|-------|----------|
`;

    this.report.suites.forEach(suite => {
      const status = suite.failedTests === 0 ? '✅ Pass' : '❌ Fail';
      const testInfo = `${suite.passedTests}/${suite.totalTests}`;
      reportContent += `| ${suite.name} | ${status} | ${testInfo} | ${suite.duration}ms |\n`;
    });

    reportContent += `
## Detailed Results

`;

    this.report.suites.forEach(suite => {
      const status = suite.failedTests === 0 ? '✅' : '❌';
      reportContent += `### ${status} ${suite.name}

- **Tests:** ${suite.totalTests}
- **Passed:** ${suite.passedTests}
- **Failed:** ${suite.failedTests}
- **Duration:** ${suite.duration}ms

`;
    });

    reportContent += `
## Recommendations

${this.report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

`;

    if (this.report.failedTests === 0) {
      reportContent += `
🎉 **All tests are passing!** The reservation system implementation is complete and ready.

### Deployment Checklist:
1. ✅ Database indexes are optimized
2. ✅ Caching system is functional
3. ✅ Health monitoring is active
4. ✅ Performance monitoring is working
5. ✅ API endpoints are tested
6. ✅ Integration tests pass

### Production Readiness:
- Deploy database performance indexes
- Initialize performance monitoring services
- Set up health check alerts
- Configure cache warm-up procedures
`;
    } else {
      reportContent += `
⚠️ **Some tests are failing.** Please address the issues before deployment.

### Priority Actions:
1. Fix failing test suites
2. Verify component integrations
3. Re-run tests to confirm fixes
4. Review error logs for root causes

### Before Deployment:
- Ensure all tests pass
- Verify system health monitoring
- Test cache performance
- Validate API endpoints
`;
    }

    return reportContent;
  }

  saveReport(content: string): void {
    const reportPath = join(process.cwd(), 'test-reports', 'reservation-system-test-report.md');
    
    // Ensure directory exists
    const reportDir = join(process.cwd(), 'test-reports');
    if (!existsSync(reportDir)) {
      require('fs').mkdirSync(reportDir, { recursive: true });
    }

    writeFileSync(reportPath, content);
    console.log(`📄 Test report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const runner = new ReservationTestRunner();
  
  try {
    console.log('🔍 Reservation Data Consistency Test Suite');
    console.log('==========================================\n');

    const report = await runner.runAllTests();
    const reportContent = runner.generateReport();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passedTests} ✅`);
    console.log(`Failed: ${report.failedTests} ❌`);
    console.log(`Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);
    
    runner.saveReport(reportContent);
    
    // Also save JSON report for programmatic access
    const jsonReportPath = join(process.cwd(), 'test-reports', 'reservation-system-test-report.json');
    writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved to: ${jsonReportPath}`);

    console.log('\n🎯 Key Recommendations:');
    report.recommendations.slice(0, 3).forEach(rec => {
      console.log(`   ${rec}`);
    });

    // Exit with appropriate code
    process.exit(report.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ReservationTestRunner };