#!/usr/bin/env node

/**
 * Script to check and ensure currencies are properly set up
 */

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

async function checkCurrencies() {
  console.log('🔍 Checking currencies setup...');
  
  try {
    // Check if currencies exist
    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('*')
      .order('code');

    if (error) {
      console.error('❌ Error fetching currencies:', error);
      return;
    }

    if (!currencies || currencies.length === 0) {
      console.log('⚠️  No currencies found. Adding default currencies...');
      
      // Insert default currencies
      const { error: insertError } = await supabase
        .from('currencies')
        .insert([
          { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', is_default: true, ratio: 1.0 },
          { code: 'EUR', name: 'Euro', symbol: '€', is_default: false, ratio: 0.0075 },
          { code: 'USD', name: 'US Dollar', symbol: '$', is_default: false, ratio: 0.0074 }
        ]);

      if (insertError) {
        console.error('❌ Error inserting currencies:', insertError);
        return;
      }

      console.log('✅ Default currencies added successfully!');
    } else {
      console.log('✅ Currencies found:');
      currencies.forEach(currency => {
        console.log(`  - ${currency.code} (${currency.symbol}) - ${currency.name}${currency.is_default ? ' [DEFAULT]' : ''}`);
      });
    }

    // Check for default currency
    const defaultCurrency = currencies?.find(c => c.is_default);
    if (!defaultCurrency) {
      console.log('⚠️  No default currency found. Setting DZD as default...');
      
      const { error: updateError } = await supabase
        .from('currencies')
        .update({ is_default: true })
        .eq('code', 'DZD');

      if (updateError) {
        console.error('❌ Error setting default currency:', updateError);
      } else {
        console.log('✅ DZD set as default currency');
      }
    }

  } catch (error) {
    console.error('❌ Error checking currencies:', error);
  }
}

checkCurrencies();