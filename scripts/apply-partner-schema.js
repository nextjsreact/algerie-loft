#!/usr/bin/env node

/**
 * Script to apply Partner Dashboard System database schema
 * This script applies the database schema to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyPartnerSchema() {
  console.log('🚀 Applying Partner Dashboard System Database Schema...\n');

  try {
    // Read the schema file
    const schemaPath = join(process.cwd(), 'database', 'partner-dashboard-schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded successfully');
    console.log('📊 Schema size:', (schemaSQL.length / 1024).toFixed(2), 'KB\n');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log('📝 Found', statements.length, 'SQL statements to execute\n');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('IF NOT EXISTS')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message} (expected)`);
          } else {
            console.log(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);

    // Verify the schema was applied
    console.log('\n🔍 Verifying schema application...');
    
    await verifySchema();

    console.log('\n🎉 Partner Dashboard System schema application completed!');

  } catch (error) {
    console.error('💥 Schema application failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function verifySchema() {
  try {
    // Check if tables exist
    console.log('Checking tables...');
    
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);
    
    if (partnersError) {
      console.log('❌ Partners table:', partnersError.message);
    } else {
      console.log('✅ Partners table exists');
    }

    const { data: requests, error: requestsError } = await supabase
      .from('partner_validation_requests')
      .select('id')
      .limit(1);
    
    if (requestsError) {
      console.log('❌ Partner validation requests table:', requestsError.message);
    } else {
      console.log('✅ Partner validation requests table exists');
    }

    // Check if lofts table has partner_id column
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('partner_id')
      .limit(1);
    
    if (loftsError) {
      console.log('❌ Lofts partner_id column:', loftsError.message);
    } else {
      console.log('✅ Lofts table has partner_id column');
    }

    // Check if functions exist
    console.log('Checking functions...');
    
    try {
      const { error: statsError } = await supabase
        .rpc('get_partner_dashboard_stats', { 
          partner_user_id: '00000000-0000-0000-0000-000000000000' 
        });
      
      if (!statsError || !statsError.message.includes('does not exist')) {
        console.log('✅ get_partner_dashboard_stats function exists');
      } else {
        console.log('❌ get_partner_dashboard_stats function missing');
      }
    } catch (error) {
      console.log('⚠️  Function verification error:', error.message);
    }

  } catch (error) {
    console.log('⚠️  Verification error:', error.message);
  }
}

// Alternative method: Apply schema using direct SQL execution
async function applySchemaDirectly() {
  console.log('🔄 Trying direct SQL execution method...\n');

  try {
    // Read the migration file instead
    const migrationPath = join(process.cwd(), 'database', 'migrations', '001-add-partner-system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

    // Execute the entire migration as one transaction
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      console.log('❌ Migration failed:', error.message);
      
      // Try applying individual parts
      console.log('🔄 Trying individual statement execution...');
      await applyPartnerSchema();
    } else {
      console.log('✅ Migration applied successfully');
      await verifySchema();
    }

  } catch (error) {
    console.error('💥 Direct SQL execution failed:', error.message);
    
    // Fallback to statement-by-statement execution
    console.log('🔄 Falling back to statement-by-statement execution...');
    await applyPartnerSchema();
  }
}

// Run the schema application
console.log('🎯 Starting Partner Dashboard System schema application...\n');

// Try direct method first, then fallback to statement-by-statement
applySchemaDirectly().then(() => {
  console.log('\n✨ Schema application completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Schema application failed:', error);
  process.exit(1);
});

export { applyPartnerSchema };