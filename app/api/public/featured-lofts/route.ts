import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient(true)

    // Get loft IDs that have photos, prioritizing cover photos
    const { data: photos } = await supabase
      .from('loft_photos')
      .select('loft_id, url, is_cover')
      .order('is_cover', { ascending: false }) // cover photos first
      .order('created_at', { ascending: true })

    if (!photos || photos.length === 0) {
      return NextResponse.json({ lofts: [] })
    }

    // Build map: loft_id -> best photo url (cover first, then first photo)
    const photoMap = new Map<string, string>()
    // First pass: set cover photos
    photos.forEach((p: any) => {
      if (p.is_cover === true) photoMap.set(p.loft_id, p.url)
    })
    // Second pass: fill in lofts without cover using first available photo
    photos.forEach((p: any) => {
      if (!photoMap.has(p.loft_id)) photoMap.set(p.loft_id, p.url)
    })

    const loftIds = Array.from(photoMap.keys())

    // Fetch those lofts
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select('id, name, address, description, price_per_night, zone_area_id, zone_areas!lofts_zone_area_id_fkey(name)')
      .in('id', loftIds)
      .order('name')

    if (error) throw error

    const featured = (lofts || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      address: l.address || '',
      description: l.description || '',
      price_per_night: l.price_per_night || 0,
      zone: (l.zone_areas as any)?.name || l.address?.split(',')[0] || '',
      photo: photoMap.get(l.id) || '',
    }))

    return NextResponse.json({ lofts: featured })
  } catch (err) {
    console.error('[featured-lofts]', err)
    return NextResponse.json({ lofts: [], error: JSON.stringify(err) })
  }
}
