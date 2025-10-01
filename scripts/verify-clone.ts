/**
 * SYSTÈME DE VÉRIFICATION POST-CLONAGE
 * ===================================
 *
 * Vérifie l'intégrité et la cohérence des données après clonage
 * Compare les comptes entre source et cible
 * Détecte les problèmes potentiels
 */

import fetch from 'node-fetch'

interface VerificationOptions {
  source: 'prod' | 'test' | 'dev' | 'learning'
  target: 'prod' | 'test' | 'dev' | 'learning'
  tables?: string[]
  detailed?: boolean
}

interface TableCount {
  table: string
  sourceCount: number
  targetCount: number
  status: 'match' | 'mismatch' | 'error' | 'missing'
  error?: string
}

interface EnvironmentConfig {
  url: string
  serviceKey: string
  anonKey: string
}

class CloneVerifier {
  private sourceConfig!: EnvironmentConfig
  private targetConfig!: EnvironmentConfig
  private options: VerificationOptions

  constructor(options: VerificationOptions) {
    this.options = options
  }

  /**
   * Chargement de la configuration d'environnement
   */
  private loadEnvironment(env: string): EnvironmentConfig {
    const envFiles = {
      prod: 'env-backup/.env.prod',
      dev: 'env-backup/.env.development',
      test: 'env-backup/.env.test',
      learning: 'env-backup/.env.learning'
    }

    require('dotenv').config({ path: envFiles[env as keyof typeof envFiles] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !serviceKey || !anonKey) {
      throw new Error(`Configuration manquante pour ${env}`)
    }

    return { url, serviceKey, anonKey }
  }

  /**
   * Test de connectivité
   */
  private async testConnection(config: EnvironmentConfig, label: string): Promise<boolean> {
    try {
      const response = await fetch(`${config.url}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey
        }
      })
      return response.ok
    } catch (error) {
      console.error(`❌ ${label} inaccessible:`, error)
      return false
    }
  }

  /**
   * Comptage des enregistrements dans une table
   */
  private async countTableRecords(config: EnvironmentConfig, table: string): Promise<number> {
    try {
      const response = await fetch(`${config.url}/rest/v1/${table}?select=count`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey,
          'Prefer': 'count=exact'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const countHeader = response.headers.get('content-range')
      if (countHeader) {
        const match = countHeader.match(/\/(\d+)/)
        if (match) {
          return parseInt(match[1])
        }
      }

      return 0
    } catch (error) {
      console.warn(`⚠️ Impossible de compter ${table}:`, error)
      return -1
    }
  }

  /**
   * Vérification de l'existence d'une table
   */
  private async tableExists(config: EnvironmentConfig, table: string): Promise<boolean> {
    try {
      const response = await fetch(`${config.url}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey
        }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Vérification complète
   */
  public async verify(): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('🔍 VÉRIFICATION POST-CLONAGE')
      console.log('='.repeat(50))

      // Chargement des configurations
      this.sourceConfig = this.loadEnvironment(this.options.source)
      this.targetConfig = this.loadEnvironment(this.options.target)

      // Test des connexions
      const sourceConnected = await this.testConnection(this.sourceConfig, `Source (${this.options.source.toUpperCase()})`)
      const targetConnected = await this.testConnection(this.targetConfig, `Target (${this.options.target.toUpperCase()})`)

      if (!sourceConnected || !targetConnected) {
        throw new Error('Connexions aux bases de données échouées')
      }

      // Tables à vérifier
      const tablesToCheck = this.options.tables || [
        'lofts', 'profiles', 'loft_owners', 'teams', 'team_members',
        'tasks', 'transactions', 'transaction_category_references',
        'currencies', 'categories', 'zone_areas', 'internet_connection_types',
        'payment_methods', 'settings', 'notifications', 'messages'
      ]

      console.log(`📋 VÉRIFICATION DE ${tablesToCheck.length} TABLES`)
      console.log('='.repeat(50))

      const results: TableCount[] = []

      // Vérification table par table
      for (const table of tablesToCheck) {
        console.log(`\n📊 TABLE: ${table}`)
        console.log('-'.repeat(30))

        // Vérification existence dans source
        const sourceExists = await this.tableExists(this.sourceConfig, table)
        if (!sourceExists) {
          results.push({
            table,
            sourceCount: -1,
            targetCount: -1,
            status: 'error',
            error: 'Table inexistante dans la source'
          })
          continue
        }

        // Vérification existence dans target
        const targetExists = await this.tableExists(this.targetConfig, table)
        if (!targetExists) {
          results.push({
            table,
            sourceCount: -1,
            targetCount: -1,
            status: 'error',
            error: 'Table inexistante dans la cible'
          })
          continue
        }

        // Comptage des enregistrements
        const sourceCount = await this.countTableRecords(this.sourceConfig, table)
        const targetCount = await this.countTableRecords(this.targetConfig, table)

        let status: TableCount['status'] = 'match'
        let error: string | undefined

        if (sourceCount === -1 || targetCount === -1) {
          status = 'error'
          error = 'Erreur lors du comptage'
        } else if (sourceCount !== targetCount) {
          status = 'mismatch'
          error = `Différence: ${sourceCount - targetCount} enregistrements`
        }

        results.push({
          table,
          sourceCount,
          targetCount,
          status,
          error
        })

        // Affichage du résultat
        const icon = status === 'match' ? '✅' :
                     status === 'mismatch' ? '⚠️' :
                     '❌'
        console.log(`${icon} Source: ${sourceCount} | Cible: ${targetCount}`)
        if (error) {
          console.log(`   ${error}`)
        }
      }

      // Résumé final
      this.printSummary(results, startTime)

    } catch (error) {
      console.error('💥 ERREUR DE VÉRIFICATION:', error)
      process.exit(1)
    }
  }

  /**
   * Affichage du résumé
   */
  private printSummary(results: TableCount[], startTime: number): void {
    const duration = Date.now() - startTime
    const matches = results.filter(r => r.status === 'match').length
    const mismatches = results.filter(r => r.status === 'mismatch').length
    const errors = results.filter(r => r.status === 'error').length

    console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION')
    console.log('='.repeat(50))
    console.log(`⏱️ Durée: ${Math.round(duration / 1000)}s`)
    console.log(`✅ Correspondances: ${matches}`)
    console.log(`⚠️ Différences: ${mismatches}`)
    console.log(`❌ Erreurs: ${errors}`)

    if (mismatches > 0 || errors > 0) {
      console.log('\n⚠️ PROBLÈMES DÉTECTÉS:')
      results.forEach(result => {
        if (result.status !== 'match') {
          const icon = result.status === 'mismatch' ? '⚠️' : '❌'
          console.log(`${icon} ${result.table}: ${result.error}`)
        }
      })
    }

    console.log('\n🎯 RECOMMANDATIONS:')
    if (matches === results.length) {
      console.log('✅ Toutes les tables sont synchronisées!')
      console.log('💡 Votre clonage est réussi')
    } else if (mismatches > 0) {
      console.log('⚠️ Des différences ont été détectées')
      console.log('💡 Vérifiez les logs de clonage pour identifier les problèmes')
    } else {
      console.log('❌ Des erreurs critiques ont été détectées')
      console.log('💡 Recommencez le clonage ou vérifiez la configuration')
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const options: VerificationOptions = {
    source: 'prod',
    target: 'dev',
    detailed: false
  }

  // Parsing des arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--source':
        options.source = args[++i] as any
        break
      case '--target':
        options.target = args[++i] as any
        break
      case '--detailed':
        options.detailed = true
        break
      case '--tables':
        options.tables = args[++i].split(',')
        break
    }
  }

  const verifier = new CloneVerifier(options)
  await verifier.verify()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}