import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // cache 1 hour

export async function GET() {
  try {
    const supabase = await createClient(true)

    // Fetch lofts that have at least one photo
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select(`
        id, name, address, description, price_per_night, status,
        zone_areas:zone_area_id(name),
        loft_photos(url, file_name)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter only lofts with photos and format
    const featured = (lofts || [])
      .filter((l: any) => l.loft_photos && l.loft_photos.length > 0)
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        address: l.address || '',
        description: l.description || '',
        price_per_night: l.price_per_night || 0,
        zone: (l.zone_areas as any)?.name || '',
        photo: l.loft_photos[0]?.url || '',
        photos_count: l.loft_photos.length,
      }))

    return NextResponse.json({ lofts: featured })
  } catch (err) {
    console.error('[featured-lofts]', err)
    return NextResponse.json({ lofts: [] })
  }
}
