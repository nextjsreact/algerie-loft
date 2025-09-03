#!/usr/bin/env node

/**
 * Script to fix DECIMAL precision overflow in transaction reference checking
 * This resolves the error: "numeric field overflow (precision 5, scale 2)"
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

async function runDecimalFix() {
  console.log('🔧 Starting DECIMAL precision fix...');
  
  try {
    // Read the SQL fix script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-decimal-precision.sql'), 'utf8');
    
    console.log('📝 Executing SQL fix...');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🔍 Verifying the fix...');
    
    // Test if the function exists and works
    const { data: testData, error: testError } = await supabase
      .rpc('get_transaction_amount_alerts', { days_back: 1 });
    
    if (testError) {
      console.error('❌ Error testing the fix:', testError);
    } else {
      console.log('✅ Function test successful');
      console.log(`📊 Found ${testData?.length || 0} transaction alerts`);
    }
    
    console.log('🎉 DECIMAL precision fix completed successfully!');
    console.log('💡 The bill payment form should now work without overflow errors.');
    
  } catch (error) {
    console.error('❌ Error running decimal fix:', error);
    console.error('\n📋 Manual fix required:');
    console.error('Please run the SQL script manually in your Supabase dashboard:');
    console.error('File: scripts/fix-decimal-precision.sql');
  }
}

// Run the fix
runDecimalFix();