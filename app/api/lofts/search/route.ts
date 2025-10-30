import { NextRequest, NextResponse } from 'next/server';
import { loftDataService } from '@/lib/services/loft-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const searchFilters = {
      check_in: searchParams.get('check_in') || undefined,
      check_out: searchParams.get('check_out') || undefined,
      guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined,
      location: searchParams.get('location') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    };

    console.log('Loft search request:', searchFilters);

    const lofts = await loftDataService.searchLofts(searchFilters);

    return NextResponse.json({
      success: true,
      lofts,
      count: lofts.length,
      filters: searchFilters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Loft search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la recherche de lofts',
      details: error instanceof Error ? error.message : 'Unknown error',
      lofts: [],
      count: 0
    }, { status: 500 });
  }
}