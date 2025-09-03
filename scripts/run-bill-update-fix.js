// Script to run the fix for the bill update function issue

import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file directory with ESM support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
let envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}
dotenv.config({ path: envPath });

// Database connection string
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('❌ No database URL found in environment variables. Please set DATABASE_URL or POSTGRES_URL.');
  process.exit(1);
}

// Path to the SQL fix file
const fixFilePath = path.resolve(process.cwd(), 'database', 'fix-bill-update-function.sql');

if (!fs.existsSync(fixFilePath)) {
  console.error(`❌ Fix file not found: ${fixFilePath}`);
  process.exit(1);
}

console.log('🔧 Applying fix for bill update function...');

try {
  // Execute the SQL file using psql
  execSync(`psql "${dbUrl}" -f "${fixFilePath}"`, { stdio: 'inherit' });
  console.log('✅ Fix applied successfully!');
} catch (error) {
  console.error('❌ Error applying fix:', error.message);
  console.error('You may need to run this manually with psql:');
  console.error(`psql "${dbUrl}" -f "${fixFilePath}"`);
  process.exit(1);
}

console.log('🔍 Testing the fix...');
try {
  // Test if the function is working now
  execSync(`psql "${dbUrl}" -c "SELECT update_next_bill_dates() IS NOT NULL AS function_works;"`, { stdio: 'inherit' });
  console.log('✅ Function update_next_bill_dates() appears to be working.');
} catch (error) {
  console.error('❌ Error testing the fix:', error.message);
}
