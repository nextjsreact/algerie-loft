#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testColumns() {
  console.log('🔍 Testing if billing columns exist...');
  
  try {
    // Try to select the problematic columns
    const { data, error } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        frequence_paiement_eau,
        prochaine_echeance_eau,
        frequence_paiement_energie,
        prochaine_echeance_energie,
        frequence_paiement_telephone,
        prochaine_echeance_telephone,
        frequence_paiement_internet,
        prochaine_echeance_internet
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ Columns still missing:', error.message);
      console.log('\n🛠️ You need to manually add the columns in Supabase dashboard:');
      console.log('Go to: Supabase Dashboard > SQL Editor');
      console.log('Run this SQL:');
      console.log(`
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_eau VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_eau DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_telephone VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_telephone DATE;
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_internet VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_internet DATE;
      `);
    } else {
      console.log('✅ All billing columns exist!');
      console.log('📊 Sample data:', data);
      console.log('🎉 The database error should be resolved now.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testColumns();