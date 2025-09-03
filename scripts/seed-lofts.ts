import { createClient } from '@supabase/supabase-js'

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedLofts() {
  console.log('Starting to seed lofts...')

  try {
    // First, let's create some zone areas
    const { data: zoneAreas, error: zoneError } = await supabase
      .from('zone_areas')
      .upsert([
        { name: 'Hydra' },
        { name: 'Centre-Ville' },
        { name: 'Bab Ezzouar' },
        { name: 'Oran' },
        { name: 'Constantine' },
        { name: 'Bainem' }
      ], { onConflict: 'name' })
      .select()

    if (zoneError) {
      console.error('Error creating zone areas:', zoneError)
      return
    }

    console.log('Zone areas created:', zoneAreas)

    // Create some loft owners
    const { data: owners, error: ownersError } = await supabase
      .from('loft_owners')
      .upsert([
        { 
          name: 'Ahmed Benali',
          email: 'ahmed.benali@example.com',
          phone: '+213 555 123 456',
          ownership_type: 'third_party'
        },
        { 
          name: 'Fatima Khelil',
          email: 'fatima.khelil@example.com',
          phone: '+213 555 789 012',
          ownership_type: 'third_party'
        },
        { 
          name: 'Karim Mansouri',
          email: 'karim.mansouri@example.com',
          phone: '+213 555 345 678',
          ownership_type: 'company'
        },
        { 
          name: 'Amina Boudiaf',
          email: 'amina.boudiaf@example.com',
          phone: '+213 555 901 234',
          ownership_type: 'third_party'
        }
      ], { onConflict: 'email' })
      .select()

    if (ownersError) {
      console.error('Error creating owners:', ownersError)
      return
    }

    console.log('Owners created:', owners)

    // Now create some lofts
    const sampleLofts = [
      {
        name: 'Loft Artistique Hydra',
        address: '15 Rue Didouche Mourad, Hydra, Alger',
        description: 'Profitez avec toute la famille dans cet appartement confortable, calme, avec une magnifique vue panoramique',
        price_per_month: 45000,
        status: 'available',
        owner_id: owners?.[0]?.id,
        zone_area_id: zoneAreas?.find(z => z.name === 'Hydra')?.id,
        company_percentage: 30,
        owner_percentage: 70
      },
      {
        name: 'Loft Moderne Centre-Ville',
        address: '8 Boulevard Zighout Youcef, Centre-Ville, Alger',
        description: 'Loft moderne avec vue sur la baie d\'Alger',
        price_per_month: 55000,
        status: 'available',
        owner_id: owners?.[1]?.id,
        zone_area_id: zoneAreas?.find(z => z.name === 'Centre-Ville')?.id,
        company_percentage: 25,
        owner_percentage: 75
      },
      {
        name: 'Studio Haut de Gamme Hydra',
        address: '22 Chemin Mackley, Hydra, Alger',
        description: 'Studio haut de gamme dans le quartier d\'Hydra',
        price_per_month: 38000,
        status: 'occupied',
        owner_id: owners?.[0]?.id,
        zone_area_id: zoneAreas?.find(z => z.name === 'Hydra')?.id,
        company_percentage: 35,
        owner_percentage: 65
      },
      {
        name: 'Loft Étudiant Bab Ezzouar',
        address: '5 Cité AADL, Bab Ezzouar, Alger',
        description: 'Loft adapté aux étudiants, proche de l\'université',
        price_per_month: 28000,
        status: 'available',
        owner_id: owners?.[2]?.id,
        zone_area_id: zoneAreas?.find(z => z.name === 'Bab Ezzouar')?.id,
        company_percentage: 40,
        owner_percentage: 60
      },
      {
        name: 'Penthouse Vue Mer Oran',
        address: '12 Front de Mer, Oran',
        description: 'Penthouse avec vue panoramique sur la mer',
        price_per_month: 75000,
        status: 'available',
        owner_id: owners?.[3]?.id,
        zone_area_id: zoneAreas?.find(z => z.name === 'Oran')?.id,
        company_percentage: 20,
        owner_percentage: 80
      },
      {
        name: 'Loft Familial Constantine',
        address: '18 Rue Larbi Ben M\'hidi, Constantine',
        description: 'Loft spacieux pour famille, quartier calme',
        price_per_month: 42000,
        status: 'maintenance',
        owner_id: owners?.[2]?.id,
        zone_area_id: zoneAreas?.find(z => z.name === 'Constantine')?.id,
        company_percentage: 30,
        owner_percentage: 70
      }
    ]

    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .insert(sampleLofts)
      .select()

    if (loftsError) {
      console.error('Error creating lofts:', loftsError)
      return
    }

    console.log('Lofts created successfully:', lofts)
    console.log(`✅ Successfully seeded ${lofts?.length || 0} lofts!`)

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the seeding function
seedLofts().then(() => {
  console.log('Seeding completed!')
  process.exit(0)
}).catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})