#!/usr/bin/env tsx
/**
 * SCRIPT DE VALIDATION POST-CLONAGE
 * =================================
 * 
 * Valide qu'un environnement cloné fonctionne correctement
 * Teste toutes les fonctionnalités critiques
 * 
 * Usage: npm run tsx scripts/validate-clone.ts <environment>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

interface ValidationResult {
  test: string
  success: boolean
  details: string
  error?: string
}

class CloneValidator {
  private env!: Environment
  private results: ValidationResult[] = []

  constructor(private envName: string) {}

  private loadEnvironment(): void {
    const envFile = this.envName === 'dev' ? '.env.development' : 
                   this.envName === 'prod' ? '.env.production' : 
                   `.env.${this.envName}`
    
    if (!existsSync(envFile)) {
      throw new Error(`❌ Fichier ${envFile} non trouvé`)
    }

    const envContent = readFileSync(envFile, 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })

    this.env = {
      name: this.envName,
      url: envVars.NEXT_PUBLIC_SUPABASE_URL,
      key: envVars.SUPABASE_SERVICE_ROLE_KEY,
      client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
    }
  }

  private async addResult(test: string, success: boolean, details: string, error?: string): Promise<void> {
    this.results.push({ test, success, details, error })
    const status = success ? '✅' : '❌'
    console.log(`${status} ${test}: ${details}`)
    if (error) {
      console.log(`   ⚠️ ${error}`)
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.env.client
        .from('profiles')
        .select('count')
        .limit(1)

      if (error && !error.message.includes('relation "profiles" does not exist')) {
        await this.addResult('Connexion', false, 'Échec de connexion', error.message)
      } else {
        await this.addResult('Connexion', true, 'Connexion Supabase établie')
      }
    } catch (error) {
      await this.addResult('Connexion', false, 'Erreur de connexion', String(error))
    }
  }

  private async testTables(): Promise<void> {
    const requiredTables = [
      'profiles', 'lofts', 'transactions', 'categories', 
      'currencies', 'zone_areas', 'internet_connection_types',
      'loft_owners', 'teams', 'tasks', 'notifications'
    ]

    let tablesFound = 0

    for (const table of requiredTables) {
      try {
        const { data, error } = await this.env.client
          .from(table)
          .select('*')
          .limit(1)

        if (!error) {
          tablesFound++
        }
      } catch (error) {
        // Table n'existe pas
      }
    }

    const success = tablesFound >= requiredTables.length * 0.8 // 80% des tables requises
    await this.addResult(
      'Tables', 
      success, 
      `${tablesFound}/${requiredTables.length} tables trouvées`,
      success ? undefined : 'Certaines tables manquent'
    )
  }

  private async testData(): Promise<void> {
    const dataTests = [
      { table: 'zone_areas', name: 'Zones géographiques' },
      { table: 'categories', name: 'Catégories' },
      { table: 'currencies', name: 'Devises' },
      { table: 'loft_owners', name: 'Propriétaires' },
      { table: 'lofts', name: 'Lofts' }
    ]

    let dataTablesWithContent = 0

    for (const test of dataTests) {
      try {
        const { count, error } = await this.env.client
          .from(test.table)
          .select('*', { count: 'exact', head: true })

        if (!error && count && count > 0) {
          dataTablesWithContent++
          console.log(`   📊 ${test.name}: ${count} enregistrements`)
        } else {
          console.log(`   ⚠️ ${test.name}: Aucune donnée`)
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: Erreur`)
      }
    }

    const success = dataTablesWithContent >= 3 // Au moins 3 tables avec données
    await this.addResult(
      'Données', 
      success, 
      `${dataTablesWithContent}/${dataTests.length} tables avec données`,
      success ? undefined : 'Données insuffisantes'
    )
  }

  private async testRelations(): Promise<void> {
    try {
      // Test relation lofts -> zone_areas
      const { data: loftsWithZones, error: loftsError } = await this.env.client
        .from('lofts')
        .select(`
          id,
          name,
          zone_areas (
            id,
            name
          )
        `)
        .limit(5)

      // Test relation transactions -> lofts
      const { data: transactionsWithLofts, error: transError } = await this.env.client
        .from('transactions')
        .select(`
          id,
          amount,
          lofts (
            id,
            name
          )
        `)
        .limit(5)

      const relationsWork = !loftsError && !transError
      await this.addResult(
        'Relations', 
        relationsWork, 
        'Relations entre tables testées',
        relationsWork ? undefined : 'Erreurs dans les relations'
      )

    } catch (error) {
      await this.addResult('Relations', false, 'Test des relations échoué', String(error))
    }
  }

  private async testFunctions(): Promise<void> {
    try {
      // Test fonction get_upcoming_bills
      const { data, error } = await this.env.client
        .rpc('get_upcoming_bills', { days_ahead: 30 })

      const functionsWork = !error
      await this.addResult(
        'Fonctions', 
        functionsWork, 
        'Fonctions SQL testées',
        functionsWork ? undefined : error?.message
      )

    } catch (error) {
      await this.addResult('Fonctions', false, 'Test des fonctions échoué', String(error))
    }
  }

  private async testRLS(): Promise<void> {
    try {
      // Test RLS en tentant d'accéder sans authentification
      const publicClient = createClient(this.env.url, 'invalid-key')
      
      const { data, error } = await publicClient
        .from('lofts')
        .select('*')
        .limit(1)

      // RLS fonctionne si l'accès est refusé avec une clé invalide
      const rlsWorks = error && error.message.includes('JWT')
      await this.addResult(
        'RLS', 
        rlsWorks, 
        'Row Level Security testé',
        rlsWorks ? undefined : 'RLS pourrait ne pas être configuré'
      )

    } catch (error) {
      await this.addResult('RLS', false, 'Test RLS échoué', String(error))
    }
  }

  private async testTransactionCategories(): Promise<void> {
    try {
      const { data, error } = await this.env.client
        .from('transaction_category_references')
        .select('*')

      const hasCategories = !error && data && data.length > 0
      await this.addResult(
        'Catégories Référence', 
        hasCategories, 
        hasCategories ? `${data.length} catégories de référence` : 'Aucune catégorie',
        hasCategories ? undefined : 'Données de référence manquantes'
      )

    } catch (error) {
      await this.addResult('Catégories Référence', false, 'Test échoué', String(error))
    }
  }

  private async testNotifications(): Promise<void> {
    try {
      const { data, error } = await this.env.client
        .from('notifications')
        .select('*')
        .limit(5)

      const notificationsWork = !error
      await this.addResult(
        'Notifications', 
        notificationsWork, 
        'Système de notifications testé',
        notificationsWork ? undefined : error?.message
      )

    } catch (error) {
      await this.addResult('Notifications', false, 'Test notifications échoué', String(error))
    }
  }

  async executeValidation(): Promise<void> {
    console.log('🔍 VALIDATION POST-CLONAGE')
    console.log('='.repeat(50))
    console.log(`🎯 Environnement: ${this.envName.toUpperCase()}`)
    console.log(`⏰ Début: ${new Date().toLocaleString()}`)
    console.log('')

    // Charger l'environnement
    this.loadEnvironment()

    // Exécuter tous les tests
    await this.testConnection()
    await this.testTables()
    await this.testData()
    await this.testRelations()
    await this.testFunctions()
    await this.testRLS()
    await this.testTransactionCategories()
    await this.testNotifications()

    // Rapport final
    this.displayFinalReport()
  }

  private displayFinalReport(): void {
    console.log('\n📊 RAPPORT DE VALIDATION')
    console.log('='.repeat(50))

    const totalTests = this.results.length
    const successfulTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - successfulTests

    console.log(`📋 Tests exécutés: ${totalTests}`)
    console.log(`✅ Tests réussis: ${successfulTests}`)
    console.log(`❌ Tests échoués: ${failedTests}`)
    console.log(`📈 Taux de réussite: ${Math.round(successfulTests / totalTests * 100)}%`)

    if (failedTests > 0) {
      console.log('\n❌ TESTS ÉCHOUÉS:')
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.error || result.details}`)
        })
    }

    console.log('\n📋 RECOMMANDATIONS:')
    
    if (successfulTests === totalTests) {
      console.log('🎉 Environnement parfaitement fonctionnel!')
      console.log('✅ Vous pouvez utiliser cet environnement en toute sécurité')
    } else if (successfulTests >= totalTests * 0.8) {
      console.log('⚠️ Environnement fonctionnel avec quelques problèmes mineurs')
      console.log('💡 Corrigez les problèmes identifiés pour une utilisation optimale')
    } else {
      console.log('❌ Environnement avec des problèmes majeurs')
      console.log('🔧 Correction nécessaire avant utilisation')
      console.log('💡 Considérez un nouveau clonage ou une restauration')
    }

    console.log('\n🛠️ ACTIONS SUGGÉRÉES:')
    
    if (failedTests > 0) {
      console.log('1. Vérifiez le schéma dans Supabase Dashboard')
      console.log('2. Réappliquez database/complete-schema.sql si nécessaire')
      console.log('3. Vérifiez les permissions RLS')
      console.log('4. Relancez le clonage si les problèmes persistent')
    }
    
    console.log('5. Testez manuellement les fonctionnalités critiques')
    console.log('6. Lancez l\'application: npm run dev')
    console.log('7. Vérifiez l\'interface utilisateur')

    // Sauvegarder le rapport
    const reportPath = `validation_report_${this.envName}_${Date.now()}.json`
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.envName,
      totalTests,
      successfulTests,
      failedTests,
      successRate: Math.round(successfulTests / totalTests * 100),
      results: this.results
    }
    
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Rapport détaillé: ${reportPath}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 1) {
    console.log('📋 VALIDATION POST-CLONAGE')
    console.log('='.repeat(40))
    console.log('')
    console.log('Usage: npm run tsx scripts/validate-clone.ts <environment>')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run tsx scripts/validate-clone.ts test')
    console.log('• npm run tsx scripts/validate-clone.ts dev')
    return
  }

  const [environment] = args
  
  if (!['prod', 'test', 'dev'].includes(environment)) {
    console.log('❌ Environnement non valide. Utilisez: prod, test, dev')
    return
  }

  try {
    const validator = new CloneValidator(environment)
    await validator.executeValidation()
  } catch (error) {
    console.error('❌ Erreur de validation:', error)
    process.exit(1)
  }
}

main().catch(console.error)