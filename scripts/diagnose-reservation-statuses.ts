import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseReservationDates() {
  console.log('Connecting to the database to check reservation dates...');

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('loft_id, check_in_date, check_out_date, status')
      .order('check_in_date', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No reservations found in the database.');
      return;
    }

    console.log(`\n--- Most Recent ${data.length} Reservations ---`);
    console.table(data);
    console.log('-------------------------------------------------\n');
    console.log(`Today's date is: ${new Date().toISOString().split('T')[0]}`);
    console.log('Please check if the check_out_date for these reservations is in the past.');

  } catch (error) {
    console.error('\nError while diagnosing reservation dates:', error.message);
  }
}

diagnoseReservationDates();
