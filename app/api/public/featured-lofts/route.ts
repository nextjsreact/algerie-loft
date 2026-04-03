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

    // Priority order for carousel
    const priorityIds = [
      '7cf0f8cc-6962-486e-89c9-26ef4817f519', // Tulipe
      'e934921b-dcbd-4f2b-811a-6cff08ffed28', // Baya
      'c4931c00-1792-492d-9101-4bc583484749', // Candy
      'b305b744-5ae6-40ed-bf91-00a848a4b1bc', // Swan
      'd7a37ad1-21cc-4549-9f3f-8b07b5bf33ce', // Joelle
      '7d140c6a-b077-45db-9c9d-ac27df6b256c', // Green
      '5372ab62-3a1e-46f6-bed4-3dc025ebdbfd', // Star
      '238d817d-e545-474c-b54c-6fe1806abe4b', // Elias
      '73ea42be-f9ac-43a0-8888-c017f84cc602', // Sea
      '4b6729da-37ab-4ca6-890f-4f089b77d73a', // Amel
      '77eabdd6-6199-4b88-ac1c-0f116b00c97a', // Ania
      '54668fc5-b81d-4ff0-9a76-b54c80c6aa38', // Golden
    ]

    const prioritySet = new Set(priorityIds)
    const priorityLofts = priorityIds
      .map(id => featured.find(l => l.id === id))
      .filter(Boolean)
    const otherLofts = featured.filter(l => !prioritySet.has(l.id))
    const sorted = [...priorityLofts, ...otherLofts]

    return NextResponse.json({ lofts: sorted })
  } catch (err) {
    console.error('[featured-lofts]', err)
    return NextResponse.json({ lofts: [], error: JSON.stringify(err) })
  }
}
