#!/usr/bin/env node

/**
 * Dashboard Migration Test Script
 * 
 * This script validates the next-intl Dashboard migration by:
 * 1. Checking all translation keys exist in all locales
 * 2. Validating interpolation patterns
 * 3. Testing cross-namespace references
 * 4. Verifying nested object keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load translation files
const loadMessages = (locale) => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Translation file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Required translation keys for Dashboard component
const requiredKeys = {
  dashboard: [
    'title',
    'subtitle',
    'totalLofts',
    'occupiedLofts',
    'monthlyRevenue',
    'thisMonth',
    'activeTasks',
    'inProgress',
    'billMonitoring',
    'updated',
    'overdue',
    'billsPastDue',
    'dueToday',
    'billsDueNow',
    'upcoming',
    'next30Days',
    'active',
    'loftsWithBills',
    'systemStatus',
    'allBillsCurrent',
    'actionRequired',
    'attentionNeeded',
    'overdueBillsTitle',
    'billsNeedAttention',
    'excellent',
    'noOverdueBills',
    'upcomingBillsTitle',
    'nextDueDates',
    'noUpcomingBills',
    'upToDate',
    'pay',
    'today',
    'tomorrow',
    'dayOverdue',
    'daysOverdue',
    'days',
    'revenueVsExpenses',
    'monthlyFinancialOverview',
    'recentTasks',
    'latestTaskUpdates',
    'due',
    'noRecentTasks',
    'quickActions',
    'addTransaction',
    'viewReports',
    'bills.title',
    'bills.due',
    'tasks.status.todo',
    'tasks.status.inProgress',
    'tasks.status.completed',
    'lofts.addLoft'
  ],
  tasks: [
    'addTask'
  ],
  bills: [
    'utilities.eau',
    'utilities.energie',
    'utilities.telephone',
    'utilities.internet',
    'utilities.tv',
    'utilities.gas'
  ]
};

// Test interpolation patterns
const interpolationTests = [
  {
    key: 'dashboard.daysOverdue',
    params: { count: 5 },
    expectedPattern: /5.*jours.*retard|5.*days.*overdue|5.*أيام.*متأخر/i
  }
];

// Helper function to get nested value
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Validation functions
const validateTranslationKeys = (locale, messages) => {
  const errors = [];
  
  Object.entries(requiredKeys).forEach(([namespace, keys]) => {
    const namespaceData = messages[namespace];
    
    if (!namespaceData) {
      errors.push(`Missing namespace '${namespace}' in ${locale}`);
      return;
    }
    
    keys.forEach(key => {
      const value = getNestedValue(namespaceData, key);
      if (value === undefined || value === null || value === '') {
        errors.push(`Missing key '${namespace}.${key}' in ${locale}`);
      }
    });
  });
  
  return errors;
};

const validateInterpolations = (locale, messages) => {
  const errors = [];
  
  interpolationTests.forEach(test => {
    const [namespace, ...keyPath] = test.key.split('.');
    const namespaceData = messages[namespace];
    
    if (!namespaceData) {
      errors.push(`Missing namespace '${namespace}' for interpolation test in ${locale}`);
      return;
    }
    
    const value = getNestedValue(namespaceData, keyPath.join('.'));
    if (!value) {
      errors.push(`Missing interpolation key '${test.key}' in ${locale}`);
      return;
    }
    
    // Check if the value contains interpolation syntax
    if (!value.includes('{{count}}') && !value.includes('{count}')) {
      errors.push(`Key '${test.key}' in ${locale} doesn't contain interpolation syntax: ${value}`);
    }
  });
  
  return errors;
};

const validateUtilityTypes = (locale, messages) => {
  const errors = [];
  const utilityTypes = ['eau', 'energie', 'telephone', 'internet', 'tv', 'gas'];
  
  const billsData = messages.bills;
  if (!billsData || !billsData.utilities) {
    errors.push(`Missing bills.utilities in ${locale}`);
    return errors;
  }
  
  utilityTypes.forEach(type => {
    if (!billsData.utilities[type]) {
      errors.push(`Missing utility type '${type}' in ${locale}`);
    }
  });
  
  return errors;
};

// Main test function
const runTests = () => {
  const locales = ['fr', 'en', 'ar'];
  let totalErrors = 0;
  
  console.log('🧪 Dashboard Migration Test Suite');
  console.log('=====================================\n');
  
  locales.forEach(locale => {
    console.log(`📋 Testing locale: ${locale.toUpperCase()}`);
    console.log('-'.repeat(30));
    
    try {
      const messages = loadMessages(locale);
      
      // Test 1: Translation Keys
      console.log('🔍 Checking translation keys...');
      const keyErrors = validateTranslationKeys(locale, messages);
      if (keyErrors.length === 0) {
        console.log('✅ All translation keys found');
      } else {
        console.log(`❌ ${keyErrors.length} missing keys:`);
        keyErrors.forEach(error => console.log(`   - ${error}`));
        totalErrors += keyErrors.length;
      }
      
      // Test 2: Interpolations
      console.log('🔍 Checking interpolation patterns...');
      const interpolationErrors = validateInterpolations(locale, messages);
      if (interpolationErrors.length === 0) {
        console.log('✅ All interpolation patterns valid');
      } else {
        console.log(`❌ ${interpolationErrors.length} interpolation issues:`);
        interpolationErrors.forEach(error => console.log(`   - ${error}`));
        totalErrors += interpolationErrors.length;
      }
      
      // Test 3: Utility Types
      console.log('🔍 Checking utility type translations...');
      const utilityErrors = validateUtilityTypes(locale, messages);
      if (utilityErrors.length === 0) {
        console.log('✅ All utility types found');
      } else {
        console.log(`❌ ${utilityErrors.length} utility issues:`);
        utilityErrors.forEach(error => console.log(`   - ${error}`));
        totalErrors += utilityErrors.length;
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error loading ${locale}: ${error.message}`);
      totalErrors++;
    }
  });
  
  // Summary
  console.log('📊 Test Summary');
  console.log('================');
  if (totalErrors === 0) {
    console.log('🎉 All tests passed! Dashboard migration is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the component at /[locale]/dashboard/test-nextintl');
    console.log('   2. Verify all 3 languages (fr, ar, en)');
    console.log('   3. Test dynamic data (bills, tasks, stats)');
    console.log('   4. Test language switching');
    console.log('   5. Compare performance with original component');
  } else {
    console.log(`❌ ${totalErrors} issues found. Please fix before proceeding.`);
    process.exit(1);
  }
};

// Run the tests
runTests();

export { runTests, validateTranslationKeys, validateInterpolations, validateUtilityTypes };