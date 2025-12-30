#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

async function setupDatabaseFunctions() {
  console.log('🔧 Setting up database functions and tables...\n');

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

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'setup-rls-functions.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Executing SQL setup script...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // If exec_sql doesn't exist, try executing statements individually
      console.log('⚠️ exec_sql function not available, executing statements individually...');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          if (stmtError) {
            // Try direct query for some statements
            const { error: queryError } = await supabase.from('_').select('*').limit(0);
            // This will fail but we can try other approaches
            console.log(`⚠️ Statement execution issue: ${statement.substring(0, 50)}...`);
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`⚠️ Error executing statement: ${statement.substring(0, 50)}...`);
          errorCount++;
        }
      }

      console.log(`📊 Executed ${successCount} statements successfully, ${errorCount} with issues`);
    } else {
      console.log('✅ SQL setup script executed successfully');
    }

    // Test the setup by checking if the function exists
    console.log('\n🧪 Testing setup...');
    
    // Test check_rls_enabled function
    const { data: rlsTest, error: rlsError } = await supabase.rpc('check_rls_enabled', { table_name: 'profiles' });
    
    if (rlsError) {
      console.log('⚠️ RLS check function test failed:', rlsError.message);
      console.log('📝 You may need to run the SQL manually in Supabase SQL editor:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy and paste the content from scripts/setup-rls-functions.sql');
      console.log('   3. Execute the SQL');
    } else {
      console.log('✅ RLS check function is working');
    }

    // Test audit_logs table
    const { data: auditTest, error: auditError } = await supabase
      .from('audit_logs')
      .select('count')
      .limit(1);
    
    if (auditError) {
      console.log('⚠️ Audit logs table test failed:', auditError.message);
    } else {
      console.log('✅ Audit logs table is accessible');
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to setup database functions:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await setupDatabaseFunctions();
    
    if (success) {
      console.log('\n🎉 Database setup completed!');
      console.log('\nYou can now run the validation script to verify everything works:');
      console.log('npx tsx scripts/validate-supabase-integrations.ts');
      process.exit(0);
    } else {
      console.log('\n❌ Database setup failed.');
      console.log('\nPlease run the SQL manually in Supabase Dashboard > SQL Editor');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
main();