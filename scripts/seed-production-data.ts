import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function seedProductionData() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🌱 Création de données de test en production...\n')

  try {
    // 1. Créer un propriétaire
    console.log('1️⃣ Création d\'un propriétaire...')
    const { data: owner, error: ownerError } = await supabase
      .from('loft_owners')
      .insert({
        name: 'Propriétaire Test',
        email: 'proprietaire@test.com',
        phone: '+213 555 123 456'
      })
      .select()
      .single()

    if (ownerError) {
      console.error('❌ Erreur création propriétaire:', ownerError.message)
      return
    }
    console.log('✅ Propriétaire créé:', owner.name)

    // 2. Créer une zone
    console.log('\n2️⃣ Création d\'une zone...')
    const { data: zone, error: zoneError } = await supabase
      .from('zone_areas')
      .insert({
        name: 'Centre-ville Alger'
      })
      .select()
      .single()

    if (zoneError) {
      console.error('❌ Erreur création zone:', zoneError.message)
      return
    }
    console.log('✅ Zone créée:', zone.name)

    // 3. Créer un type de connexion internet
    console.log('\n3️⃣ Création d\'un type de connexion internet...')
    const { data: internet, error: internetError } = await supabase
      .from('internet_connection_types')
      .insert({
        type: 'Fibre Optique',
        speed: '100 Mbps'
      })
      .select()
      .single()

    if (internetError) {
      console.error('❌ Erreur création connexion internet:', internetError.message)
      return
    }
    console.log('✅ Connexion internet créée:', internet.type)

    // 4. Créer des lofts de test
    console.log('\n4️⃣ Création de lofts de test...')
    const loftsToCreate = [
      {
        name: 'Loft Moderne Centre-ville',
        address: '123 Rue Didouche Mourad, Alger',
        price_per_month: 50000,
        owner_id: owner.id,
        zone_area_id: zone.id,
        internet_connection_type_id: internet.id,
        description: 'Magnifique loft moderne au cœur d\'Alger',
        company_percentage: 30,
        owner_percentage: 70
      },
      {
        name: 'Loft Vue Mer',
        address: '456 Boulevard Che Guevara, Alger',
        price_per_month: 75000,
        owner_id: owner.id,
        zone_area_id: zone.id,
        internet_connection_type_id: internet.id,
        description: 'Loft avec vue imprenable sur la mer',
        company_percentage: 25,
        owner_percentage: 75
      },
      {
        name: 'Loft Familial',
        address: '789 Rue Ben M\'hidi, Alger',
        price_per_month: 60000,
        owner_id: owner.id,
        zone_area_id: zone.id,
        internet_connection_type_id: internet.id,
        description: 'Spacieux loft parfait pour les familles',
        company_percentage: 35,
        owner_percentage: 65
      }
    ]

    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .insert(loftsToCreate)
      .select()

    if (loftsError) {
      console.error('❌ Erreur création lofts:', loftsError.message)
      return
    }

    console.log('✅ Lofts créés avec succès:')
    lofts?.forEach((loft, index) => {
      console.log(`  ${index + 1}. ${loft.name} (ID: ${loft.id})`)
    })

    console.log('\n🎉 Données de test créées avec succès!')
    console.log('\n📋 Tu peux maintenant tester avec ces URLs:')
    lofts?.forEach((loft) => {
      console.log(`🔗 https://loft-algerie-l3juusg02-habibbelkacemimosta-7724s-projects.vercel.app/lofts/${loft.id}/edit`)
    })

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

seedProductionData()