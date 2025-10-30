import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get existing reservations to see the current structure
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({
        error: 'Cannot access reservations table',
        details: error.message
      });
    }

    // Get the structure by looking at existing data
    const sampleReservation = reservations?.[0];
    
    return NextResponse.json({
      success: true,
      table_accessible: true,
      sample_structure: sampleReservation ? Object.keys(sampleReservation) : [],
      sample_data: sampleReservation,
      total_reservations: reservations?.length || 0
    });

  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json(
      { 
        error: 'Schema check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}