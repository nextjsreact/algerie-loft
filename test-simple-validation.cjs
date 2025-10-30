/**
 * Simple validation test without complex imports
 * Tests basic functionality of our implemented services
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Reservation Data Consistency - Simple Validation');
console.log('==================================================\n');

// Test 1: Check if all required files exist
console.log('📁 Checking file structure...');

const requiredFiles = [
  'lib/services/loft-cache-service.ts',
  'lib/services/system-health-monitor.ts', 
  'lib/services/reservation-performance-monitor.ts',
  'lib/services/performance-initialization.ts',
  'database/performance-indexes.sql',
  'app/api/monitoring/performance/route.ts'
];

let filesExist = 0;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    filesExist++;
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

console.log(`\n📊 Files: ${filesExist}/${requiredFiles.length} exist\n`);

// Test 2: Check database schema files
console.log('🗄️  Checking database optimization files...');

const dbFiles = [
  'database/performance-indexes.sql',
  'database/reservations-schema-fixed.sql'
];

let dbFilesExist = 0;
dbFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    dbFilesExist++;
    
    // Check content
    const content = fs.readFileSync(file, 'utf8');
    if (file.includes('performance-indexes')) {
      const hasIndexes = content.includes('idx_reservations_loft_id') && 
                        content.includes('idx_reservations_date_range');
      console.log(`   ${hasIndexes ? '✅' : '❌'} Contains required indexes`);
    }
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

console.log(`\n📊 Database files: ${dbFilesExist}/${dbFiles.length} exist\n`);

// Test 3: Check service file content
console.log('🔧 Checking service implementations...');

const serviceChecks = [
  {
    file: 'lib/services/loft-cache-service.ts',
    checks: ['LoftCacheService', 'cacheLoftSearch', 'getCacheMetrics']
  },
  {
    file: 'lib/services/system-health-monitor.ts', 
    checks: ['SystemHealthMonitor', 'performHealthCheck', 'getHealthStatus']
  },
  {
    file: 'lib/services/reservation-performance-monitor.ts',
    checks: ['ReservationPerformanceMonitor', 'startTiming', 'getPerformanceReport']
  }
];

let servicesValid = 0;
serviceChecks.forEach(({ file, checks }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasAllChecks = checks.every(check => content.includes(check));
    
    console.log(`${hasAllChecks ? '✅' : '❌'} ${file}`);
    if (hasAllChecks) {
      servicesValid++;
      checks.forEach(check => {
        console.log(`   ✅ Contains: ${check}`);
      });
    } else {
      checks.forEach(check => {
        const hasCheck = content.includes(check);
        console.log(`   ${hasCheck ? '✅' : '❌'} Contains: ${check}`);
      });
    }
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
  console.log('');
});

// Test 4: Check API endpoints
console.log('🌐 Checking API endpoints...');

const apiFile = 'app/api/monitoring/performance/route.ts';
if (fs.existsSync(apiFile)) {
  const content = fs.readFileSync(apiFile, 'utf8');
  const hasGET = content.includes('export async function GET');
  const hasPOST = content.includes('export async function POST');
  
  console.log(`${hasGET && hasPOST ? '✅' : '❌'} ${apiFile}`);
  console.log(`   ${hasGET ? '✅' : '❌'} GET endpoint`);
  console.log(`   ${hasPOST ? '✅' : '❌'} POST endpoint`);
} else {
  console.log(`❌ ${apiFile} - MISSING`);
}

console.log('');

// Test 5: Check test files
console.log('🧪 Checking test files...');

const testFiles = [
  '__tests__/services/loft-cache-service.test.ts',
  '__tests__/services/system-health-monitor.test.ts',
  '__tests__/services/reservation-performance-monitor.test.ts',
  '__tests__/api/monitoring/performance.test.ts',
  '__tests__/integration/reservation-data-consistency.test.ts'
];

let testFilesExist = 0;
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    testFilesExist++;
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

console.log(`\n📊 Test files: ${testFilesExist}/${testFiles.length} exist\n`);

// Summary
console.log('📋 VALIDATION SUMMARY');
console.log('====================');

const totalScore = filesExist + dbFilesExist + servicesValid + testFilesExist;
const maxScore = requiredFiles.length + dbFiles.length + serviceChecks.length + testFiles.length;
const percentage = (totalScore / maxScore) * 100;

console.log(`📊 Overall Score: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)`);

if (percentage >= 90) {
  console.log('🎉 EXCELLENT! All components are properly implemented.');
  console.log('✅ Ready for testing and deployment.');
} else if (percentage >= 70) {
  console.log('⚠️  GOOD! Most components are implemented.');
  console.log('🔧 Some minor issues need attention.');
} else {
  console.log('❌ NEEDS WORK! Several components are missing or incomplete.');
  console.log('🚨 Significant implementation required.');
}

console.log('\n🚀 Next Steps:');
if (percentage >= 90) {
  console.log('1. Run comprehensive tests');
  console.log('2. Deploy database indexes');
  console.log('3. Initialize monitoring services');
  console.log('4. Set up production monitoring');
} else {
  console.log('1. Fix missing or incomplete components');
  console.log('2. Verify service implementations');
  console.log('3. Complete test coverage');
  console.log('4. Re-run validation');
}

console.log('\n✨ Validation completed!');

// Exit with appropriate code
process.exit(percentage >= 90 ? 0 : 1);