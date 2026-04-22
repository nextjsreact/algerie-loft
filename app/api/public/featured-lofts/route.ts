import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // No cache — always fresh data

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

    // Sort: published first, then by most recent creation date
    // → new lofts with photos automatically appear at the top
    const sorted = featured.sort((a, b) => {
      if (a.is_published && !b.is_published) return -1
      if (!a.is_published && b.is_published) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ lofts: sorted })
  } catch (err) {
    console.error('[featured-lofts]', err)
    return NextResponse.json({ lofts: [], error: JSON.stringify(err) })
  }
}
