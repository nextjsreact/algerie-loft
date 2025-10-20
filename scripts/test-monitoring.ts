#!/usr/bin/env tsx

/**
 * Test script to verify monitoring setup
 * Run with: npm run test:monitoring
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

function runTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Check if required files exist
  const requiredFiles = [
    'lib/analytics/web-vitals.ts',
    'lib/analytics/gtag.ts',
    'components/providers/analytics-provider.tsx',
    'lib/monitoring/performance.ts',
    'app/api/analytics/web-vitals/route.ts',
    'sentry.client.config.ts',
    'sentry.server.config.ts',
    'sentry.edge.config.ts',
  ];

  requiredFiles.forEach(file => {
    try {
      const filePath = join(process.cwd(), file);
      readFileSync(filePath, 'utf8');
      results.push({
        name: `File exists: ${file}`,
        passed: true,
        message: 'File found and readable',
      });
    } catch (error) {
      results.push({
        name: `File exists: ${file}`,
        passed: false,
        message: `File not found or not readable: ${error}`,
      });
    }
  });

  // Test 2: Check package.json dependencies
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const requiredDeps = [
      '@sentry/nextjs',
      '@vercel/analytics',
      'web-vitals',
    ];

    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        results.push({
          name: `Dependency: ${dep}`,
          passed: true,
          message: 'Dependency installed',
        });
      } else {
        results.push({
          name: `Dependency: ${dep}`,
          passed: false,
          message: 'Dependency not found in package.json',
        });
      }
    });
  } catch (error) {
    results.push({
      name: 'Package.json check',
      passed: false,
      message: `Could not read package.json: ${error}`,
    });
  }

  // Test 3: Check Next.js config
  try {
    const nextConfig = readFileSync(join(process.cwd(), 'next.config.mjs'), 'utf8');
    
    if (nextConfig.includes('@sentry/nextjs')) {
      results.push({
        name: 'Next.js Sentry integration',
        passed: true,
        message: 'Sentry integration found in next.config.mjs',
      });
    } else {
      results.push({
        name: 'Next.js Sentry integration',
        passed: false,
        message: 'Sentry integration not found in next.config.mjs',
      });
    }
  } catch (error) {
    results.push({
      name: 'Next.js config check',
      passed: false,
      message: `Could not read next.config.mjs: ${error}`,
    });
  }

  // Test 4: Check environment variables template
  try {
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');
    const requiredEnvVars = [
      'NEXT_PUBLIC_GA_ID',
      'NEXT_PUBLIC_SENTRY_DSN',
      'NEXT_PUBLIC_APP_VERSION',
    ];

    requiredEnvVars.forEach(envVar => {
      if (envExample.includes(envVar)) {
        results.push({
          name: `Environment variable template: ${envVar}`,
          passed: true,
          message: 'Found in .env.example',
        });
      } else {
        results.push({
          name: `Environment variable template: ${envVar}`,
          passed: false,
          message: 'Not found in .env.example',
        });
      }
    });
  } catch (error) {
    results.push({
      name: 'Environment variables template check',
      passed: false,
      message: `Could not read .env.example: ${error}`,
    });
  }

  return results;
}

function main() {
  console.log('🔍 Testing monitoring setup...\n');

  const results = runTests();
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  // Print results
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (!result.passed) {
      console.log(`   ${result.message}`);
    }
  });

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All monitoring setup tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up your Google Analytics 4 property');
    console.log('2. Create a Sentry project and get your DSN');
    console.log('3. Add the environment variables to your .env.local file');
    console.log('4. Deploy and test in production');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run the main function
main();