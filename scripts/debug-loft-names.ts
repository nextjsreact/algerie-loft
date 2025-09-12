// Script pour diagnostiquer les noms de loft manquants
// Exécutez avec: npx tsx scripts/debug-loft-names.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLoftNames() {
  console.log('🔍 Debugging loft names in availability data...\n');

  try {
    // 1. Check loft_availability table structure
    console.log('📊 Checking loft_availability records with joins...');
    const { data: availabilityWithLofts, error: availError } = await supabase
      .from('loft_availability')
      .select(`
        date,
        is_available,
        blocked_reason,
        loft_id,
        lofts!inner (
          id,
          name
        )
      `)
      .eq('is_available', false)
      .limit(5);

    if (availError) {
      console.error('❌ Error fetching availability with lofts:', availError);
    } else {
      console.log('✅ Availability records with loft names:');
      availabilityWithLofts?.forEach(record => {
        console.log(`  - Date: ${record.date}`);
        console.log(`    Loft ID: ${record.loft_id}`);
        console.log(`    Blocked reason: ${record.blocked_reason}`);
        console.log(`    Loft data:`, record.lofts);
        console.log(`    Loft name: ${(record.lofts as any)?.name}`);
        console.log('');
      });
    }

    // 2. Check if there are orphaned availability records
    console.log('🔍 Checking for orphaned availability records...');
    const { data: orphanedRecords, error: orphanError } = await supabase
      .from('loft_availability')
      .select(`
        date,
        loft_id,
        blocked_reason
      `)
      .eq('is_available', false);

    if (orphanError) {
      console.error('❌ Error fetching orphaned records:', orphanError);
    } else {
      console.log(`📋 Total blocked availability records: ${orphanedRecords?.length || 0}`);
      
      // Check each record to see if loft exists
      for (const record of orphanedRecords || []) {
        const { data: loftExists, error: loftError } = await supabase
          .from('lofts')
          .select('id, name')
          .eq('id', record.loft_id)
          .single();

        if (loftError || !loftExists) {
          console.log(`❌ ORPHANED RECORD: ${record.date} - Loft ID ${record.loft_id} does not exist!`);
          console.log(`   Blocked reason: ${record.blocked_reason}`);
          console.log(`   This explains the "Loft ${record.loft_id.slice(-4)}" fallback name`);
        }
      }
    }

    // 3. Check the specific loft ID that's causing "Loft 5c48"
    console.log('\n🎯 Looking for loft ID ending in "5c48"...');
    const { data: allLofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name');

    if (loftsError) {
      console.error('❌ Error fetching lofts:', loftsError);
    } else {
      const suspiciousLoft = allLofts?.find(loft => loft.id.endsWith('5c48'));
      if (suspiciousLoft) {
        console.log(`✅ Found loft with ID ending in 5c48: ${suspiciousLoft.name} (${suspiciousLoft.id})`);
      } else {
        console.log('❌ No loft found with ID ending in 5c48');
      }

      // Look for availability records with IDs ending in 5c48
      const { data: suspiciousAvailability, error: suspiciousError } = await supabase
        .from('loft_availability')
        .select('*')
        .like('loft_id', '%5c48')
        .eq('is_available', false);

      if (suspiciousError) {
        console.error('❌ Error fetching suspicious availability:', suspiciousError);
      } else {
        console.log(`🔍 Found ${suspiciousAvailability?.length || 0} availability records with loft_id ending in 5c48:`);
        suspiciousAvailability?.forEach(record => {
          console.log(`  - Date: ${record.date}, Loft ID: ${record.loft_id}, Reason: ${record.blocked_reason}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugLoftNames();