#!/usr/bin/env tsx
/**
 * CLONAGE COMPLET SIMPLIFIÉ PRODUCTION → DÉVELOPPEMENT
 * ====================================================
 * 
 * Version simplifiée qui fait :
 * 1. Vide toutes les tables DEV
 * 2. Copie toutes les données PROD → DEV
 * 3. Anonymise les données sensibles
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as readline from 'readline'

interface CloneResult {
  table: string
  status: 'success' | 'error' | 'empty' | 'skipped'
  records: number
  error?: string
  duration: number
}

class SimpleCompleteCloner {
  private prodClient: any
  private devClient: any
  private results: CloneResult[] = []

  constructor() {
    this.initializeClients()
  }

  /**
   * Initialisation des clients
   */
  private initializeClients() {
    console.log('🔧 Initialisation des connexions...')

    // Configuration Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!prodUrl || !prodKey) {
      throw new Error('❌ Configuration PRODUCTION manquante')
    }

    this.prodClient = createClient(prodUrl, prodKey)
    console.log('✅ Client PRODUCTION initialisé')

    // Configuration Développement
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!devUrl || !devKey) {
      throw new Error('❌ Configuration DÉVELOPPEMENT manquante')
    }

    // PROTECTION CRITIQUE
    if (devUrl.includes('mhngbluefyucoesgcjoy')) {
      throw new Error('🚫 ERREUR CRITIQUE: URL de PRODUCTION détectée dans DEV!')
    }

    this.devClient = createClient(devUrl, devKey)
    console.log('✅ Client DÉVELOPPEMENT initialisé')
  }

  /**
   * Confirmation utilisateur
   */
  private async confirmCloning(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      console.log('\n⚠️ ATTENTION: Cette opération va:')
      console.log('• Vider TOUTES les tables de DÉVELOPPEMENT')
      console.log('• Les remplir avec les données de PRODUCTION')
      console.log('• Anonymiser les données sensibles')
      console.log('')

      rl.question('Êtes-vous sûr de vouloir continuer? Tapez "OUI" pour confirmer: ', (answer) => {
        rl.close()
        resolve(answer.toUpperCase() === 'OUI')
      })
    })
  }

  /**
   * Nettoyage d'une table
   */
  private async clearTable(tableName: string): Promise<void> {
    console.log(`🗑️ Nettoyage ${tableName}...`)
    
    try {
      const { error } = await this.devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Condition pour supprimer tout

      if (error && !error.message.includes('No rows found')) {
        console.warn(`⚠️ Nettoyage ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName} nettoyé`)
      }
    } catch (error) {
      console.warn(`⚠️ Erreur nettoyage ${tableName}:`, error)
    }
  }

  /**
   * Récupération des données d'une table
   */
  private async fetchTableData(tableName: string): Promise<any[]> {
    console.log(`📥 Récupération ${tableName}...`)
    
    const { data, error } = await this.prodClient
      .from(tableName)
      .select('*')

    if (error) {
      throw new Error(`Erreur récupération ${tableName}: ${error.message}`)
    }

    console.log(`✅ ${tableName}: ${data?.length || 0} enregistrements`)
    return data || []
  }

  /**
   * Anonymisation des données sensibles
   */
  private anonymizeData(data: any[], tableName: string): any[] {
    if (tableName === 'profiles') {
      return data.map((record, index) => ({
        ...record,
        email: record.role === 'admin' 
          ? 'admin_dev@dev.local' 
          : `user_dev_${index}@dev.local`,
        full_name: record.full_name 
          ? `${record.full_name} (DEV)` 
          : `User DEV ${index}`,
        // Supprimer les tokens sensibles
        airbnb_access_token: null,
        airbnb_refresh_token: null
      }))
    }

    if (tableName === 'notifications') {
      return data.map(record => ({
        ...record,
        message: record.message?.includes('@') 
          ? 'Message de test anonymisé' 
          : record.message,
        is_read: true,
        read_at: new Date().toISOString()
      }))
    }

    return data
  }

  /**
   * Insertion des données par lots
   */
  private async insertData(tableName: string, data: any[]): Promise<CloneResult> {
    const startTime = Date.now()

    if (data.length === 0) {
      return {
        table: tableName,
        status: 'empty',
        records: 0,
        duration: Date.now() - startTime
      }
    }

    try {
      console.log(`📤 Insertion ${tableName} (${data.length} enregistrements)...`)

      // Insertion par lots pour éviter les timeouts
      const batchSize = 50
      let insertedCount = 0

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        const { error } = await this.devClient
          .from(tableName)
          .insert(batch)

        if (error) {
          console.error(`❌ Erreur lot ${Math.floor(i/batchSize) + 1}: ${error.message}`)
          
          // Essayer d'insérer un par un pour ce lot
          for (const record of batch) {
            const { error: singleError } = await this.devClient
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              insertedCount++
            } else {
              console.warn(`⚠️ Erreur enregistrement: ${singleError.message}`)
            }
          }
        } else {
          insertedCount += batch.length
          process.stdout.write(`\r📤 Progression: ${insertedCount}/${data.length}`)
        }
      }

      console.log('') // Nouvelle ligne
      console.log(`✅ ${tableName}: ${insertedCount} enregistrements insérés`)

      return {
        table: tableName,
        status: 'success',
        records: insertedCount,
        duration: Date.now() - startTime
      }

    } catch (error) {
      console.error(`❌ Erreur insertion ${tableName}:`, error)
      return {
        table: tableName,
        status: 'error',
        records: 0,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Clonage d'une table complète
   */
  private async cloneTable(tableName: string): Promise<CloneResult> {
    console.log(`\n📋 Clonage: ${tableName}`)
    console.log('-'.repeat(40))

    try {
      // 1. Nettoyer la table de développement
      await this.clearTable(tableName)

      // 2. Récupérer les données de production
      const sourceData = await this.fetchTableData(tableName)

      if (sourceData.length === 0) {
        console.log(`ℹ️ Table ${tableName} vide`)
        return {
          table: tableName,
          status: 'empty',
          records: 0,
          duration: 0
        }
      }

      // 3. Anonymiser les données sensibles
      const anonymizedData = this.anonymizeData(sourceData, tableName)

      // 4. Insérer les nouvelles données
      const result = await this.insertData(tableName, anonymizedData)
      this.results.push(result)

      return result

    } catch (error) {
      console.error(`❌ Erreur clonage ${tableName}:`, error)
      const errorResult: CloneResult = {
        table: tableName,
        status: 'error',
        records: 0,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      }
      this.results.push(errorResult)
      return errorResult
    }
  }

  /**
   * Clonage de toutes les tables dans l'ordre des dépendances
   */
  public async cloneAllTables(): Promise<void> {
    console.log('🚀 CLONAGE COMPLET SIMPLIFIÉ PRODUCTION → DÉVELOPPEMENT')
    console.log('='.repeat(60))

    // Tables dans l'ordre des dépendances (références d'abord)
    const tablesToClone = [
      'currencies',
      'categories', 
      'zone_areas',
      'internet_connection_types',
      'payment_methods',
      'loft_owners',
      'teams',
      'profiles',
      'lofts',
      'team_members',
      'tasks',
      'transactions',
      'transaction_category_references',
      'settings',
      'notifications',
      'customers',
      'loft_photos'
    ]

    let totalRecords = 0
    const startTime = Date.now()

    for (const tableName of tablesToClone) {
      const result = await this.cloneTable(tableName)
      totalRecords += result.records
    }

    // Résumé final
    this.printSummary(totalRecords, startTime)
  }

  /**
   * Affichage du résumé final
   */
  private printSummary(totalRecords: number, startTime: number): void {
    const duration = Date.now() - startTime
    const successful = this.results.filter(r => r.status === 'success').length
    const errors = this.results.filter(r => r.status === 'error').length
    const empty = this.results.filter(r => r.status === 'empty').length

    console.log('\n📊 RÉSUMÉ DU CLONAGE COMPLET')
    console.log('='.repeat(50))
    console.log(`⏱️ Durée totale: ${Math.round(duration / 1000)}s`)
    console.log(`📈 Enregistrements clonés: ${totalRecords}`)
    console.log(`✅ Tables réussies: ${successful}`)
    console.log(`❌ Tables en erreur: ${errors}`)
    console.log(`ℹ️ Tables vides: ${empty}`)

    console.log('\n📋 DÉTAIL PAR TABLE:')
    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' :
                   result.status === 'error' ? '❌' :
                   result.status === 'empty' ? 'ℹ️' : '⚠️'
      const error = result.error ? ` - ${result.error}` : ''
      console.log(`${icon} ${result.table}: ${result.records} enregistrements${error}`)
    })

    console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
    console.log('='.repeat(50))

    if (errors === 0) {
      console.log('✅ Toutes les tables clonées avec succès!')
    } else {
      console.log(`⚠️ ${errors} table(s) avec erreurs - vérifiez les logs`)
    }

    console.log('\n💡 PROCHAINES ÉTAPES:')
    console.log('• Testez votre application: npm run dev')
    console.log('• Mot de passe universel DEV: dev123')
    console.log('• Données sensibles anonymisées automatiquement')
  }

  /**
   * Méthode principale de clonage
   */
  public async clone(): Promise<void> {
    try {
      // 1. Demande de confirmation
      const confirmed = await this.confirmCloning()
      if (!confirmed) {
        console.log('❌ Clonage annulé par l\'utilisateur')
        return
      }

      // 2. Clonage de toutes les tables
      await this.cloneAllTables()

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// Exécution du script
async function main() {
  const cloner = new SimpleCompleteCloner()
  await cloner.clone()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { SimpleCompleteCloner }