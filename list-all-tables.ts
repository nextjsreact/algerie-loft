import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllTables() {
  console.log('🔍 Listing all tables with data...\n')

  // Liste de toutes les tables possibles
  const possibleTables = [
    'profiles',
    'users', 
    'lofts',
    'loft_owners',
    'owners',
    'partner_profiles',
    'partners',
    'reservations',
    'transactions',
    'tasks',
    'teams',
    'bills',
    'notifications',
    'customers',
    'conversations'
  ]

  const tablesWithData: any[] = []

  for (const table of possibleTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (!error && count && count > 0) {
        tablesWithData.push({ table, count })
        console.log(`✅ ${table}: ${count} rows`)
      }
    } catch (err) {
      // Table doesn't exist, skip
    }
  }

  console.log(`\n📊 Found ${tablesWithData.length} tables with data\n`)

  // Afficher un échantillon de chaque table avec données
  for (const { table, count } of tablesWithData) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (data && data.length > 0) {
      console.log(`\n📋 ${table} (${count} rows) - Sample:`)
      console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`)
    }
  }
}

listAllTables()
