/**
 * CRÉATION DE DONNÉES DE TEST POUR LES RAPPORTS
 * =============================================
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createTestData() {
  console.log('🚀 Création de données de test pour les rapports...\n')

  try {
    // 1. Créer des propriétaires de test
    console.log('👥 Création des propriétaires...')
    const ownersData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Ahmed Benali',
        email: 'ahmed.benali@example.com',
        phone: '+213555123456'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Fatima Khelifi',
        email: 'fatima.khelifi@example.com',
        phone: '+213555789012'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Mohamed Saidi',
        email: 'mohamed.saidi@example.com',
        phone: '+213555345678'
      }
    ]

    const { data: insertedOwners, error: ownersError } = await supabase
      .from('owners')
      .insert(ownersData)
      .select()

    if (ownersError) {
      console.error('❌ Erreur lors de la création des propriétaires:', ownersError)
    } else {
      console.log('✅ Propriétaires créés:', insertedOwners?.length || 0)
    }

    // 2. Créer des lofts de test
    console.log('\n🏠 Création des lofts...')
    const loftsData = [
      {
        id: '3aaed8a3-1971-4578-8d7f-365d35bdaf22',
        name: 'Loft Artistique Hydra',
        address: '15 Rue Didouche Mourad, Hydra, Alger',
        price_per_night: 8500,
        owner_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        id: 'a44850c4-1b38-4094-bf17-4071d8003a63',
        name: 'Loft Moderne Centre-Ville',
        address: '42 Boulevard Mohamed V, Centre, Alger',
        price_per_night: 7200,
        owner_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Loft Industriel Kouba',
        address: '28 Avenue de l\'Indépendance, Kouba, Alger',
        price_per_night: 6800,
        owner_id: '550e8400-e29b-41d4-a716-446655440002'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Loft Luxueux Bab Ezzouar',
        address: '67 Rue des Frères Bouadou, Bab Ezzouar, Alger',
        price_per_night: 9200,
        owner_id: '550e8400-e29b-41d4-a716-446655440003'
      }
    ]

    const { data: insertedLofts, error: loftsError } = await supabase
      .from('lofts')
      .insert(loftsData)
      .select()

    if (loftsError) {
      console.error('❌ Erreur lors de la création des lofts:', loftsError)
    } else {
      console.log('✅ Lofts créés:', insertedLofts?.length || 0)
    }

    // 3. Créer des transactions de test
    console.log('\n💰 Création des transactions...')
    const transactionsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        amount: 25500,
        description: 'Réservation Ahmed Benali - 3 nuits',
        transaction_type: 'income',
        category: 'rent',
        date: '2024-12-20',
        loft_id: '3aaed8a3-1971-4578-8d7f-365d35bdaf22',
        currency_id: 'DZD'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        amount: 2000,
        description: 'Frais de nettoyage',
        transaction_type: 'income',
        category: 'cleaning',
        date: '2024-12-20',
        loft_id: '3aaed8a3-1971-4578-8d7f-365d35bdaf22',
        currency_id: 'DZD'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        amount: 1500,
        description: 'Maintenance climatisation',
        transaction_type: 'expense',
        category: 'maintenance',
        date: '2024-12-15',
        loft_id: '3aaed8a3-1971-4578-8d7f-365d35bdaf22',
        currency_id: 'DZD'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        amount: 14400,
        description: 'Réservation Famille Dupont - 2 nuits',
        transaction_type: 'income',
        category: 'rent',
        date: '2024-12-25',
        loft_id: 'a44850c4-1b38-4094-bf17-4071d8003a63',
        currency_id: 'DZD'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        amount: 800,
        description: 'Facture électricité',
        transaction_type: 'expense',
        category: 'utilities',
        date: '2024-12-01',
        loft_id: 'a44850c4-1b38-4094-bf17-4071d8003a63',
        currency_id: 'DZD'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        amount: 20400,
        description: 'Réservation Business - 3 nuits',
        transaction_type: 'income',
        category: 'rent',
        date: '2024-12-28',
        loft_id: '550e8400-e29b-41d4-a716-446655440004',
        currency_id: 'DZD'
      }
    ]

    const { data: insertedTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .insert(transactionsData)
      .select()

    if (transactionsError) {
      console.error('❌ Erreur lors de la création des transactions:', transactionsError)
    } else {
      console.log('✅ Transactions créées:', insertedTransactions?.length || 0)
    }

    console.log('\n🎉 Données de test créées avec succès!')
    console.log('\n📊 Résumé:')
    console.log(`   - ${ownersData.length} propriétaires`)
    console.log(`   - ${loftsData.length} lofts`)
    console.log(`   - ${transactionsData.length} transactions`)
    console.log('\n✅ Les rapports devraient maintenant fonctionner!')

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

createTestData()