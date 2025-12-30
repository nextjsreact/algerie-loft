#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load environment variables
config();

// Simple test to check if Supabase connection works
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment variables:');
    console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Set' : '❌ Missing'}`);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Missing required environment variables');
      return false;
    }
    
    // Test basic connection using direct import
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('\n🔗 Testing database connection...');
    
    // Simple health check
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test storage if available
    console.log('\n🗄️ Testing storage connection...');
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        console.log(`⚠️ Storage connection failed: ${storageError.message}`);
      } else {
        console.log(`✅ Storage connection successful (${buckets?.length || 0} buckets found)`);
        if (buckets && buckets.length > 0) {
          buckets.forEach(bucket => {
            console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
          });
        }
      }
    } catch (storageError) {
      console.log(`⚠️ Storage test failed: ${storageError}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

async function main() {
  const success = await testSupabaseConnection();
  process.exit(success ? 0 : 1);
}

// Run if this is the main module
main();