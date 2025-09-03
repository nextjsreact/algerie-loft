#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseColumns() {
  console.log('🔧 Fixing database columns...');
  
  try {
    // First, let's check what columns currently exist
    console.log('🔍 Checking current lofts table structure...');
    
    const { data: currentColumns, error: columnsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'lofts' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('⚠️ Could not check columns with rpc, trying direct approach...');
    } else {
      console.log('📋 Current columns:', currentColumns);
    }

    // Add the missing columns using individual ALTER TABLE statements
    const alterStatements = [
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_eau VARCHAR(20);",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_eau DATE;",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie VARCHAR(20);",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie DATE;",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_telephone VARCHAR(20);",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_telephone DATE;",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_internet VARCHAR(20);",
      "ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_internet DATE;"
    ];

    console.log('📝 Adding missing columns...');
    
    for (const statement of alterStatements) {
      try {
        const { error } = await supabase.rpc('sql', { query: statement });
        if (error) {
          console.log(`⚠️ Statement failed (might already exist): ${statement.substring(0, 50)}...`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️ Error with statement: ${statement.substring(0, 50)}...`);
      }
    }

    // Create indexes
    const indexStatements = [
      "CREATE INDEX IF NOT EXISTS idx_lofts_eau_due_date ON lofts(prochaine_echeance_eau) WHERE prochaine_echeance_eau IS NOT NULL;",
      "CREATE INDEX IF NOT EXISTS idx_lofts_energie_due_date ON lofts(prochaine_echeance_energie) WHERE prochaine_echeance_energie IS NOT NULL;",
      "CREATE INDEX IF NOT EXISTS idx_lofts_telephone_due_date ON lofts(prochaine_echeance_telephone) WHERE prochaine_echeance_telephone IS NOT NULL;",
      "CREATE INDEX IF NOT EXISTS idx_lofts_internet_due_date ON lofts(prochaine_echeance_internet) WHERE prochaine_echeance_internet IS NOT NULL;"
    ];

    console.log('📝 Creating indexes...');
    
    for (const statement of indexStatements) {
      try {
        const { error } = await supabase.rpc('sql', { query: statement });
        if (error) {
          console.log(`⚠️ Index creation failed: ${error.message}`);
        } else {
          console.log(`✅ Created index: ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️ Error creating index: ${statement.substring(0, 50)}...`);
      }
    }

    // Verify the fix
    console.log('🔍 Verifying the fix...');
    
    const { data: testData, error: testError } = await supabase
      .from('lofts')
      .select('id, prochaine_echeance_energie, frequence_paiement_energie')
      .limit(1);
    
    if (testError) {
      console.error('❌ Verification failed:', testError.message);
      console.log('\n🛠️ Manual fix required:');
      console.log('Please go to your Supabase dashboard > SQL Editor and run:');
      console.log('\nALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie DATE;');
      console.log('ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie VARCHAR(20);');
    } else {
      console.log('✅ Database columns fixed successfully!');
      console.log('🎉 The "prochaine_echeance_energie" error should now be resolved.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    console.log('\n🛠️ Manual fix required:');
    console.log('Please go to your Supabase dashboard > SQL Editor and run the SQL from scripts/fix-billing-columns.sql');
  }
}

// Run the fix
fixDatabaseColumns();