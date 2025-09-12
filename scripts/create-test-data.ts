// Script pour créer des données de test via l'API
// Exécutez avec: npx tsx scripts/create-test-data.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  console.log('🔧 Creating test blocked availability data...\n');

  try {
    // 1. Get first loft
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(1);

    if (loftsError || !lofts || lofts.length === 0) {
      console.error('No lofts found:', loftsError);
      return;
    }

    const testLoft = lofts[0];
    console.log('📍 Using loft:', testLoft.name, '(ID:', testLoft.id, ')');

    // 2. Create test blocked dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfter2 = new Date();
    dayAfter2.setDate(dayAfter2.getDate() + 3);

    const testData = [
      {
        loft_id: testLoft.id,
        date: tomorrow.toISOString().split('T')[0],
        is_available: false,
        blocked_reason: 'maintenance',
        minimum_stay: 1
      },
      {
        loft_id: testLoft.id,
        date: dayAfter.toISOString().split('T')[0],
        is_available: false,
        blocked_reason: 'renovation',
        minimum_stay: 1
      },
      {
        loft_id: testLoft.id,
        date: dayAfter2.toISOString().split('T')[0],
        is_available: false,
        blocked_reason: 'blocked',
        minimum_stay: 1
      }
    ];

    console.log('📅 Creating blocked dates:', testData.map(d => `${d.date} (${d.blocked_reason})`).join(', '));

    const { data: insertedData, error: insertError } = await supabase
      .from('loft_availability')
      .upsert(testData, { onConflict: 'loft_id,date' })
      .select();

    if (insertError) {
      console.error('❌ Error creating test data:', insertError);
      return;
    }

    console.log('✅ Successfully created test data:', insertedData);

    // 3. Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('loft_availability')
      .select(`
        date,
        is_available,
        blocked_reason,
        lofts!inner (
          name
        )
      `)
      .eq('loft_id', testLoft.id)
      .eq('is_available', false);

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    console.log('\n🔍 Verification - Blocked dates in database:');
    verifyData?.forEach(record => {
      console.log(`  - ${record.date}: ${record.blocked_reason} (${(record.lofts as any)?.name})`);
    });

    console.log('\n🎉 Test data created successfully!');
    console.log('💡 Now go to your calendar and select the loft:', testLoft.name);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createTestData();