#!/usr/bin/env node

const { performance } = require('perf_hooks');

async function healthCheck() {
  const fetch = (await import('node-fetch')).default;
  const baseUrl = process.env.HEALTH_CHECK_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log(`🏥 Running health check for: ${baseUrl}`);
  
  const checks = [
    {
      name: 'Homepage',
      path: '/',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Services Page',
      path: '/services',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Portfolio Page',
      path: '/portfolio',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Contact Page',
      path: '/contact',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'API Health Endpoint',
      path: '/api/health',
      expectedStatus: 200,
      timeout: 3000
    },
    {
      name: 'Sitemap',
      path: '/sitemap.xml',
      expectedStatus: 200,
      timeout: 3000
    },
    {
      name: 'Robots.txt',
      path: '/robots.txt',
      expectedStatus: 200,
      timeout: 3000
    }
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const check of checks) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${baseUrl}${check.path}`, {
        timeout: check.timeout,
        headers: {
          'User-Agent': 'Health-Check/1.0'
        }
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const success = response.status === check.expectedStatus;
      
      results.push({
        name: check.name,
        path: check.path,
        status: response.status,
        responseTime,
        success
      });
      
      if (success) {
        console.log(`✅ ${check.name} - OK (${response.status}) - ${responseTime}ms`);
        passed++;
      } else {
        console.error(`❌ ${check.name} - Expected ${check.expectedStatus}, got ${response.status} - ${responseTime}ms`);
        failed++;
      }
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      results.push({
        name: check.name,
        path: check.path,
        error: error.message,
        responseTime,
        success: false
      });
      
      console.error(`❌ ${check.name} - ${error.message} - ${responseTime}ms`);
      failed++;
    }
  }

  // Summary
  console.log('\n📊 Health Check Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  // Performance metrics
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  
  console.log(`⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`);

  // Exit with error code if any checks failed
  if (failed > 0) {
    console.error('\n💥 Health check failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All health checks passed!');
    process.exit(0);
  }
}

healthCheck().catch(error => {
  console.error('💥 Health check crashed:', error);
  process.exit(1);
});