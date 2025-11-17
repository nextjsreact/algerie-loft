import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllTables() {
  console.log('🔍 Checking all tables...\n')

  const tables = [
    'loft_owners',
    'lofts',
    'profiles',
    'users',
    'owners' // Peut-être une autre table?
  ]

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count} rows`)
        
        // Si la table a des données, afficher un échantillon
        if (count && count > 0) {
          const { data } = await supabase
            .from(table)
            .select('*')
            .limit(3)
          
          console.log(`   Sample data:`, JSON.stringify(data?.[0], null, 2))
        }
      }
    } catch (err: any) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }

  // Vérifier si les lofts ont un champ owner_id
  console.log('\n🔍 Checking lofts structure...')
  const { data: lofts } = await supabase
    .from('lofts')
    .select('*')
    .limit(1)

  if (lofts && lofts.length > 0) {
    console.log('Loft columns:', Object.keys(lofts[0]))
  }
}

checkAllTables()
