// API route pour lister tous les lofts (App Router)
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    console.log('API: Fetching all lofts...');

    // Récupérer tous les lofts disponibles et publiés
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        description,
        address,
        price_per_night,
        max_guests,
        bedrooms,
        bathrooms,
        amenities,
        cleaning_fee,
        status,
        is_published,
        average_rating,
        review_count
      `)
      .eq('status', 'available')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    // Enrichir les données
    const enrichedLofts = lofts.map(loft => ({
      ...loft,
      price_per_night: loft.price_per_night || 0,
      cleaning_fee: loft.cleaning_fee || 0,
      total_amenities: loft.amenities ? loft.amenities.length : 0,
      rating: loft.average_rating || 0,
      reviews: loft.review_count || 0,
      currency: 'DZD'
    }));

    console.log(`API: Found ${enrichedLofts.length} lofts`);

    return NextResponse.json({
      lofts: enrichedLofts,
      total: enrichedLofts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}