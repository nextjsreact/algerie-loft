#!/usr/bin/env tsx
/**
 * Script spécialisé: Clonage Production → Tous les Environnements
 * Clone les données de production vers dev, test et learning simultanément
 */

import { DataCloner } from './clone-data'

async function cloneProdToAll() {
  console.log('🚀 CLONAGE PRODUCTION → TOUS LES ENVIRONNEMENTS')
  console.log('='.repeat(60))
  console.log('Ce script clone les données de production vers tous les environnements.')
  console.log('Environnements cibles: dev, test, learning')
  console.log('⚠️ Les données existantes dans tous les environnements seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer TOUTES les données? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  const environments = ['dev', 'test', 'learning']

  for (const env of environments) {
    console.log(`\n🎯 Clonage vers ${env.toUpperCase()}`)
    console.log('='.repeat(40))

    const cloner = new DataCloner({
      source: 'prod',
      target: env as any,
      excludeSensitive: false,
      dryRun: false
    })

    await cloner.cloneData()

    console.log('\n🔍 Vérification automatique...')
    await cloner.verifyClone()

    console.log(`\n✅ ${env.toUpperCase()} mis à jour avec succès!`)
  }

  console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
  console.log('\n📊 Résumé:')
  console.log('• Développement: Données de prod clonées')
  console.log('• Test: Données de prod clonées')
  console.log('• Apprentissage: Données de prod clonées')
  console.log('\n💡 Testez avec: npm run env:switch:dev && npm run dev')
}

cloneProdToAll().catch(console.error)