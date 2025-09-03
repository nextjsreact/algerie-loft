import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function checkLoftExists() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const loftId = 'b305b744-5ae6-40ed-bf91-00a848a4b1bc'
  
  console.log('🔍 Recherche du loft avec ID:', loftId)
  
  // Recherche sans .single() pour voir tous les résultats
  const { data: lofts, error } = await supabase
    .from('lofts')
    .select('*')
    .eq('id', loftId)

  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }

  console.log('📊 Nombre de lofts trouvés:', lofts?.length || 0)
  
  if (lofts && lofts.length > 0) {
    lofts.forEach((loft, index) => {
      console.log(`\n🏠 Loft ${index + 1}:`)
      console.log('  - ID:', loft.id)
      console.log('  - Nom:', loft.name)
      console.log('  - Adresse:', loft.address)
    })
  } else {
    console.log('❌ Aucun loft trouvé avec cet ID')
    
    // Cherchons les premiers lofts disponibles
    console.log('\n🔍 Recherche des lofts disponibles...')
    const { data: allLofts, error: allError } = await supabase
      .from('lofts')
      .select('id, name, address')
      .limit(5)
    
    if (allError) {
      console.error('❌ Erreur récupération lofts:', allError.message)
    } else if (allLofts && allLofts.length > 0) {
      console.log('📋 Lofts disponibles:')
      allLofts.forEach((loft, index) => {
        console.log(`  ${index + 1}. ${loft.name} (ID: ${loft.id})`)
      })
    } else {
      console.log('❌ Aucun loft dans la base de données')
    }
  }
}

checkLoftExists()