#!/usr/bin/env tsx
/**
 * Script spécialisé: Clonage Production → Learning
 * Clone les données de production vers l'environnement d'apprentissage
 */

import { DataCloner } from './clone-data'

async function cloneProdToLearning() {
  console.log('📚 CLONAGE PRODUCTION → APPRENTISSAGE')
  console.log('='.repeat(50))
  console.log('Ce script clone les données de production vers l\'environnement d\'apprentissage.')
  console.log('⚠️ Les données existantes en apprentissage seront remplacées.\n')

  // Confirmation de sécurité
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise(resolve => {
    rl.question('Êtes-vous sûr de vouloir remplacer les données d\'apprentissage? (tapez OUI): ', resolve)
  })

  rl.close()

  if (confirm !== 'OUI') {
    console.log('❌ Opération annulée')
    return
  }

  const cloner = new DataCloner({
    source: 'prod',
    target: 'learning',
    excludeSensitive: false, // Inclure TOUTES les données (avec anonymisation)
    dryRun: false
    // truncate: true // Removed - using professional reset approach instead
  })

  await cloner.cloneData()

  // Vérification automatique post-clonage
  console.log('\n🔍 Vérification automatique...')
  await cloner.verifyClone()

  console.log('\n🎓 RECOMMANDATIONS POST-CLONAGE:')
  console.log('• Testez la connexion: npm run env:switch:learning && npm run dev')
  console.log('• TOUTES les données ont été clonées avec anonymisation')
  console.log('• Mot de passe universel pour LEARNING: learn123')
  console.log('• Tous les utilisateurs peuvent se connecter avec: learn123')
  console.log('• Parfait pour la formation et les démonstrations')
}

cloneProdToLearning().catch(console.error)