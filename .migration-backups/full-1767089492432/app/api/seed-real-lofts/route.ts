import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabase = await createClient();
    
    // Real loft data to insert
    const realLofts = [
      {
        id: '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef',
        name: 'Loft Moderne Centre-ville Alger',
        description: 'Magnifique loft au cœur d\'Alger avec vue sur la baie. Entièrement rénové avec des finitions modernes, idéal pour un séjour d\'affaires ou de loisirs.',
        address: '15 Rue Didouche Mourad, Alger Centre, Alger',
        price_per_night: 8500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning', 'balcony', 'tv'],
        cleaning_fee: 2000,
        tax_rate: 19,
        status: 'available',
        is_published: true,
        average_rating: 4.5,
        review_count: 12,
        location: {
          latitude: 36.7538,
          longitude: 3.0588,
          city: 'Alger',
          district: 'Centre-ville'
        }
      },
      {
        id: '5c6d7e8f-9a1b-2c3d-4e5f-6789abcdef01',
        name: 'Studio Élégant Hydra',
        description: 'Studio moderne et élégant dans le quartier résidentiel d\'Hydra. Parfait pour les couples ou voyageurs d\'affaires. Proche des commerces et restaurants.',
        address: '42 Chemin des Glycines, Hydra, Alger',
        price_per_night: 6000,
        max_guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'balcony', 'air_conditioning', 'tv'],
        cleaning_fee: 1500,
        tax_rate: 19,
        status: 'available',
        is_published: true,
        average_rating: 4.2,
        review_count: 8,
        location: {
          latitude: 36.7372,
          longitude: 3.0467,
          city: 'Alger',
          district: 'Hydra'
        }
      },
      {
        id: '6d7e8f9a-1b2c-3d4e-5f67-89abcdef0123',
        name: 'Appartement Familial Bab Ezzouar',
        description: 'Spacieux appartement familial de 3 chambres, idéal pour les familles. Proche de l\'aéroport et des centres commerciaux. Parking privé inclus.',
        address: '28 Cité AADL, Bab Ezzouar, Alger',
        price_per_night: 12000,
        max_guests: 6,
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning', 'washing_machine', 'tv', 'balcony'],
        cleaning_fee: 3000,
        tax_rate: 19,
        status: 'available',
        is_published: true,
        average_rating: 4.8,
        review_count: 15,
        location: {
          latitude: 36.7167,
          longitude: 3.1833,
          city: 'Alger',
          district: 'Bab Ezzouar'
        }
      },
      {
        id: '7e8f9a1b-2c3d-4e5f-6789-abcdef012345',
        name: 'Penthouse Vue Mer Sidi Fredj',
        description: 'Penthouse luxueux avec vue panoramique sur la mer. Terrasse privée, piscine commune, et accès direct à la plage. Parfait pour des vacances de rêve.',
        address: 'Résidence Marina, Sidi Fredj, Alger',
        price_per_night: 18000,
        max_guests: 8,
        bedrooms: 4,
        bathrooms: 3,
        amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning', 'pool', 'beach_access', 'tv', 'terrace', 'sea_view'],
        cleaning_fee: 4000,
        tax_rate: 19,
        status: 'available',
        is_published: true,
        average_rating: 4.9,
        review_count: 23,
        location: {
          latitude: 36.7500,
          longitude: 2.8333,
          city: 'Alger',
          district: 'Sidi Fredj'
        }
      },
      {
        id: '8f9a1b2c-3d4e-5f67-89ab-cdef01234567',
        name: 'Loft Artistique Casbah',
        description: 'Loft unique dans une maison traditionnelle rénovée de la Casbah. Mélange parfait entre authenticité et modernité. Vue sur la médina historique.',
        address: '12 Rue des Martyrs, Casbah, Alger',
        price_per_night: 7500,
        max_guests: 3,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'air_conditioning', 'tv', 'historic_view', 'traditional_decor'],
        cleaning_fee: 1800,
        tax_rate: 19,
        status: 'available',
        is_published: true,
        average_rating: 4.6,
        review_count: 19,
        location: {
          latitude: 36.7833,
          longitude: 3.0667,
          city: 'Alger',
          district: 'Casbah'
        }
      }
    ];

    // Insert lofts into database
    const { data: insertedLofts, error: insertError } = await supabase
      .from('lofts')
      .insert(realLofts)
      .select();

    if (insertError) {
      console.error('Error inserting lofts:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert lofts', details: insertError.message },
        { status: 500 }
      );
    }

    // Also create some availability data for these lofts
    const availabilityData = [];
    const startDate = new Date();
    
    for (const loft of realLofts) {
      // Create availability for next 90 days
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Make some dates unavailable randomly (10% chance)
        const isAvailable = Math.random() > 0.1;
        
        availabilityData.push({
          loft_id: loft.id,
          date: date.toISOString().split('T')[0],
          available: isAvailable,
          price_override: null,
          minimum_stay: 1
        });
      }
    }

    // Insert availability data
    const { error: availabilityError } = await supabase
      .from('availability')
      .insert(availabilityData);

    if (availabilityError) {
      console.warn('Warning: Could not insert availability data:', availabilityError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Real lofts data inserted successfully',
      lofts_inserted: insertedLofts?.length || 0,
      availability_records: availabilityData.length,
      lofts: insertedLofts
    });

  } catch (error) {
    console.error('Seed lofts error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed lofts', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}