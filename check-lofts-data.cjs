/**
 * VÉRIFICATION DES DONNÉES LOFTS
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkLoftsData() {
  console.log('🔍 Vérification des données lofts...\n')

  // Vérifier les lofts
  const { data: lofts, error: loftsError } = await supabase
    .from('lofts')
    .select('*')

  console.log('📊 Lofts:', lofts?.length || 0)
  if (lofts && lofts.length > 0) {
    console.log('Exemple loft:', lofts[0])
  }

  // Vérifier les owners
  const { data: owners, error: ownersError } = await supabase
    .from('owners')
    .select('*')

  console.log('📊 Owners:', owners?.length || 0)
  if (owners && owners.length > 0) {
    console.log('Exemple owner:', owners[0])
  }

  // Vérifier les réservations (qui ont des données)
  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('*')
    .limit(3)

  console.log('📊 Reservations:', reservations?.length || 0)
  if (reservations && reservations.length > 0) {
    console.log('Exemple reservation:', reservations[0])
    
    // Vérifier si les loft_id des réservations correspondent à des lofts existants
    const loftIds = [...new Set(reservations.map(r => r.loft_id))]
    console.log('🔗 Loft IDs dans les réservations:', loftIds)
    
    for (const loftId of loftIds) {
      const { data: loft } = await supabase
        .from('lofts')
        .select('*')
        .eq('id', loftId)
        .single()
      
      console.log(`   Loft ${loftId}:`, loft ? 'Existe' : 'N\'existe pas')
    }
  }

  // Vérifier les transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')

  console.log('📊 Transactions:', transactions?.length || 0)
}

checkLoftsData()