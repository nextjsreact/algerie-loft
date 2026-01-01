/**
 * DIAGNOSTIC SPÉCIFIQUE - PROBLÈME OWNERS
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function diagnosticOwnersProlem() {
  console.log('🔍 DIAGNOSTIC SPÉCIFIQUE - PROBLÈME OWNERS\n')

  try {
    // Test 1: Vérifier l'accès à la table owners avec différentes approches
    console.log('📋 TEST 1: Accès direct à la table owners')
    
    // Approche 1: Select tout
    console.log('   Approche 1: SELECT * FROM owners')
    const { data: owners1, error: error1, count: count1 } = await supabase
      .from('owners')
      .select('*', { count: 'exact' })
    
    console.log(`   Résultat: ${count1 || 0} enregistrements`)
    if (error1) console.log('   Erreur:', error1.message)
    if (owners1 && owners1.length > 0) {
      console.log('   Premier owner:', owners1[0])
      console.log('   Tous les owners:')
      owners1.forEach((owner, index) => {
        console.log(`     ${index + 1}. ID: ${owner.id}, Nom: ${owner.name || 'Pas de nom'}`)
      })
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Test 2: Vérifier avec des colonnes spécifiques
    console.log('📋 TEST 2: Select avec colonnes spécifiques')
    const { data: owners2, error: error2 } = await supabase
      .from('owners')
      .select('id, name, email, phone')
      .order('name')
    
    console.log(`   Résultat: ${owners2?.length || 0} enregistrements`)
    if (error2) console.log('   Erreur:', error2.message)
    if (owners2 && owners2.length > 0) {
      console.log('   Owners avec colonnes spécifiques:')
      owners2.forEach((owner, index) => {
        console.log(`     ${index + 1}. ${owner.name} (${owner.email || 'pas d\'email'})`)
      })
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Test 3: Vérifier les relations avec les lofts
    console.log('📋 TEST 3: Relations owners <-> lofts')
    
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, owner_id')
      .limit(10)
    
    console.log(`   Lofts trouvés: ${lofts?.length || 0}`)
    if (lofts && lofts.length > 0) {
      console.log('   Owner IDs dans les lofts:')
      const ownerIds = [...new Set(lofts.map(loft => loft.owner_id).filter(Boolean))]
      console.log('   Owner IDs uniques:', ownerIds)
      
      // Vérifier si ces owner_id existent dans la table owners
      for (const ownerId of ownerIds) {
        const { data: ownerCheck, error: ownerCheckError } = await supabase
          .from('owners')
          .select('id, name')
          .eq('id', ownerId)
          .single()
        
        if (ownerCheck) {
          console.log(`     ✅ Owner ${ownerId}: ${ownerCheck.name}`)
        } else {
          console.log(`     ❌ Owner ${ownerId}: NON TROUVÉ (${ownerCheckError?.message})`)
        }
      }
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Test 4: Vérifier les politiques RLS
    console.log('📋 TEST 4: Test des politiques RLS')
    
    // Essayer avec différents filtres
    const { data: ownersNoFilter, error: errorNoFilter } = await supabase
      .from('owners')
      .select('id, name')
    
    console.log(`   Sans filtre: ${ownersNoFilter?.length || 0} owners`)
    if (errorNoFilter) console.log('   Erreur sans filtre:', errorNoFilter.message)

    const { data: ownersWithLimit, error: errorWithLimit } = await supabase
      .from('owners')
      .select('id, name')
      .limit(100)
    
    console.log(`   Avec limit 100: ${ownersWithLimit?.length || 0} owners`)
    if (errorWithLimit) console.log('   Erreur avec limit:', errorWithLimit.message)

    console.log('\n' + '='.repeat(60) + '\n')

    // Test 5: Comparer avec d'autres tables qui fonctionnent
    console.log('📋 TEST 5: Comparaison avec les lofts (qui fonctionnent)')
    
    const { data: loftsWorking, error: loftsWorkingError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(5)
    
    console.log(`   Lofts (qui fonctionnent): ${loftsWorking?.length || 0}`)
    if (loftsWorkingError) console.log('   Erreur lofts:', loftsWorkingError.message)

    console.log('\n🎯 RÉSUMÉ DU DIAGNOSTIC:')
    console.log(`   - Owners trouvés (test 1): ${count1 || 0}`)
    console.log(`   - Owners trouvés (test 2): ${owners2?.length || 0}`)
    console.log(`   - Lofts pour comparaison: ${loftsWorking?.length || 0}`)
    
    if ((count1 || 0) === 0 && (loftsWorking?.length || 0) > 0) {
      console.log('\n🚨 PROBLÈME IDENTIFIÉ: Les lofts sont accessibles mais pas les owners')
      console.log('   Causes possibles:')
      console.log('   1. Politiques RLS différentes entre lofts et owners')
      console.log('   2. Permissions utilisateur différentes')
      console.log('   3. Structure de table différente')
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

diagnosticOwnersProlem()