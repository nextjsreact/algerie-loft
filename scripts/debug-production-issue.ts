import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔍 Diagnostic des problèmes de production...\n')

async function debugProductionIssue() {
  try {
    // 1. Vérifier la connexion Supabase
    console.log('1️⃣ Test de connexion Supabase...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test simple de connexion
    const { data, error } = await supabase.from('lofts').select('count').limit(1)
    if (error) {
      console.error('❌ Erreur connexion Supabase:', error.message)
      return
    }
    console.log('✅ Connexion Supabase OK')

    // 2. Vérifier si le loft existe
    console.log('\n2️⃣ Test du loft spécifique...')
    const loftId = 'b305b744-5ae6-40ed-bf91-00a848a4b1bc'
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', loftId)
      .single()

    if (loftError) {
      console.error('❌ Erreur récupération loft:', loftError.message)
      return
    }
    
    if (!loft) {
      console.error('❌ Loft non trouvé avec ID:', loftId)
      return
    }
    
    console.log('✅ Loft trouvé:', loft.name)

    // 3. Vérifier les dépendances (owners, zones, etc.)
    console.log('\n3️⃣ Test des dépendances...')
    
    const { data: owners, error: ownersError } = await supabase
      .from('loft_owners')
      .select('*')
    
    if (ownersError) {
      console.error('❌ Erreur récupération propriétaires:', ownersError.message)
    } else {
      console.log('✅ Propriétaires OK:', owners?.length || 0)
    }

    const { data: zones, error: zonesError } = await supabase
      .from('zone_areas')
      .select('*')
    
    if (zonesError) {
      console.error('❌ Erreur récupération zones:', zonesError.message)
    } else {
      console.log('✅ Zones OK:', zones?.length || 0)
    }

    const { data: internet, error: internetError } = await supabase
      .from('internet_connection_types')
      .select('*')
    
    if (internetError) {
      console.error('❌ Erreur récupération connexions internet:', internetError.message)
    } else {
      console.log('✅ Connexions internet OK:', internet?.length || 0)
    }

    // 4. Test de mise à jour
    console.log('\n4️⃣ Test de mise à jour (simulation)...')
    const { error: updateError } = await supabase
      .from('lofts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', loftId)
    
    if (updateError) {
      console.error('❌ Erreur simulation mise à jour:', updateError.message)
    } else {
      console.log('✅ Simulation mise à jour OK')
    }

    console.log('\n🎉 Diagnostic terminé avec succès!')

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

debugProductionIssue()