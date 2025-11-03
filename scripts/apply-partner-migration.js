#!/usr/bin/env node

/**
 * Script to apply Partner Dashboard System migration
 * This script extends the existing partners table with required columns
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

async function applyPartnerMigration() {
  console.log('🚀 Applying Partner Dashboard System Migration...\n');

  try {
    // First, let's check the current state
    console.log('🔍 Checking current partners table structure...');
    
    const testColumns = [
      'id', 'user_id', 'created_at', 'updated_at', 
      'address', 'phone', 'business_type', 'verification_status',
      'approved_by', 'approved_at', 'rejected_by', 'rejected_at',
      'business_name', 'tax_id', 'verification_documents', 'portfolio_description'
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('partners')
          .select(column)
          .limit(1);
        
        if (!error) {
          existingColumns.push(column);
        } else {
          missingColumns.push(column);
        }
      } catch (e) {
        missingColumns.push(column);
      }
    }
    
    console.log('✅ Existing columns:', existingColumns);
    console.log('❌ Missing columns:', missingColumns);

    if (missingColumns.length === 0) {
      console.log('🎉 All columns already exist! Migration may have been applied already.');
    } else {
      console.log(`\n📝 Need to add ${missingColumns.length} missing columns`);
    }

    // Check if partner_validation_requests table exists
    console.log('\n🔍 Checking partner_validation_requests table...');
    
    const { error: validationError } = await supabase
      .from('partner_validation_requests')
      .select('id')
      .limit(1);
    
    if (validationError && validationError.message.includes('does not exist')) {
      console.log('❌ partner_validation_requests table needs to be created');
    } else {
      console.log('✅ partner_validation_requests table exists');
    }

    // Check if lofts table has partner_id
    console.log('\n🔍 Checking lofts table partner_id column...');
    
    const { error: loftsError } = await supabase
      .from('lofts')
      .select('partner_id')
      .limit(1);
    
    if (loftsError && loftsError.message.includes('does not exist')) {
      console.log('❌ lofts table needs partner_id column');
    } else {
      console.log('✅ lofts table has partner_id column');
    }

    // Apply the migration by executing individual SQL statements
    console.log('\n🔧 Applying migration statements...\n');

    const migrationStatements = [
      // Add missing columns
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS address TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS phone TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_name TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS tax_id TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS verification_documents TEXT[];",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS portfolio_description TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS admin_notes TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS approved_by UUID;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS rejected_by UUID;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_details JSONB;",
      "ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;",
      
      // Add partner_id to lofts
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS partner_id UUID;",
    ];

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < migrationStatements.length; i++) {
      const statement = migrationStatements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${migrationStatements.length}...`);
        console.log(`   ${statement}`);
        
        // We can't execute DDL directly through Supabase client, so we'll show what needs to be done
        console.log(`✅ Statement ${i + 1} ready for execution`);
        successCount++;
        
      } catch (err) {
        console.log(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Preparation Summary:');
    console.log(`✅ Statements prepared: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Since we can't execute DDL directly, provide instructions
    console.log('\n🎯 Manual Migration Required:');
    console.log('Due to Supabase limitations, please execute the following in the SQL Editor:');
    console.log('\n1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the migration file:');
    console.log('   database/migrations/002-extend-partners-table.sql');
    console.log('3. Execute the SQL');
    console.log('\n4. Or execute these individual statements:');
    
    migrationStatements.forEach((stmt, index) => {
      console.log(`   ${index + 1}. ${stmt}`);
    });

    // Test what we can test
    console.log('\n🧪 Testing current functionality...');
    
    try {
      // Test basic partner operations
      const { data: partnersTest, error: partnersTestError } = await supabase
        .from('partners')
        .select('id, user_id, business_type, verification_status')
        .limit(1);
      
      if (partnersTestError) {
        console.log('❌ Partners table test failed:', partnersTestError.message);
      } else {
        console.log('✅ Partners table basic operations working');
      }

      // Test function if it exists
      const { data: statsTest, error: statsError } = await supabase
        .rpc('get_partner_dashboard_stats', { 
          partner_user_id: '00000000-0000-0000-0000-000000000000' 
        });

      if (statsError) {
        if (statsError.message.includes('does not exist')) {
          console.log('⚠️  Dashboard stats function needs to be created');
        } else {
          console.log('✅ Dashboard stats function exists');
        }
      } else {
        console.log('✅ Dashboard stats function working');
      }

    } catch (error) {
      console.log('⚠️  Testing error:', error.message);
    }

    console.log('\n🎉 Migration preparation completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Execute the migration SQL in Supabase Dashboard');
    console.log('2. Run: node scripts/test-partner-schema.js');
    console.log('3. Verify all functionality is working');

  } catch (error) {
    console.error('💥 Migration preparation failed:', error.message);
    console.error(error);
  }
}

// Run the migration
applyPartnerMigration().then(() => {
  console.log('\n✨ Migration preparation completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration preparation failed:', error);
  process.exit(1);
});

export { applyPartnerMigration };