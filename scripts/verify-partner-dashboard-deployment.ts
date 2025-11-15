#!/usr/bin/env tsx

/**
 * Partner Dashboard Deployment Verification Script
 * 
 * This script performs comprehensive verification of the partner dashboard deployment
 * including functional tests, translation checks, and performance validation.
 * 
 * Usage:
 *   tsx scripts/verify-partner-dashboard-deployment.ts [environment]
 */

import https from 'https';
import http from 'http';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

interface VerificationReport {
  timestamp: string;
  environment: string;
  baseUrl: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

async function fetchUrl(url: string): Promise<{ status: number; body: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          status: response.statusCode || 0,
          body,
          duration,
        });
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testUrlAccessible(url: string, expectedStatus: number = 200): Promise<TestResult> {
  const testName = `URL Accessible: ${url}`;
  
  try {
    const { status, duration } = await fetchUrl(url);
    const passed = status === expectedStatus || (expectedStatus === 200 && status === 302);
    
    return {
      name: testName,
      passed,
      message: passed 
        ? `✅ Status ${status} (${duration}ms)` 
        : `❌ Expected ${expectedStatus}, got ${status}`,
      duration,
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function testTranslationPresent(url: string, locale: string, searchText: string): Promise<TestResult> {
  const testName = `Translation Check (${locale}): ${url}`;
  
  try {
    const { status, body, duration } = await fetchUrl(url);
    
    if (status !== 200 && status !== 302) {
      return {
        name: testName,
        passed: false,
        message: `❌ Page not accessible (Status ${status})`,
        duration,
      };
    }

    // Check if the expected text is present in the response
    const textPresent = body.includes(searchText);
    
    return {
      name: testName,
      passed: textPresent,
      message: textPresent 
        ? `✅ Translation found (${duration}ms)` 
        : `❌ Expected text "${searchText}" not found`,
      duration,
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function testPerformance(url: string, maxDuration: number = 3000): Promise<TestResult> {
  const testName = `Performance: ${url}`;
  
  try {
    const { status, duration } = await fetchUrl(url);
    
    if (status !== 200 && status !== 302) {
      return {
        name: testName,
        passed: false,
        message: `❌ Page not accessible (Status ${status})`,
        duration,
      };
    }

    const passed = duration <= maxDuration;
    
    return {
      name: testName,
      passed,
      message: passed 
        ? `✅ ${duration}ms (under ${maxDuration}ms)` 
        : `⚠️  ${duration}ms (exceeds ${maxDuration}ms)`,
      duration,
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function runVerification(baseUrl: string, environment: string): Promise<VerificationReport> {
  log(`\n🔍 Partner Dashboard Deployment Verification`, 'cyan');
  log(`Environment: ${environment.toUpperCase()}`, 'blue');
  log(`Base URL: ${baseUrl}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  const startTime = Date.now();
  const tests: TestResult[] = [];

  // Test 1: Homepage accessible
  log('📝 Test 1: Homepage Accessibility', 'yellow');
  tests.push(await testUrlAccessible(baseUrl));

  // Test 2: Partner dashboard pages accessible
  log('\n📝 Test 2: Partner Dashboard Accessibility', 'yellow');
  tests.push(await testUrlAccessible(`${baseUrl}/fr/partner/dashboard`));
  tests.push(await testUrlAccessible(`${baseUrl}/en/partner/dashboard`));
  tests.push(await testUrlAccessible(`${baseUrl}/ar/partner/dashboard`));

  // Test 3: API health check
  log('\n📝 Test 3: API Health', 'yellow');
  tests.push(await testUrlAccessible(`${baseUrl}/api/health`));

  // Test 4: Translation checks (if pages are publicly accessible)
  log('\n📝 Test 4: Translation Verification', 'yellow');
  // Note: These might fail if authentication is required
  // Adjust search text based on your actual translations
  tests.push(await testTranslationPresent(
    `${baseUrl}/fr/partner/dashboard`,
    'fr',
    'Tableau de bord'
  ));
  tests.push(await testTranslationPresent(
    `${baseUrl}/en/partner/dashboard`,
    'en',
    'Dashboard'
  ));

  // Test 5: Performance checks
  log('\n📝 Test 5: Performance Validation', 'yellow');
  tests.push(await testPerformance(baseUrl, 3000));
  tests.push(await testPerformance(`${baseUrl}/fr/partner/dashboard`, 3000));

  const duration = Date.now() - startTime;
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    environment,
    baseUrl,
    tests,
    summary: {
      total: tests.length,
      passed,
      failed,
      duration,
    },
  };

  return report;
}

function printResults(report: VerificationReport) {
  log('\n' + '═'.repeat(60), 'cyan');
  log('📊 VERIFICATION RESULTS', 'cyan');
  log('═'.repeat(60), 'cyan');

  // Group tests by category
  const categories = new Map<string, TestResult[]>();
  report.tests.forEach(test => {
    const category = test.name.split(':')[0];
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(test);
  });

  // Print results by category
  categories.forEach((tests, category) => {
    log(`\n${category}:`, 'magenta');
    tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      const color = test.passed ? 'green' : 'red';
      log(`  ${icon} ${test.name.split(':')[1]?.trim() || test.name}`, color);
      log(`     ${test.message}`, color);
    });
  });

  // Print summary
  log('\n' + '─'.repeat(60), 'blue');
  log('📈 SUMMARY', 'cyan');
  log('─'.repeat(60), 'blue');
  log(`Total Tests: ${report.summary.total}`, 'blue');
  log(`Passed: ${report.summary.passed}`, report.summary.passed === report.summary.total ? 'green' : 'yellow');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  log(`Duration: ${report.summary.duration}ms`, 'blue');

  const successRate = (report.summary.passed / report.summary.total) * 100;
  log(`Success Rate: ${successRate.toFixed(1)}%`, 
    successRate === 100 ? 'green' : 
    successRate >= 80 ? 'yellow' : 'red'
  );

  // Overall status
  log('\n' + '─'.repeat(60), 'blue');
  if (report.summary.failed === 0) {
    log('✅ VERIFICATION PASSED - Deployment is ready!', 'green');
  } else if (successRate >= 80) {
    log('⚠️  VERIFICATION PASSED WITH WARNINGS - Review failed tests', 'yellow');
  } else {
    log('❌ VERIFICATION FAILED - Critical issues detected', 'red');
  }
  log('═'.repeat(60), 'cyan');
}

function printRecommendations(report: VerificationReport) {
  const failedTests = report.tests.filter(t => !t.passed);

  if (failedTests.length > 0) {
    log('\n💡 RECOMMENDATIONS', 'cyan');
    log('─'.repeat(60), 'blue');

    const hasAccessibilityIssues = failedTests.some(t => t.name.includes('Accessible'));
    const hasTranslationIssues = failedTests.some(t => t.name.includes('Translation'));
    const hasPerformanceIssues = failedTests.some(t => t.name.includes('Performance'));

    if (hasAccessibilityIssues) {
      log('\n🔴 Accessibility Issues Detected:', 'red');
      log('  1. Check Vercel deployment status', 'yellow');
      log('  2. Verify environment variables are set correctly', 'yellow');
      log('  3. Check Supabase connection and authentication', 'yellow');
      log('  4. Review deployment logs for errors', 'yellow');
      log('  5. Consider rollback if critical pages are inaccessible', 'yellow');
    }

    if (hasTranslationIssues) {
      log('\n🟡 Translation Issues Detected:', 'yellow');
      log('  1. Verify translation files are included in build', 'yellow');
      log('  2. Check next-intl configuration', 'yellow');
      log('  3. Ensure translation keys match in all language files', 'yellow');
      log('  4. Run: npm run validate:translations', 'yellow');
    }

    if (hasPerformanceIssues) {
      log('\n🟠 Performance Issues Detected:', 'yellow');
      log('  1. Check database query performance', 'yellow');
      log('  2. Review API endpoint optimization', 'yellow');
      log('  3. Consider implementing caching', 'yellow');
      log('  4. Check for N+1 query problems', 'yellow');
      log('  5. Monitor Vercel Analytics for bottlenecks', 'yellow');
    }

    log('\n📚 Useful Commands:', 'cyan');
    log('  vercel logs --prod --follow    # View real-time logs', 'blue');
    log('  vercel ls --prod               # List deployments', 'blue');
    log('  vercel promote [id] --prod     # Rollback to previous', 'blue');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';

  // Environment URLs - Update these with your actual URLs
  const environmentUrls: Record<string, string> = {
    production: process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app',
    staging: process.env.STAGING_URL || 'https://your-app-staging.vercel.app',
    local: 'http://localhost:3000',
  };

  const baseUrl = environmentUrls[environment];

  if (!baseUrl) {
    log(`❌ Unknown environment: ${environment}`, 'red');
    log('Available environments: production, staging, local', 'yellow');
    log('\nUsage: tsx scripts/verify-partner-dashboard-deployment.ts [environment]', 'blue');
    process.exit(1);
  }

  try {
    const report = await runVerification(baseUrl, environment);
    printResults(report);
    printRecommendations(report);

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = `./verification-report-${environment}-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Full report saved to: ${reportPath}`, 'blue');

    // Exit with error code if verification failed
    const successRate = (report.summary.passed / report.summary.total) * 100;
    if (successRate < 80) {
      log('\n❌ Verification failed. Please address the issues before proceeding.', 'red');
      process.exit(1);
    } else if (report.summary.failed > 0) {
      log('\n⚠️  Verification passed with warnings. Review failed tests.', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ Verification successful! Deployment is ready.', 'green');
      process.exit(0);
    }
  } catch (error) {
    log(`\n❌ Verification failed with error: ${error}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runVerification, type VerificationReport, type TestResult };
