#!/usr/bin/env node

/**
 * Quick Performance Test
 * Tests the optimized APIs to verify improvements
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  console.log(`\n🧪 Testing ${description}...`);
  const start = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      timeout: 15000, // 15 second timeout
      headers: {
        'User-Agent': 'Performance-Test/1.0'
      }
    });
    
    const duration = Date.now() - start;
    const status = response.status;
    
    if (status === 200) {
      console.log(`✅ ${description}: ${duration}ms (Status: ${status})`);
      return { success: true, duration, status };
    } else {
      console.log(`⚠️  ${description}: ${duration}ms (Status: ${status})`);
      return { success: false, duration, status };
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ ${description}: ${duration}ms (Error: ${error.message})`);
    return { success: false, duration, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');
  console.log('Make sure your development server is running on http://localhost:3000\n');

  const tests = [
    {
      endpoint: '/api/notifications/unread-count',
      description: 'Notifications API (should be < 1s)'
    },
    {
      endpoint: '/api/admin/reports?type=financial&period=monthly',
      description: 'Financial Reports API (should be < 10s)'
    },
    {
      endpoint: '/api/admin/reports?type=users&period=weekly',
      description: 'User Reports API (should be < 5s)'
    },
    {
      endpoint: '/api/admin/reports?type=analytics&period=daily',
      description: 'Analytics Reports API (should be < 5s)'
    },
    {
      endpoint: '/api/health',
      description: 'Health Check API (should be < 1s)'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.description);
    results.push({ ...test, ...result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Performance Test Summary:');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`⏱️  Average Response Time: ${Math.round(avgDuration)}ms`);
  }

  // Performance recommendations
  console.log('\n💡 Performance Analysis:');
  
  results.forEach(result => {
    if (result.success) {
      if (result.duration < 1000) {
        console.log(`🟢 ${result.description}: Excellent (${result.duration}ms)`);
      } else if (result.duration < 5000) {
        console.log(`🟡 ${result.description}: Good (${result.duration}ms)`);
      } else {
        console.log(`🟠 ${result.description}: Needs improvement (${result.duration}ms)`);
      }
    } else {
      console.log(`🔴 ${result.description}: Failed - ${result.error || 'Unknown error'}`);
    }
  });

  console.log('\n🎯 Next Steps:');
  if (failed.length === 0) {
    console.log('• All APIs are working! Performance optimizations successful.');
    console.log('• Monitor production performance with these same endpoints.');
    console.log('• Consider adding more caching if response times increase.');
  } else {
    console.log('• Some APIs failed - check server logs for details.');
    console.log('• Ensure database connections are working properly.');
    console.log('• Verify environment variables are set correctly.');
  }
}

// Run the tests
runPerformanceTests().catch(error => {
  console.error('❌ Performance test failed:', error);
  process.exit(1);
});