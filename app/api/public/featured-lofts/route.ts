import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // No cache — always fresh data

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25', 10) // Default 25 for carousel
    const randomize = searchParams.get('randomize') === 'true'

    const supabase = await createClient(true)

    // Get loft IDs that have photos, prioritizing cover photos
    const { data: photos } = await supabase
      .from('loft_photos')
      .select('loft_id, url, is_cover, mime_type')
      .order('is_cover', { ascending: false }) // cover photos first
      .order('created_at', { ascending: true })

    if (!photos || photos.length === 0) {
      return NextResponse.json({ lofts: [] })
    }

    // Build map: loft_id -> best photo url (cover first, then first photo)
    const photoMap = new Map<string, string>()
    const mimeMap = new Map<string, string>()
    // First pass: set cover photos
    photos.forEach((p: any) => {
      if (p.is_cover === true) {
        photoMap.set(p.loft_id, p.url)
        mimeMap.set(p.loft_id, p.mime_type || '')
      }
    })
    // Second pass: fill in lofts without cover using first available photo
    photos.forEach((p: any) => {
      if (!photoMap.has(p.loft_id)) {
        photoMap.set(p.loft_id, p.url)
        mimeMap.set(p.loft_id, p.mime_type || '')
      }
    })

    // Filter out HEIC photos (not displayable in browsers → black image)
    const validLoftIds = Array.from(photoMap.keys()).filter(id => {
      const mime = mimeMap.get(id) || ''
      const url = photoMap.get(id) || ''
      const isHeic = mime.includes('heic') || mime.includes('heif') ||
                     url.toLowerCase().includes('.heic') || url.toLowerCase().includes('.heif')
      return !isHeic
    })

    const loftIds = validLoftIds

    // Fetch those lofts — published first, then all others with photos
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select('id, name, address, description, price_per_night, zone_area_id, is_published, created_at, zone_areas!lofts_zone_area_id_fkey(name)')
      .in('id', loftIds)
      .order('is_published', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    const featured = (lofts || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      address: l.address || '',
      description: l.description || '',
      price_per_night: l.price_per_night || 0,
      zone: (l.zone_areas as any)?.name || l.address?.split(',')[0] || '',
      photo: photoMap.get(l.id) || '',
      is_published: l.is_published,
      created_at: l.created_at,
    }))

    // Shuffle for random display (new lofts get equal chance to appear)
    const shuffled = featured.sort(() => Math.random() - 0.5)

    // Take up to `limit` lofts
    const result = shuffled.slice(0, limit)

    return NextResponse.json({ lofts: result, total: featured.length })
  } catch (err) {
    console.error('[featured-lofts]', err)
    return NextResponse.json({ lofts: [], error: JSON.stringify(err) })
  }
}
