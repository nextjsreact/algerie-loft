/**
 * SCRIPT DE TEST - STRUCTURE DE LA BASE DE DONNÉES
 * ===============================================
 * 
 * Vérifie la structure des tables pour les rapports
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testDatabaseStructure() {
  console.log('🔍 Test de la structure de la base de données...\n')

  try {
    // Test 1: Vérifier la table lofts
    console.log('📋 Test 1: Structure de la table lofts')
    const { data: loftsData, error: loftsError } = await supabase
      .from('lofts')
      .select('*')
      .limit(1)

    if (loftsError) {
      console.error('❌ Erreur lofts:', loftsError.message)
    } else {
      console.log('✅ Table lofts accessible')
      if (loftsData && loftsData.length > 0) {
        console.log('📊 Colonnes disponibles:', Object.keys(loftsData[0]))
        console.log('📝 Exemple de données:', loftsData[0])
      } else {
        console.log('⚠️ Table lofts vide')
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 2: Vérifier la table loft_owners
    console.log('📋 Test 2: Structure de la table loft_owners')
    const { data: ownersData, error: ownersError } = await supabase
      .from('loft_owners')
      .select('*')
      .limit(1)

    if (ownersError) {
      console.error('❌ Erreur loft_owners:', ownersError.message)
    } else {
      console.log('✅ Table loft_owners accessible')
      if (ownersData && ownersData.length > 0) {
        console.log('📊 Colonnes disponibles:', Object.keys(ownersData[0]))
        console.log('📝 Exemple de données:', ownersData[0])
      } else {
        console.log('⚠️ Table loft_owners vide')
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 3: Vérifier la table transactions
    console.log('📋 Test 3: Structure de la table transactions')
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1)

    if (transactionsError) {
      console.error('❌ Erreur transactions:', transactionsError.message)
    } else {
      console.log('✅ Table transactions accessible')
      if (transactionsData && transactionsData.length > 0) {
        console.log('📊 Colonnes disponibles:', Object.keys(transactionsData[0]))
        console.log('📝 Exemple de données:', transactionsData[0])
      } else {
        console.log('⚠️ Table transactions vide')
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 4: Compter les enregistrements
    console.log('📋 Test 4: Comptage des enregistrements')
    
    const { count: loftsCount } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    const { count: ownersCount } = await supabase
      .from('loft_owners')
      .select('*', { count: 'exact', head: true })

    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Nombre de lofts: ${loftsCount || 0}`)
    console.log(`📊 Nombre de propriétaires: ${ownersCount || 0}`)
    console.log(`📊 Nombre de transactions: ${transactionsCount || 0}`)

    console.log('\n' + '='.repeat(50) + '\n')

    // Test 5: Vérifier les relations
    console.log('📋 Test 5: Test des relations')
    
    if (loftsData && loftsData.length > 0) {
      const loft = loftsData[0]
      console.log('🔗 Colonnes de relation dans lofts:')
      
      Object.keys(loft).forEach(key => {
        if (key.includes('owner') || key.includes('id')) {
          console.log(`   - ${key}: ${loft[key]}`)
        }
      })
    }

    console.log('\n🎉 Test terminé!')

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

// Exécuter le test
testDatabaseStructure()