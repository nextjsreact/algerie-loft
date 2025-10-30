import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createLoftRepository, LoftSearchOptions } from '@/lib/repositories/loft-repository';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client and loft repository
    const supabase = await createClient();
    const loftRepository = createLoftRepository(supabase);

    // Parse search parameters
    const { searchParams } = new URL(request.url);
    const guests = Number(searchParams.get('guests')) || undefined;
    const minPrice = Number(searchParams.get('minPrice')) || undefined;
    const maxPrice = Number(searchParams.get('maxPrice')) || undefined;
    const location = searchParams.get('location') || undefined;
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean) || undefined;
    const limit = Number(searchParams.get('limit')) || 12;
    const page = Number(searchParams.get('page')) || 1;
    const sortBy = (searchParams.get('sortBy') as 'price' | 'rating' | 'name') || 'rating';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Build search options
    const searchOptions: LoftSearchOptions = {
      guests,
      minPrice,
      maxPrice,
      location,
      amenities,
      page,
      limit,
      sortBy,
      sortOrder,
      status: 'available' // Only show available lofts
    };

    // Search lofts using the repository
    const searchResult = await loftRepository.searchLofts(searchOptions);

    // Return results in the expected format
    return NextResponse.json({
      lofts: searchResult.lofts,
      pagination: searchResult.pagination,
      filters: {
        guests,
        minPrice,
        maxPrice,
        location,
        amenities,
        sortBy,
        sortOrder
      },
      metadata: {
        source: searchResult.source,
        total: searchResult.total
      }
    });

  } catch (error) {
    console.error('Error in loft search API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search lofts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}