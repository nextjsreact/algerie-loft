/**
 * VÉRIFICATION COMPLÈTE DES VRAIES DONNÉES
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyRealData() {
  console.log('🔍 VÉRIFICATION COMPLÈTE DES VRAIES DONNÉES\n')

  try {
    // 1. Vérifier la table lofts avec plus de détails
    console.log('🏠 TABLE LOFTS:')
    const { data: lofts, error: loftsError, count: loftsCount } = await supabase
      .from('lofts')
      .select('*', { count: 'exact' })

    if (loftsError) {
      console.error('❌ Erreur lofts:', loftsError.message)
    } else {
      console.log(`✅ Nombre total de lofts: ${loftsCount}`)
      if (lofts && lofts.length > 0) {
        console.log('📋 Premiers lofts:')
        lofts.slice(0, 3).forEach((loft, index) => {
          console.log(`   ${index + 1}. ${loft.name || loft.id} - ${loft.address || 'Pas d\'adresse'}`)
          console.log(`      Colonnes: ${Object.keys(loft).join(', ')}`)
        })
      }
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // 2. Vérifier la table owners/loft_owners
    console.log('👥 TABLE OWNERS:')
    const { data: owners, error: ownersError, count: ownersCount } = await supabase
      .from('owners')
      .select('*', { count: 'exact' })

    if (ownersError) {
      console.log('❌ Table "owners" non accessible:', ownersError.message)
      
      // Essayer loft_owners
      console.log('Tentative avec "loft_owners"...')
      const { data: loftOwners, error: loftOwnersError, count: loftOwnersCount } = await supabase
        .from('loft_owners')
        .select('*', { count: 'exact' })

      if (loftOwnersError) {
        console.log('❌ Table "loft_owners" non accessible:', loftOwnersError.message)
      } else {
        console.log(`✅ Nombre total de loft_owners: ${loftOwnersCount}`)
        if (loftOwners && loftOwners.length > 0) {
          console.log('📋 Premiers propriétaires:')
          loftOwners.slice(0, 3).forEach((owner, index) => {
            console.log(`   ${index + 1}. ${owner.name || owner.id} - ${owner.email || 'Pas d\'email'}`)
          })
        }
      }
    } else {
      console.log(`✅ Nombre total de owners: ${ownersCount}`)
      if (owners && owners.length > 0) {
        console.log('📋 Premiers propriétaires:')
        owners.slice(0, 3).forEach((owner, index) => {
          console.log(`   ${index + 1}. ${owner.name || owner.id} - ${owner.email || 'Pas d\'email'}`)
        })
      }
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // 3. Vérifier la table transactions
    console.log('💰 TABLE TRANSACTIONS:')
    const { data: transactions, error: transactionsError, count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })

    if (transactionsError) {
      console.error('❌ Erreur transactions:', transactionsError.message)
    } else {
      console.log(`✅ Nombre total de transactions: ${transactionsCount}`)
      if (transactions && transactions.length > 0) {
        console.log('📋 Premières transactions:')
        transactions.slice(0, 3).forEach((transaction, index) => {
          console.log(`   ${index + 1}. ${transaction.description || transaction.id} - ${transaction.amount} ${transaction.currency_id || 'DZD'}`)
        })
      }
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // 4. Vérifier les relations
    console.log('🔗 VÉRIFICATION DES RELATIONS:')
    
    if (lofts && lofts.length > 0) {
      const sampleLoft = lofts[0]
      console.log('📊 Structure d\'un loft:')
      Object.entries(sampleLoft).forEach(([key, value]) => {
        console.log(`   ${key}: ${value} (${typeof value})`)
      })
      
      // Vérifier les relations owner
      if (sampleLoft.owner_id) {
        console.log(`\n🔍 Recherche du propriétaire ${sampleLoft.owner_id}...`)
        
        // Essayer dans owners
        const { data: relatedOwner } = await supabase
          .from('owners')
          .select('*')
          .eq('id', sampleLoft.owner_id)
          .single()

        if (relatedOwner) {
          console.log('✅ Propriétaire trouvé dans "owners":', relatedOwner.name)
        } else {
          // Essayer dans loft_owners
          const { data: relatedLoftOwner } = await supabase
            .from('loft_owners')
            .select('*')
            .eq('id', sampleLoft.owner_id)
            .single()

          if (relatedLoftOwner) {
            console.log('✅ Propriétaire trouvé dans "loft_owners":', relatedLoftOwner.name)
          } else {
            console.log('❌ Propriétaire non trouvé dans les deux tables')
          }
        }
      }
    }

    console.log('\n🎯 RÉSUMÉ FINAL:')
    console.log(`   - Lofts: ${loftsCount || 0}`)
    console.log(`   - Propriétaires: ${ownersCount || 0}`)
    console.log(`   - Transactions: ${transactionsCount || 0}`)

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

verifyRealData()