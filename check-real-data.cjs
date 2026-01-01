/**
 * VÉRIFICATION DES VRAIES DONNÉES
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkRealData() {
  console.log('🔍 Vérification des vraies données dans la base...\n')

  // Vérifier toutes les tables possibles
  const tables = ['lofts', 'owners', 'transactions', 'reservations', 'profiles', 'bookings']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count || 0} enregistrements`)
        if (data && data.length > 0) {
          console.log(`   📝 Exemple:`, data[0])
          console.log(`   📊 Colonnes:`, Object.keys(data[0]).join(', '))
        }
      }
      console.log('')
    } catch (err) {
      console.log(`💥 ${table}: Erreur - ${err.message}\n`)
    }
  }

  // Vérifier spécifiquement les relations
  console.log('🔗 Vérification des relations...\n')
  
  // Voir s'il y a des lofts avec des owner_id
  const { data: loftsWithOwners } = await supabase
    .from('lofts')
    .select('id, name, owner_id')
    .not('owner_id', 'is', null)
    .limit(5)

  console.log('🏠 Lofts avec propriétaires:', loftsWithOwners?.length || 0)
  if (loftsWithOwners && loftsWithOwners.length > 0) {
    loftsWithOwners.forEach(loft => {
      console.log(`   - ${loft.name} (owner: ${loft.owner_id})`)
    })
  }

  // Voir s'il y a des transactions avec des loft_id
  const { data: transactionsWithLofts } = await supabase
    .from('transactions')
    .select('id, description, amount, loft_id')
    .not('loft_id', 'is', null)
    .limit(5)

  console.log('\n💰 Transactions avec lofts:', transactionsWithLofts?.length || 0)
  if (transactionsWithLofts && transactionsWithLofts.length > 0) {
    transactionsWithLofts.forEach(transaction => {
      console.log(`   - ${transaction.description}: ${transaction.amount} (loft: ${transaction.loft_id})`)
    })
  }
}

checkRealData()