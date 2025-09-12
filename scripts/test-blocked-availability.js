import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (utilisez vos vraies clés)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBlockedAvailability() {
  console.log('🔍 Testing blocked availability data...\n');

  try {
    // 1. Check if we have any lofts
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(5);

    if (loftsError) {
      console.error('Error fetching lofts:', loftsError);
      return;
    }

    console.log('📍 Available lofts:');
    lofts?.forEach(loft => {
      console.log(`  - ${loft.name} (ID: ${loft.id})`);
    });
    console.log('');

    if (!lofts || lofts.length === 0) {
      console.log('❌ No lofts found in database');
      return;
    }

    // 2. Check if we have any blocked availability
    const { data: blockedAvailability, error: blockedError } = await supabase
      .from('loft_availability')
      .select(`
        date,
        is_available,
        blocked_reason,
        loft_id,
        lofts!inner (
          name
        )
      `)
      .eq('is_available', false)
      .limit(10);

    if (blockedError) {
      console.error('Error fetching blocked availability:', blockedError);
      return;
    }

    console.log('🚫 Blocked availability records:');
    if (!blockedAvailability || blockedAvailability.length === 0) {
      console.log('  ❌ No blocked availability found');
      
      // Create some test data
      console.log('\n🔧 Creating test blocked availability...');
      const testLoft = lofts[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: insertData, error: insertError } = await supabase
        .from('loft_availability')
        .insert([
          {
            loft_id: testLoft.id,
            date: tomorrowStr,
            is_available: false,
            blocked_reason: 'maintenance',
            minimum_stay: 1
          }
        ])
        .select();

      if (insertError) {
        console.error('Error creating test data:', insertError);
      } else {
        console.log('✅ Created test blocked availability:', insertData);
      }
    } else {
      blockedAvailability.forEach(record => {
        console.log(`  - ${record.date}: ${record.blocked_reason} (${record.lofts?.name || 'Unknown loft'})`);
      });
    }

    // 3. Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const testLoft = lofts[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const apiUrl = `http://localhost:3000/api/availability?loft_id=${testLoft.id}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
    
    console.log('API URL:', apiUrl);
    console.log('Note: Make sure your development server is running to test the API endpoint');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testBlockedAvailability();