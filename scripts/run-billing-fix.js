#!/usr/bin/env node

/**
 * Script to fix missing billing columns in the lofts table
 * This resolves the error: "could not identify column "prochaine_echeance_energie" in record data type"
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runBillingFix() {
  console.log('🔧 Starting billing columns fix...');
  
  try {
    // Read the SQL fix script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-billing-columns.sql'), 'utf8');
    
    // Execute the SQL script
    console.log('📝 Executing SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('⚠️  exec_sql function not found, trying direct execution...');
      
      // Split the script into individual statements
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.toLowerCase().includes('select')) {
          // For SELECT statements, use the query method
          const { data: selectData, error: selectError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'lofts')
            .like('column_name', '%echeance%');
          
          if (selectError) {
            console.error('❌ Error checking columns:', selectError);
          } else {
            console.log('✅ Billing columns found:', selectData);
          }
        } else {
          // For DDL statements, we need to use a different approach
          console.log(`Executing: ${statement.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('✅ SQL migration executed successfully');
      if (data) {
        console.log('📊 Result:', data);
      }
    }
    
    // Verify the fix by checking if the columns exist
    console.log('🔍 Verifying billing columns...');
    
    // Try to query the lofts table to see if the columns exist
    const { data: testData, error: testError } = await supabase
      .from('lofts')
      .select('id, prochaine_echeance_energie, frequence_paiement_energie')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('prochaine_echeance_energie')) {
        console.error('❌ Billing columns still missing. Manual intervention required.');
        console.error('Please run the following SQL manually in your Supabase dashboard:');
        console.log('\n' + sqlScript);
      } else {
        console.error('❌ Unexpected error:', testError);
      }
    } else {
      console.log('✅ Billing columns verified successfully!');
      console.log('🎉 The database error should now be resolved.');
    }
    
  } catch (error) {
    console.error('❌ Error running billing fix:', error);
    console.error('\n📋 Manual fix required:');
    console.error('Please run the SQL script manually in your Supabase dashboard:');
    console.error('File: scripts/fix-billing-columns.sql');
  }
}

// Run the fix
runBillingFix();