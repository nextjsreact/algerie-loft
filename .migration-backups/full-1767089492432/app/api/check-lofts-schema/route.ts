import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Try to get the table structure by attempting to insert a minimal record
    const testLoft = {
      name: 'Test Loft Schema',
      description: 'Test description',
      address: 'Test address',
      price_per_night: 1000
    };

    const { data, error } = await supabase
      .from('lofts')
      .insert([testLoft])
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Schema test failed',
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    // If successful, delete the test record
    if (data) {
      await supabase
        .from('lofts')
        .delete()
        .eq('id', data.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Lofts table schema is compatible',
      test_record: data
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