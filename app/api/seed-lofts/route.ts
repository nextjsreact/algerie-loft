import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Créer quelques lofts de test
    const testLofts = [
      {
        name: 'Loft Moderne Centre-ville',
        description: 'Magnifique loft moderne au cœur d\'Alger avec vue sur la baie. Parfait pour un séjour d\'affaires ou de loisirs.',
        address: '15 Rue Didouche Mourad, Alger Centre',
        price_per_night: 8500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        area_sqm: 85,
        amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning', 'balcony'],
        cleaning_fee: 2000,
        tax_rate: 19,
        minimum_stay: 1,
        maximum_stay: 30,
        check_in_time: '15:00',
        check_out_time: '11:00',
        status: 'available',
        is_published: true
      },
      {
        name: 'Studio Cosy Hydra',
        description: 'Charmant studio dans le quartier résidentiel d\'Hydra. Calme et bien équipé.',
        address: '42 Chemin des Glycines, Hydra',
        price_per_night: 6000,
        max_guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        area_sqm: 45,
        amenities: ['wifi', 'kitchen', 'balcony', 'heating'],
        cleaning_fee: 1500,
        tax_rate: 19,
        minimum_stay: 2,
        maximum_stay: 14,
        check_in_time: '16:00',
        check_out_time: '10:00',
        status: 'available',
        is_published: true
      },
      {
        name: 'Appartement Familial Bab Ezzouar',
        description: 'Grand appartement familial proche de l\'aéroport. Idéal pour les familles.',
        address: '28 Cité AADL, Bab Ezzouar',
        price_per_night: 12000,
        max_guests: 6,
        bedrooms: 3,
        bathrooms: 2,
        area_sqm: 120,
        amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning', 'washing_machine', 'tv'],
        cleaning_fee: 3000,
        tax_rate: 19,
        minimum_stay: 1,
        maximum_stay: 21,
        check_in_time: '14:00',
        check_out_time: '12:00',
        status: 'available',
        is_published: true
      },
      {
        name: 'Loft Artistique Sidi M\'Hamed',
        description: 'Loft unique avec décoration artistique dans un quartier historique.',
        address: '7 Rue Larbi Ben M\'hidi, Sidi M\'Hamed',
        price_per_night: 9500,
        max_guests: 3,
        bedrooms: 1,
        bathrooms: 1,
        area_sqm: 70,
        amenities: ['wifi', 'kitchen', 'air_conditioning', 'artistic_decor'],
        cleaning_fee: 2500,
        tax_rate: 19,
        minimum_stay: 2,
        maximum_stay: 10,
        check_in_time: '15:00',
        check_out_time: '11:00',
        status: 'available',
        is_published: true
      }
    ]

    // Insérer les lofts
    const { data: insertedLofts, error: insertError } = await supabase
      .from('lofts')
      .insert(testLofts)
      .select('id, name, price_per_night')

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to insert lofts',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Test lofts created successfully',
      lofts_created: insertedLofts?.length || 0,
      lofts: insertedLofts
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}