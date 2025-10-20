#!/usr/bin/env node

/**
 * Script to verify the project setup
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'tsconfig.json',
  'tailwind.config.ts',
  '.eslintrc.json',
  '.prettierrc',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/lib/utils.ts',
  'src/types/index.ts',
];

const requiredDirectories = [
  'src/app',
  'src/components/ui',
  'src/components/layout',
  'src/components/forms',
  'src/lib',
  'src/types',
  'src/styles',
  'public',
  '.husky',
];

console.log('🔍 Verifying project setup...\n');

let allGood = true;

// Check required files
console.log('📄 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
});

console.log('\n📁 Checking required directories:');
requiredDirectories.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, '..', dir));
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allGood = false;
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const requiredScripts = ['dev', 'build', 'start', 'lint', 'format'];
requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`  ${exists ? '✅' : '❌'} ${script}`);
  if (!exists) allGood = false;
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Project setup is complete and ready!');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to install dependencies');
  console.log('2. Run "npm run dev" to start development server');
  console.log('3. Open http://localhost:3001 in your browser');
} else {
  console.log('❌ Some files or directories are missing.');
  console.log('Please check the setup and try again.');
}
console.log('='.repeat(50));