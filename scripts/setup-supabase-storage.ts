#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

interface BucketConfig {
  name: string;
  public: boolean;
  allowedMimeTypes?: string[];
  fileSizeLimit?: number;
}

const REQUIRED_BUCKETS: BucketConfig[] = [
  {
    name: 'loft-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  {
    name: 'user-avatars',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 2 * 1024 * 1024 // 2MB
  },
  {
    name: 'documents',
    public: false,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileSizeLimit: 50 * 1024 * 1024 // 50MB
  },
  {
    name: 'reports',
    public: false,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 20 * 1024 * 1024 // 20MB
  }
];

async function setupStorageBuckets() {
  console.log('🗄️ Setting up Supabase storage buckets...\n');

  // Create Supabase client with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
    return false;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Check existing buckets
  console.log('📋 Checking existing buckets...');
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Failed to list existing buckets:', listError.message);
    return false;
  }

  console.log(`Found ${existingBuckets?.length || 0} existing buckets:`);
  existingBuckets?.forEach(bucket => {
    console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });
  console.log();

  // Create missing buckets
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const bucketConfig of REQUIRED_BUCKETS) {
    const exists = existingBuckets?.some(b => b.name === bucketConfig.name);
    
    if (exists) {
      console.log(`⏭️ Bucket '${bucketConfig.name}' already exists, skipping...`);
      skippedCount++;
      continue;
    }

    console.log(`🔨 Creating bucket '${bucketConfig.name}' (${bucketConfig.public ? 'public' : 'private'})...`);
    
    const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
      public: bucketConfig.public,
      allowedMimeTypes: bucketConfig.allowedMimeTypes,
      fileSizeLimit: bucketConfig.fileSizeLimit
    });

    if (error) {
      console.error(`❌ Failed to create bucket '${bucketConfig.name}':`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Successfully created bucket '${bucketConfig.name}'`);
      createdCount++;
    }
  }

  console.log('\n📊 SETUP SUMMARY');
  console.log('================');
  console.log(`Buckets created: ${createdCount}`);
  console.log(`Buckets skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n⚠️ Some buckets could not be created. Please check the errors above.');
    console.log('You may need to create them manually in the Supabase dashboard.');
    return false;
  }

  if (createdCount > 0) {
    console.log('\n✅ Storage setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure RLS policies for the buckets if needed');
    console.log('2. Test file uploads to verify everything works');
    console.log('3. Run the validation script again to confirm setup');
  } else {
    console.log('\n✅ All required buckets already exist!');
  }

  return true;
}

async function testStorageSetup() {
  console.log('\n🧪 Testing storage setup...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing environment variables for testing');
    return false;
  }

  const supabase = createClient(supabaseUrl, anonKey);

  // Test listing buckets
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Failed to list buckets:', error.message);
    return false;
  }

  console.log(`✅ Successfully listed ${buckets?.length || 0} buckets`);
  
  // Test accessing public bucket
  const publicBucket = buckets?.find(b => b.name === 'loft-images' && b.public);
  if (publicBucket) {
    const { data: files, error: listError } = await supabase.storage
      .from('loft-images')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Failed to list files in loft-images bucket:', listError.message);
      return false;
    }
    
    console.log('✅ Successfully accessed loft-images bucket');
  }

  return true;
}

async function main() {
  try {
    const setupSuccess = await setupStorageBuckets();
    
    if (setupSuccess) {
      const testSuccess = await testStorageSetup();
      
      if (testSuccess) {
        console.log('\n🎉 Storage setup and testing completed successfully!');
        console.log('\nYou can now run the validation script to verify everything works:');
        console.log('npx tsx scripts/validate-supabase-integrations.ts');
        process.exit(0);
      } else {
        console.log('\n⚠️ Storage setup completed but testing failed.');
        process.exit(1);
      }
    } else {
      console.log('\n❌ Storage setup failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
main();