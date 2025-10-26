import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

// POST /api/partner/properties/[id]/calculate-price - Calculate dynamic price
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['partner', 'admin', 'manager', 'client']);
    const { id } = params;
    const body = await request.json();
    const { date, nights = 1, advance_days = 0 } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate dynamic price using database function
    const { data: dynamicPrice, error } = await supabase.rpc(
      'calculate_dynamic_price',
      {
        p_loft_id: id,
        p_date: date,
        p_nights: nights,
        p_advance_days: advance_days
      }
    );

    if (error) {
      console.error('Error calculating dynamic price:', error);
      return NextResponse.json(
        { error: 'Failed to calculate price' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      price: dynamicPrice,
      date,
      nights,
      advance_days
    });

  } catch (error) {
    console.error('Error in POST /api/partner/properties/[id]/calculate-price:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}