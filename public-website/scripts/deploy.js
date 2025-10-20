#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENVIRONMENTS = {
  staging: {
    branch: 'develop',
    url: process.env.STAGING_URL || 'https://staging.your-domain.com',
    vercelArgs: '--env NODE_ENV=staging'
  },
  production: {
    branch: 'main',
    url: process.env.PROD_URL || 'https://your-domain.com',
    vercelArgs: '--prod'
  }
};

async function deploy(environment = 'staging') {
  console.log(`🚀 Starting deployment to ${environment}...`);
  
  const config = ENVIRONMENTS[environment];
  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`);
    process.exit(1);
  }

  try {
    // Check if we're on the correct branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== config.branch) {
      console.warn(`⚠️  Warning: You're on branch '${currentBranch}' but deploying to ${environment} (expected '${config.branch}')`);
    }

    // Run pre-deployment checks
    console.log('🔍 Running pre-deployment checks...');
    execSync('npm run lint', { stdio: 'inherit' });
    execSync('npm run test -- --run', { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });

    // Deploy to Vercel
    console.log(`📦 Deploying to Vercel (${environment})...`);
    const deployCommand = `vercel ${config.vercelArgs} --yes`;
    const deploymentUrl = execSync(deployCommand, { encoding: 'utf8' }).trim();

    console.log(`✅ Deployment successful!`);
    console.log(`🌐 URL: ${deploymentUrl}`);

    // Run post-deployment health check
    console.log('🏥 Running health check...');
    await healthCheck(deploymentUrl);

    console.log(`🎉 ${environment} deployment completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Deployment failed:`, error.message);
    process.exit(1);
  }
}

async function healthCheck(url) {
  const fetch = (await import('node-fetch')).default;
  
  const endpoints = [
    '/',
    '/services',
    '/portfolio',
    '/about',
    '/contact',
    '/api/health'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${url}${endpoint}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Deployment-Health-Check/1.0'
        }
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - OK (${response.status})`);
      } else {
        console.warn(`⚠️  ${endpoint} - ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - ${error.message}`);
    }
  }
}

// Parse command line arguments
const environment = process.argv[2] || 'staging';
deploy(environment);