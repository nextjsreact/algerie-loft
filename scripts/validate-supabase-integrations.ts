#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load environment variables
config();

import { supabaseConnectionValidator } from '@/lib/migration/supabase-connection-validator';
import { supabaseStorageValidator } from '@/lib/migration/supabase-storage-validator';

interface SupabaseIntegrationReport {
  timestamp: Date;
  overallStatus: 'success' | 'warning' | 'failure';
  databaseValidation: any;
  storageValidation: any;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
  };
  recommendations: string[];
}

async function validateSupabaseIntegrations(): Promise<SupabaseIntegrationReport> {
  console.log('🚀 Starting comprehensive Supabase integration validation...\n');

  // Run database validation
  console.log('📊 Validating database connections and operations...');
  const databaseValidation = await supabaseConnectionValidator.generateValidationReport();
  
  console.log(`Database validation completed: ${databaseValidation.overallStatus}`);
  console.log(`- Connections tested: ${databaseValidation.connections.length}`);
  console.log(`- CRUD operations tested: ${databaseValidation.crudTests.length}`);
  console.log(`- RLS policies validated: ${databaseValidation.rlsValidation.length}\n`);

  // Run storage validation
  console.log('🗄️ Validating storage buckets and file operations...');
  const storageValidation = await supabaseStorageValidator.generateValidationReport();
  
  console.log(`Storage validation completed: ${storageValidation.overallStatus}`);
  console.log(`- Buckets validated: ${storageValidation.buckets.length}`);
  console.log(`- Upload tests performed: ${storageValidation.uploadTests.length}`);
  console.log(`- Image optimization tests: ${storageValidation.imageOptimization.length}\n`);

  // Calculate overall status and summary
  const allStatuses = [databaseValidation.overallStatus, storageValidation.overallStatus];
  let overallStatus: 'success' | 'warning' | 'failure' = 'success';
  
  if (allStatuses.includes('failure')) {
    overallStatus = 'failure';
  } else if (allStatuses.includes('warning')) {
    overallStatus = 'warning';
  }

  // Calculate test summary
  const totalTests = 
    databaseValidation.connections.length + 
    databaseValidation.crudTests.length + 
    databaseValidation.rlsValidation.length +
    storageValidation.buckets.length +
    storageValidation.uploadTests.length +
    storageValidation.imageOptimization.length;

  const passedTests = 
    databaseValidation.connections.filter(c => c.connected).length +
    databaseValidation.crudTests.filter(t => t.success).length +
    databaseValidation.rlsValidation.filter(r => r.success).length +
    storageValidation.buckets.filter(b => b.exists && !b.error).length +
    storageValidation.uploadTests.filter(t => t.success).length +
    storageValidation.imageOptimization.filter(i => i.success).length;

  const failedTests = totalTests - passedTests;
  const warningTests = 
    storageValidation.buckets.filter(b => b.exists && b.error).length;

  // Combine recommendations
  const recommendations = [
    '=== DATABASE VALIDATION ===',
    ...databaseValidation.recommendations,
    '',
    '=== STORAGE VALIDATION ===',
    ...storageValidation.recommendations
  ];

  const report: SupabaseIntegrationReport = {
    timestamp: new Date(),
    overallStatus,
    databaseValidation,
    storageValidation,
    summary: {
      totalTests,
      passedTests,
      failedTests,
      warningTests
    },
    recommendations
  };

  return report;
}

async function main() {
  try {
    const report = await validateSupabaseIntegrations();

    // Print summary
    console.log('📋 SUPABASE INTEGRATION VALIDATION SUMMARY');
    console.log('==========================================');
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Warnings: ${report.summary.warningTests}`);
    console.log(`Timestamp: ${report.timestamp.toISOString()}\n`);

    // Print recommendations
    console.log('📝 RECOMMENDATIONS');
    console.log('==================');
    report.recommendations.forEach(rec => console.log(rec));

    // Print detailed results
    console.log('\n📊 DETAILED RESULTS');
    console.log('===================');
    
    console.log('\n🔗 Database Connections:');
    report.databaseValidation.connections.forEach((conn: any) => {
      const status = conn.connected ? '✅' : '❌';
      const latency = conn.latency ? ` (${Math.round(conn.latency)}ms)` : '';
      console.log(`  ${status} ${conn.environment}${latency}`);
      if (conn.error) console.log(`     Error: ${conn.error}`);
    });

    console.log('\n📝 CRUD Operations:');
    report.databaseValidation.crudTests.forEach((test: any) => {
      const status = test.success ? '✅' : '❌';
      const latency = test.latency ? ` (${Math.round(test.latency)}ms)` : '';
      console.log(`  ${status} ${test.operation} on ${test.table}${latency}`);
      if (test.error) console.log(`     Error: ${test.error}`);
    });

    console.log('\n🔒 RLS Policies:');
    report.databaseValidation.rlsValidation.forEach((rls: any) => {
      const status = rls.success ? '✅' : '❌';
      console.log(`  ${status} ${rls.table}: ${rls.policy}`);
      if (rls.error) console.log(`     Error: ${rls.error}`);
    });

    console.log('\n🗄️ Storage Buckets:');
    report.storageValidation.buckets.forEach((bucket: any) => {
      const status = bucket.exists ? (bucket.error ? '⚠️' : '✅') : '❌';
      const publicStatus = bucket.public ? 'public' : 'private';
      console.log(`  ${status} ${bucket.name} (${publicStatus})`);
      if (bucket.error) console.log(`     Error: ${bucket.error}`);
      if (bucket.fileCount !== undefined) console.log(`     Files: ${bucket.fileCount}`);
    });

    console.log('\n📤 Upload Tests:');
    report.storageValidation.uploadTests.forEach((test: any) => {
      const status = test.success ? '✅' : '❌';
      const time = test.uploadTime ? ` (${Math.round(test.uploadTime)}ms)` : '';
      console.log(`  ${status} ${test.bucket}/${test.fileName}${time}`);
      if (test.error) console.log(`     Error: ${test.error}`);
      if (test.publicUrl) console.log(`     Public URL: Available`);
      if (test.signedUrl) console.log(`     Signed URL: Available`);
    });

    console.log('\n🖼️ Image Optimization:');
    if (report.storageValidation.imageOptimization.length === 0) {
      console.log('  ℹ️ No image optimization tests performed');
    } else {
      report.storageValidation.imageOptimization.forEach((test: any) => {
        const status = test.success ? '✅' : '❌';
        console.log(`  ${status} Image optimization test`);
        if (test.error) console.log(`     Error: ${test.error}`);
      });
    }

    // Exit with appropriate code
    if (report.overallStatus === 'failure') {
      console.log('\n❌ Validation failed. Please address the issues above before proceeding with migration.');
      process.exit(1);
    } else if (report.overallStatus === 'warning') {
      console.log('\n⚠️ Validation completed with warnings. Review recommendations before proceeding.');
      process.exit(0);
    } else {
      console.log('\n✅ All Supabase integrations validated successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
main();

export { validateSupabaseIntegrations };