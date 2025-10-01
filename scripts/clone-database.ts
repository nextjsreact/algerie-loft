#!/usr/bin/env tsx
/**
 * Script Universel de Clonage de Bases de Données
 * Supporte tous les environnements : prod, dev, test, learning
 *
 * Usage:
 * npx tsx scripts/clone-database.ts --source prod --target dev
 * npx tsx scripts/clone-database.ts --source prod --target all
 */

import { DataCloner } from './clone-data'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    source: { type: 'string' },
    target: { type: 'string' },
    tables: { type: 'string' },
    'dry-run': { type: 'boolean' },
    'exclude-sensitive': { type: 'boolean' },
    truncate: { type: 'boolean' },
    verify: { type: 'boolean' },
    help: { type: 'boolean' }
  },
  allowPositionals: true
})

async function main() {
  if (values.help) {
    console.log(`
🚀 CLONAGE UNIVERSEL DE BASES DE DONNÉES

Usage:
  npx tsx scripts/clone-database.ts --source <env> --target <env> [options]

Environnements:
  prod, dev, test, learning, all

Options:
  --source <env>          Environnement source (prod, dev, test, learning)
  --target <env>          Environnement cible (prod, dev, test, learning, all)
  --tables <list>         Tables spécifiques (comma-separated)
  --dry-run              Mode simulation (aucune modification)
  --exclude-sensitive    Exclure les données sensibles
  --truncate             Vider la base cible avant clonage (défaut: conserver)
  --verify               Vérifier après clonage
  --help                 Afficher cette aide

Exemples:
  npx tsx scripts/clone-database.ts --source prod --target dev
  npx tsx scripts/clone-database.ts --source prod --target all
  npx tsx scripts/clone-database.ts --source prod --target learning --dry-run
  npx tsx scripts/clone-database.ts --source prod --target test --tables lofts,tasks
    `)
    return
  }

  const { source, target, tables, 'dry-run': dryRun, 'exclude-sensitive': excludeSensitive, truncate, verify } = values

  if (!source || !target) {
    console.error('❌ Erreur: --source et --target sont requis')
    console.log('Utilisez --help pour voir les options disponibles')
    process.exit(1)
  }

  // Validation des environnements
  const validEnvs = ['prod', 'dev', 'test', 'learning', 'all']
  if (!validEnvs.includes(source) || !validEnvs.includes(target)) {
    console.error(`❌ Erreur: Environnements invalides. Utilisez: ${validEnvs.join(', ')}`)
    process.exit(1)
  }

  console.log(`🔄 CLONAGE: ${source.toUpperCase()} → ${target.toUpperCase()}`)
  console.log('='.repeat(60))

  // Si target = all, cloner vers tous les environnements sauf prod
  if (target === 'all') {
    const targets = ['dev', 'test', 'learning']
    for (const targetEnv of targets) {
      if (source !== targetEnv) {
        console.log(`\n🎯 Clonage vers ${targetEnv.toUpperCase()}`)
        console.log('-'.repeat(40))

        const cloner = new DataCloner({
          source: source as any,
          target: targetEnv as any,
          tables: tables ? tables.split(',') : undefined,
          excludeSensitive: excludeSensitive ?? false,
          dryRun: dryRun ?? false,
          truncate: truncate ?? false
        })

        await cloner.cloneData()

        if (verify) {
          console.log('\n🔍 Vérification automatique...')
          await cloner.verifyClone()
        }
      }
    }
  } else {
    // Clonage simple vers un environnement spécifique
    const cloner = new DataCloner({
      source: source as any,
      target: target as any,
      tables: tables ? tables.split(',') : undefined,
      excludeSensitive: excludeSensitive ?? false,
      dryRun: dryRun ?? false,
      truncate: truncate ?? false
    })

    await cloner.cloneData()

    if (verify) {
      console.log('\n🔍 Vérification automatique...')
      await cloner.verifyClone()
    }
  }

  console.log('\n✅ CLONAGE TERMINÉ AVEC SUCCÈS!')
  console.log('\n💡 Prochaines étapes:')
  console.log('• Testez avec: npm run env:switch:' + (target === 'all' ? 'dev' : target))
  console.log('• Vérifiez les données avec vos scripts de vérification')
}

main().catch(console.error)