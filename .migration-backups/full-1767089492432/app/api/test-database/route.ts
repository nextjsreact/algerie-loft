import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Test database connection and check data
    const results = {
      connection: 'OK',
      tables: {},
      timestamp: new Date().toISOString()
    };

    // Check lofts table
    const { data: lofts, error: loftsError, count: loftsCount } = await supabase
      .from('lofts')
      .select('*', { count: 'exact' })
      .limit(5);

    results.tables.lofts = {
      accessible: !loftsError,
      error: loftsError?.message,
      count: loftsCount || 0,
      sample: lofts?.slice(0, 2) || []
    };

    // Check reservations table
    const { data: reservations, error: reservationsError, count: reservationsCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact' })
      .limit(5);

    results.tables.reservations = {
      accessible: !reservationsError,
      error: reservationsError?.message,
      count: reservationsCount || 0,
      sample: reservations?.slice(0, 2) || []
    };

    // Check customers table
    const { data: customers, error: customersError, count: customersCount } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, created_at', { count: 'exact' })
      .limit(5);

    results.tables.customers = {
      accessible: !customersError,
      error: customersError?.message,
      count: customersCount || 0,
      sample: customers?.slice(0, 2) || []
    };

    // Check availability table
    const { data: availability, error: availabilityError, count: availabilityCount } = await supabase
      .from('availability')
      .select('*', { count: 'exact' })
      .limit(5);

    results.tables.availability = {
      accessible: !availabilityError,
      error: availabilityError?.message,
      count: availabilityCount || 0,
      sample: availability?.slice(0, 2) || []
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}