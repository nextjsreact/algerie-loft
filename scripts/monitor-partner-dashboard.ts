#!/usr/bin/env tsx

/**
 * Partner Dashboard Deployment Monitoring Script
 * 
 * This script monitors the health of the partner dashboard deployment
 * and reports on key metrics.
 * 
 * Usage:
 *   tsx scripts/monitor-partner-dashboard.ts [environment]
 *   
 * Examples:
 *   tsx scripts/monitor-partner-dashboard.ts staging
 *   tsx scripts/monitor-partner-dashboard.ts production
 */

import https from 'https';
import http from 'http';

interface HealthCheckResult {
  url: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

interface MonitoringReport {
  timestamp: string;
  environment: string;
  checks: HealthCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    averageResponseTime: number;
  };
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function checkUrl(url: string): Promise<HealthCheckResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        url,
        status: response.statusCode || 0,
        responseTime,
        success: response.statusCode === 200 || response.statusCode === 302,
      });

      // Consume response data to free up memory
      response.resume();
    });

    request.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        status: 0,
        responseTime,
        success: false,
        error: error.message,
      });
    });

    // Set timeout
    request.setTimeout(10000, () => {
      request.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        status: 0,
        responseTime,
        success: false,
        error: 'Request timeout',
      });
    });
  });
}

async function monitorDeployment(baseUrl: string, environment: string): Promise<MonitoringReport> {
  log(`\n🔍 Monitoring Partner Dashboard - ${environment.toUpperCase()}`, 'cyan');
  log(`Base URL: ${baseUrl}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  const urlsToCheck = [
    `${baseUrl}`,
    `${baseUrl}/fr/partner/dashboard`,
    `${baseUrl}/en/partner/dashboard`,
    `${baseUrl}/ar/partner/dashboard`,
    `${baseUrl}/api/health`,
  ];

  const checks: HealthCheckResult[] = [];

  for (const url of urlsToCheck) {
    log(`Checking: ${url}`, 'yellow');
    const result = await checkUrl(url);
    checks.push(result);

    if (result.success) {
      log(`  ✅ Status: ${result.status} | Response Time: ${result.responseTime}ms`, 'green');
    } else {
      log(`  ❌ Status: ${result.status} | Error: ${result.error || 'Unknown'}`, 'red');
    }
  }

  const passed = checks.filter(c => c.success).length;
  const failed = checks.filter(c => !c.success).length;
  const averageResponseTime = checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length;

  const report: MonitoringReport = {
    timestamp: new Date().toISOString(),
    environment,
    checks,
    summary: {
      totalChecks: checks.length,
      passed,
      failed,
      averageResponseTime: Math.round(averageResponseTime),
    },
  };

  return report;
}

function printSummary(report: MonitoringReport) {
  log('\n📊 Summary', 'cyan');
  log('─'.repeat(50), 'blue');
  log(`Total Checks: ${report.summary.totalChecks}`, 'blue');
  log(`Passed: ${report.summary.passed}`, report.summary.passed === report.summary.totalChecks ? 'green' : 'yellow');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  log(`Average Response Time: ${report.summary.averageResponseTime}ms`, 
    report.summary.averageResponseTime < 1000 ? 'green' : 
    report.summary.averageResponseTime < 3000 ? 'yellow' : 'red'
  );

  if (report.summary.failed === 0) {
    log('\n✅ All checks passed! Deployment is healthy.', 'green');
  } else {
    log('\n⚠️  Some checks failed. Please investigate.', 'red');
  }

  // Performance assessment
  log('\n🎯 Performance Assessment', 'cyan');
  if (report.summary.averageResponseTime < 1000) {
    log('  Excellent - Response times are optimal', 'green');
  } else if (report.summary.averageResponseTime < 3000) {
    log('  Good - Response times are acceptable', 'yellow');
  } else {
    log('  Poor - Response times need improvement', 'red');
  }

  // Health status
  const healthPercentage = (report.summary.passed / report.summary.totalChecks) * 100;
  log('\n💚 Health Status', 'cyan');
  if (healthPercentage === 100) {
    log(`  ${healthPercentage}% - Excellent health`, 'green');
  } else if (healthPercentage >= 80) {
    log(`  ${healthPercentage}% - Good health with minor issues`, 'yellow');
  } else {
    log(`  ${healthPercentage}% - Critical issues detected`, 'red');
  }

  log('\n' + '─'.repeat(50), 'blue');
}

function printRecommendations(report: MonitoringReport) {
  const failedChecks = report.checks.filter(c => !c.success);
  const slowChecks = report.checks.filter(c => c.responseTime > 3000);

  if (failedChecks.length > 0 || slowChecks.length > 0) {
    log('\n💡 Recommendations', 'cyan');
    
    if (failedChecks.length > 0) {
      log('\n  Failed Checks:', 'red');
      failedChecks.forEach(check => {
        log(`    • ${check.url}`, 'red');
        log(`      Error: ${check.error || 'HTTP ' + check.status}`, 'red');
      });
      log('\n  Actions:', 'yellow');
      log('    1. Check Vercel deployment logs', 'yellow');
      log('    2. Verify environment variables', 'yellow');
      log('    3. Check Supabase connection', 'yellow');
      log('    4. Consider rollback if critical', 'yellow');
    }

    if (slowChecks.length > 0) {
      log('\n  Slow Responses:', 'yellow');
      slowChecks.forEach(check => {
        log(`    • ${check.url} - ${check.responseTime}ms`, 'yellow');
      });
      log('\n  Actions:', 'yellow');
      log('    1. Check database query performance', 'yellow');
      log('    2. Review API endpoint optimization', 'yellow');
      log('    3. Consider caching strategies', 'yellow');
    }
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
    process.exit(1);
  }

  try {
    const report = await monitorDeployment(baseUrl, environment);
    printSummary(report);
    printRecommendations(report);

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = `./monitoring-report-${environment}-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Report saved to: ${reportPath}`, 'blue');

    // Exit with error code if checks failed
    if (report.summary.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Monitoring failed: ${error}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { monitorDeployment, type MonitoringReport, type HealthCheckResult };
