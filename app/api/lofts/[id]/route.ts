import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient(true);

    const { data: loft, error } = await supabase
      .from('lofts')
      .select(`
        id, name, address, description, price_per_night, status,
        max_guests, bedrooms, bathrooms, area_sqm, amenities,
        check_in_time, check_out_time, minimum_stay, maximum_stay,
        house_rules, cancellation_policy,
        gps_coordinates, client_phone,
        owner_id, zone_area_id,
        zone_areas!lofts_zone_area_id_fkey(name),
        owners:owner_id(name),
        loft_photos(url, is_cover)
      `)
      .eq('id', id)
      .single();

    if (error || !loft) {
      console.error('Loft fetch error:', error?.message, 'id:', id)
      return NextResponse.json({ success: false, error: 'Loft non trouvé', detail: error?.message }, { status: 404 });
    }

    // Sort photos: cover first
    const photos = ((loft as any).loft_photos || [])
      .sort((a: any, b: any) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0))
      .map((p: any) => p.url)

    return NextResponse.json({
      success: true,
      loft: {
        ...loft,
        zone_name: (loft as any).zone_areas?.name || '',
        owner_name: (loft as any).owners?.name || '',
        photos,
        cover_photo: photos[0] || null,
      }
    });
  } catch (error) {
    console.error('Loft details error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
