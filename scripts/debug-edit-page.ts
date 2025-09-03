import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function debugEditPage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  console.log('🔍 Diagnostic complet de la page d\'édition...\n')

  try {
    // Test avec un des nouveaux lofts créés
    const loftId = '1fdc1a07-db05-423a-bdbe-efafe4fadf04'
    
    console.log('1️⃣ Test de récupération du loft...')
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', loftId)
      .single()

    if (loftError) {
      console.error('❌ Erreur loft:', loftError)
      return
    }
    console.log('✅ Loft récupéré:', loft.name)

    console.log('\n2️⃣ Test de récupération des propriétaires...')
    const { data: owners, error: ownersError } = await supabase
      .from('loft_owners')
      .select('*')

    if (ownersError) {
      console.error('❌ Erreur propriétaires:', ownersError)
    } else {
      console.log('✅ Propriétaires:', owners?.length || 0)
    }

    console.log('\n3️⃣ Test de récupération des zones...')
    const { data: zones, error: zonesError } = await supabase
      .from('zone_areas')
      .select('*')

    if (zonesError) {
      console.error('❌ Erreur zones:', zonesError)
    } else {
      console.log('✅ Zones:', zones?.length || 0)
    }

    console.log('\n4️⃣ Test de récupération des connexions internet...')
    const { data: internet, error: internetError } = await supabase
      .from('internet_connection_types')
      .select('*')

    if (internetError) {
      console.error('❌ Erreur connexions internet:', internetError)
    } else {
      console.log('✅ Connexions internet:', internet?.length || 0)
    }

    console.log('\n5️⃣ Test de simulation d\'une action serveur...')
    
    // Simuler ce que fait getOwners()
    console.log('   - Test getOwners()...')
    const { data: ownersAction, error: ownersActionError } = await supabase
      .from('loft_owners')
      .select('id, name, email, phone, created_at')
      .order('name')

    if (ownersActionError) {
      console.error('❌ Erreur getOwners():', ownersActionError)
    } else {
      console.log('✅ getOwners() OK:', ownersAction?.length || 0)
    }

    // Simuler ce que fait getZoneAreas()
    console.log('   - Test getZoneAreas()...')
    const { data: zonesAction, error: zonesActionError } = await supabase
      .from('zone_areas')
      .select('*')
      .order('name')

    if (zonesActionError) {
      console.error('❌ Erreur getZoneAreas():', zonesActionError)
    } else {
      console.log('✅ getZoneAreas() OK:', zonesAction?.length || 0)
    }

    // Simuler ce que fait getInternetConnectionTypes()
    console.log('   - Test getInternetConnectionTypes()...')
    const { data: internetAction, error: internetActionError } = await supabase
      .from('internet_connection_types')
      .select('*')
      .order('type')

    if (internetActionError) {
      console.error('❌ Erreur getInternetConnectionTypes():', internetActionError)
    } else {
      console.log('✅ getInternetConnectionTypes() OK:', internetAction?.length || 0)
    }

    console.log('\n6️⃣ Test de l\'authentification...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Erreur auth (normal en script):', authError.message)
    } else if (user) {
      console.log('✅ Utilisateur connecté:', user.email)
    } else {
      console.log('⚠️ Pas d\'utilisateur connecté (normal en script)')
    }

    console.log('\n🎯 Résumé du diagnostic:')
    console.log('- Loft existe:', !!loft)
    console.log('- Propriétaires disponibles:', !!owners && owners.length > 0)
    console.log('- Zones disponibles:', !!zones && zones.length > 0)
    console.log('- Connexions internet disponibles:', !!internet && internet.length > 0)

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

debugEditPage()