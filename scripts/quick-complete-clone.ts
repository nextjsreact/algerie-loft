import { CompleteDatabaseClone } from './complete-database-clone'

// Script de clonage rapide avec configurations prédéfinies

async function quickClone() {
  console.log('🚀 CLONAGE RAPIDE - TOUTES LES TABLES')
  console.log('====================================')
  
  const configs = {
    'prod-to-test': {
      sourceEnv: 'prod' as const,
      targetEnv: 'test' as const,
      anonymize: true,
      excludeTables: ['critical_alerts', 'executive_metrics'] // Exclure les données sensibles
    },
    'prod-to-dev': {
      sourceEnv: 'prod' as const,
      targetEnv: 'dev' as const,
      anonymize: true,
      excludeTables: ['critical_alerts', 'executive_metrics', 'guest_communications']
    },
    'test-to-dev': {
      sourceEnv: 'test' as const,
      targetEnv: 'dev' as const,
      anonymize: false,
      excludeTables: []
    }
  }

  const args = process.argv.slice(2)
  const configName = args[0] as keyof typeof configs

  if (!configName || !configs[configName]) {
    console.log('Configurations disponibles:')
    Object.keys(configs).forEach(key => {
      const config = configs[key as keyof typeof configs]
      console.log(`  ${key}: ${config.sourceEnv} → ${config.targetEnv} (anonymisé: ${config.anonymize})`)
    })
    console.log('\nUsage: tsx quick-complete-clone.ts <config>')
    console.log('Exemple: tsx quick-complete-clone.ts prod-to-test')
    return
  }

  const config = configs[configName]
  console.log(`📤 Source: ${config.sourceEnv.toUpperCase()}`)
  console.log(`📥 Cible: ${config.targetEnv.toUpperCase()}`)
  console.log(`🔒 Anonymisation: ${config.anonymize ? 'OUI' : 'NON'}`)
  
  if (config.excludeTables.length > 0) {
    console.log(`🚫 Tables exclues: ${config.excludeTables.join(', ')}`)
  }
  
  console.log('')

  const cloner = new CompleteDatabaseClone(config)
  await cloner.clone()
}

quickClone().catch(console.error)