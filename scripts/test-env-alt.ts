#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { resolve } from 'path';

async function testEnv() {
  console.log('🔍 Testing environment variable loading...\n');

  // Method 1: Check current env vars
  console.log('1. Current environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

  // Method 2: Try to read .env file directly
  console.log('\n2. Reading .env file directly:');
  try {
    const envPath = resolve(process.cwd(), '.env');
    console.log('Env file path:', envPath);

    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    console.log('Env file contents (first few lines):');
    lines.slice(0, 5).forEach((line, index) => {
      if (line.trim() && !line.startsWith('#')) {
        // Hide sensitive values
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        console.log(`  ${key}=${value ? '[SET]' : '[EMPTY]'}`);
      }
    });

    // Check if our specific variables are in the file
    const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
    const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');

    console.log('\nVariables found in .env file:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', hasSupabaseUrl ? 'Found' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', hasServiceKey ? 'Found' : 'Missing');

  } catch (error) {
    console.error('❌ Error reading .env file:', error);
  }

  // Method 3: Try dotenv
  console.log('\n3. Testing dotenv loading:');
  try {
    const dotenv = await import('dotenv');
    const result = dotenv.config({ path: resolve(process.cwd(), '.env') });

    console.log('Dotenv result:', result.error ? `Error: ${result.error}` : 'Success');

    console.log('After dotenv:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

  } catch (error) {
    console.error('❌ Error with dotenv:', error);
  }

  console.log('\n4. Working directory info:');
  console.log('Current working directory:', process.cwd());
}

testEnv().catch(console.error);
