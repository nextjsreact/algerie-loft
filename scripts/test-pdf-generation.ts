#!/usr/bin/env tsx
/**
 * SCRIPT DE TEST POUR LA GÉNÉRATION PDF
 * ====================================
 * 
 * Teste la génération de rapports PDF avec des données d'exemple
 */

import { PDFReportGenerator, type Transaction, type Loft, type Owner, type ReportOptions } from '../lib/pdf-generator'
import { writeFileSync } from 'fs'

// Données d'exemple
const sampleLoft: Loft = {
  id: '1',
  name: 'Loft Hydra Premium',
  address: '123 Rue Didouche Mourad, Hydra, Alger',
  owner_name: 'Ahmed Benali',
  price_per_month: 80000
}

const sampleOwner: Owner = {
  id: '1',
  name: 'Ahmed Benali',
  email: 'ahmed.benali@email.com',
  phone: '+213 555 123 456',
  lofts_count: 3
}

const sampleLofts: Loft[] = [
  sampleLoft,
  {
    id: '2',
    name: 'Loft Bab Ezzouar',
    address: '456 Avenue de l\'Indépendance, Bab Ezzouar, Alger',
    owner_name: 'Ahmed Benali',
    price_per_month: 65000
  },
  {
    id: '3',
    name: 'Loft Oran Centre',
    address: '789 Boulevard de la République, Oran',
    owner_name: 'Fatima Khelifi',
    price_per_month: 70000
  }
]

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    amount: 80000,
    description: 'Loyer mensuel janvier 2024',
    transaction_type: 'income',
    category: 'rent',
    date: '2024-01-01T00:00:00Z',
    loft_id: '1',
    loft_name: 'Loft Hydra Premium',
    owner_name: 'Ahmed Benali',
    currency: 'DZD'
  },
  {
    id: '2',
    amount: 5000,
    description: 'Réparation plomberie',
    transaction_type: 'expense',
    category: 'maintenance',
    date: '2024-01-15T00:00:00Z',
    loft_id: '1',
    loft_name: 'Loft Hydra Premium',
    owner_name: 'Ahmed Benali',
    currency: 'DZD'
  },
  {
    id: '3',
    amount: 65000,
    description: 'Loyer mensuel janvier 2024',
    transaction_type: 'income',
    category: 'rent',
    date: '2024-01-01T00:00:00Z',
    loft_id: '2',
    loft_name: 'Loft Bab Ezzouar',
    owner_name: 'Ahmed Benali',
    currency: 'DZD'
  },
  {
    id: '4',
    amount: 2500,
    description: 'Nettoyage mensuel',
    transaction_type: 'expense',
    category: 'cleaning',
    date: '2024-01-30T00:00:00Z',
    loft_id: '2',
    loft_name: 'Loft Bab Ezzouar',
    owner_name: 'Ahmed Benali',
    currency: 'DZD'
  },
  {
    id: '5',
    amount: 70000,
    description: 'Loyer mensuel janvier 2024',
    transaction_type: 'income',
    category: 'rent',
    date: '2024-01-01T00:00:00Z',
    loft_id: '3',
    loft_name: 'Loft Oran Centre',
    owner_name: 'Fatima Khelifi',
    currency: 'DZD'
  },
  {
    id: '6',
    amount: 15000,
    description: 'Assurance annuelle',
    transaction_type: 'expense',
    category: 'insurance',
    date: '2024-01-10T00:00:00Z',
    loft_id: '3',
    loft_name: 'Loft Oran Centre',
    owner_name: 'Fatima Khelifi',
    currency: 'DZD'
  }
]

const reportOptions: ReportOptions = {
  title: 'Rapport de Test',
  subtitle: 'Généré automatiquement pour test',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  includeDetails: true,
  includeSummary: true,
  currency: 'DZD'
}

