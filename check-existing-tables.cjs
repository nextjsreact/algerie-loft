/**
 * SCRIPT DE VÉRIFICATION DES TABLES EXISTANTES
 * ============================================
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkExistingTables() {
  console.log('🔍 Vérification des tables existantes...\n')

  // Liste des tables possibles à vérifier
  const possibleTables = [
    'lofts',
    'loft_owners', 
    'owners',
    'proprietaires',
    'users',
    'profiles',
    'transactions',
    'reservations',
    'bookings'
  ]

  const existingTables = []

  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (!error) {
        console.log(`✅ Table "${tableName}" existe`)
        if (data && data.length > 0) {
          console.log(`   📊 Colonnes: ${Object.keys(data[0]).join(', ')}`)
          console.log(`   📝 Exemple: ${JSON.stringify(data[0], null, 2)}`)
        } else {
          console.log(`   ⚠️ Table vide`)
        }
        existingTables.push(tableName)
      } else {
        console.log(`❌ Table "${tableName}" n'existe pas`)
      }
    } catch (err) {
      console.log(`❌ Erreur pour "${tableName}": ${err.message}`)
    }
    console.log('')
  }

  console.log('📋 Résumé des tables existantes:')
  existingTables.forEach(table => console.log(`   - ${table}`))

  // Vérifier spécifiquement la structure de la table lofts
  if (existingTables.includes('lofts')) {
    console.log('\n🔍 Analyse détaillée de la table lofts:')
    const { data } = await supabase.from('lofts').select('*').limit(5)
    if (data && data.length > 0) {
      console.log('Colonnes détectées:')
      Object.keys(data[0]).forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]} (${data[0][col]})`)
      })
    }
  }
}

checkExistingTables()