async function testPDFGeneration() {
  console.log('🧪 TEST DE GÉNÉRATION PDF')
  console.log('='.repeat(50))

  const generator = new PDFReportGenerator()

  try {
    // Test 1: Rapport par loft
    console.log('\n📋 Test 1: Rapport par loft...')
    const loftTransactions = sampleTransactions.filter(t => t.loft_id === sampleLoft.id)
    const loftPDF = await generator.generateLoftReport(sampleLoft, loftTransactions, reportOptions)
    
    writeFileSync('test_rapport_loft.pdf', Buffer.from(loftPDF))
    console.log('✅ Rapport loft généré: test_rapport_loft.pdf')

    // Test 2: Rapport par propriétaire
    console.log('\n📋 Test 2: Rapport par propriétaire...')
    const ownerLofts = sampleLofts.filter(l => l.owner_name === sampleOwner.name)
    const ownerTransactions = sampleTransactions.filter(t => t.owner_name === sampleOwner.name)
    const ownerPDF = await generator.generateOwnerReport(sampleOwner, ownerLofts, ownerTransactions, reportOptions)
    
    writeFileSync('test_rapport_proprietaire.pdf', Buffer.from(ownerPDF))
    console.log('✅ Rapport propriétaire généré: test_rapport_proprietaire.pdf')

    // Test 3: Rapport global
    console.log('\n📋 Test 3: Rapport global...')
    const globalPDF = await generator.generateGlobalReport(sampleLofts, sampleTransactions, reportOptions)
    
    writeFileSync('test_rapport_global.pdf', Buffer.from(globalPDF))
    console.log('✅ Rapport global généré: test_rapport_global.pdf')

    // Statistiques
    console.log('\n📊 STATISTIQUES DES TESTS')
    console.log('='.repeat(30))
    console.log(`📁 Fichiers générés: 3`)
    console.log(`📋 Lofts testés: ${sampleLofts.length}`)
    console.log(`💰 Transactions testées: ${sampleTransactions.length}`)
    
    const totalIncome = sampleTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = sampleTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    console.log(`💵 Total revenus: ${totalIncome.toLocaleString()} DZD`)
    console.log(`💸 Total dépenses: ${totalExpenses.toLocaleString()} DZD`)
    console.log(`📈 Résultat net: ${(totalIncome - totalExpenses).toLocaleString()} DZD`)

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS!')
    console.log('\n📄 Fichiers PDF générés:')
    console.log('• test_rapport_loft.pdf')
    console.log('• test_rapport_proprietaire.pdf')
    console.log('• test_rapport_global.pdf')

  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error)
    process.exit(1)
  }
}

// Fonction pour tester les calculs
function testCalculations() {
  console.log('\n🧮 TEST DES CALCULS')
  console.log('='.repeat(30))

  const totalIncome = sampleTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = sampleTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  console.log(`Revenus calculés: ${totalIncome} DZD`)
  console.log(`Dépenses calculées: ${totalExpenses} DZD`)
  console.log(`Net calculé: ${totalIncome - totalExpenses} DZD`)

  // Vérifications
  const expectedIncome = 80000 + 65000 + 70000 // 215000
  const expectedExpenses = 5000 + 2500 + 15000 // 22500
  
  if (totalIncome === expectedIncome) {
    console.log('✅ Calcul des revenus correct')
  } else {
    console.log(`❌ Erreur calcul revenus: attendu ${expectedIncome}, obtenu ${totalIncome}`)
  }

  if (totalExpenses === expectedExpenses) {
    console.log('✅ Calcul des dépenses correct')
  } else {
    console.log(`❌ Erreur calcul dépenses: attendu ${expectedExpenses}, obtenu ${totalExpenses}`)
  }
}

async function main() {
  console.log('🚀 DÉMARRAGE DES TESTS PDF')
  console.log('Générateur de Rapports Loft Algérie')
  console.log('='.repeat(50))

  // Tests des calculs
  testCalculations()

  // Tests de génération PDF
  await testPDFGeneration()

  console.log('\n✨ Tests terminés avec succès!')
  console.log('💡 Vous pouvez maintenant ouvrir les fichiers PDF générés pour vérifier le résultat.')
}

main().catch(console.error)