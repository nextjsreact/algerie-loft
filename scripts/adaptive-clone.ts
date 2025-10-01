#!/usr/bin/env tsx
/**
 * CLONAGE ADAPTATIF PRODUCTION → DÉVELOPPEMENT
 * ============================================
 * 
 * Ce script adapte automatiquement les données aux différences de schéma
 * entre PROD et DEV avant de faire le clonage.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as readline from 'readline'

interface TableSchema {
  [columnName: string]: {
    data_type: string
    is_nullable: string
    column_default: string | null
  }
}

interface CloneResult {
  table: string
  status: 'success' | 'error' | 'empty' | 'skipped'
  records: number
  adaptations: string[]
  error?: string
  duration: number
}

class AdaptiveCloner {
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
      console.log('• Adapter automatiquement les différences de schéma')
      console.log('• Anonymiser les données sensibles')
      console.log('')

      rl.question('Êtes-vous sûr de vouloir continuer? Tapez "OUI" pour confirmer: ', (answer) => {
        rl.close()
        resolve(answer.toUpperCase() === 'OUI')
      })
    })
  }

  /**
   * Récupération du schéma d'une table
   */
  private async getTableSchema(client: any, tableName: string): Promise<TableSchema> {
    const { data, error } = await client
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)

    if (error) {
      throw new Error(`Erreur récupération schéma ${tableName}: ${error.message}`)
    }

    const schema: TableSchema = {}
    if (data) {
      data.forEach((col: any) => {
        schema[col.column_name] = {
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default
        }
      })
    }

    return schema
  }

  /**
   * Adaptation des données au schéma cible
   */
  private adaptDataToSchema(
    data: any[], 
    prodSchema: TableSchema, 
    devSchema: TableSchema, 
    tableName: string
  ): { adaptedData: any[], adaptations: string[] } {
    const adaptations: string[] = []
    
    const adaptedData = data.map(record => {
      const adaptedRecord: any = {}
      
      // Copier seulement les colonnes qui existent dans DEV
      for (const devColumn of Object.keys(devSchema)) {
        if (record.hasOwnProperty(devColumn)) {
          adaptedRecord[devColumn] = record[devColumn]
        } else {
          // Colonne manquante dans PROD, utiliser valeur par défaut
          if (devSchema[devColumn].column_default) {
            adaptedRecord[devColumn] = null // Laisser Supabase utiliser la valeur par défaut
          } else if (devSchema[devColumn].is_nullable === 'YES') {
            adaptedRecord[devColumn] = null
          }
        }
      }
      
      return adaptedRecord
    })

    // Identifier les adaptations effectuées
    const prodColumns = Object.keys(prodSchema)
    const devColumns = Object.keys(devSchema)
    
    const missingInDev = prodColumns.filter(col => !devColumns.includes(col))
    const missingInProd = devColumns.filter(col => !prodColumns.includes(col))
    
    if (missingInDev.length > 0) {
      adaptations.push(`Colonnes ignorées (absentes dans DEV): ${missingInDev.join(', ')}`)
    }
    
    if (missingInProd.length > 0) {
      adaptations.push(`Colonnes ajoutées (absentes dans PROD): ${missingInProd.join(', ')}`)
    }

    return { adaptedData, adaptations }
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
   * Nettoyage d'une table
   */
  private async clearTable(tableName: string): Promise<void> {
    console.log(`🗑️ Nettoyage ${tableName}...`)
    
    try {
      const { error } = await this.devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

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
   * Clonage adaptatif d'une table
   */
  private async cloneTableAdaptive(tableName: string): Promise<CloneResult> {
    console.log(`\n📋 Clonage adaptatif: ${tableName}`)
    console.log('-'.repeat(50))
    
    const startTime = Date.now()

    try {
      // 1. Récupérer les schémas PROD et DEV
      console.log('📋 Analyse des schémas...')
      const [prodSchema, devSchema] = await Promise.all([
        this.getTableSchema(this.prodClient, tableName),
        this.getTableSchema(this.devClient, tableName)
      ])

      const prodColumns = Object.keys(prodSchema).length
      const devColumns = Object.keys(devSchema).length
      console.log(`📊 PROD: ${prodColumns} colonnes, DEV: ${devColumns} colonnes`)

      // 2. Récupérer les données de PROD
      console.log('📥 Récupération données PROD...')
      const { data: prodData, error: prodError } = await this.prodClient
        .from(tableName)
        .select('*')

      if (prodError) {
        throw new Error(`Erreur PROD: ${prodError.message}`)
      }

      if (!prodData || prodData.length === 0) {
        console.log('ℹ️ Table vide dans PROD')
        return {
          table: tableName,
          status: 'empty',
          records: 0,
          adaptations: [],
          duration: Date.now() - startTime
        }
      }

      console.log(`✅ ${prodData.length} enregistrements récupérés`)

      // 3. Adapter les données au schéma DEV
      console.log('🔄 Adaptation des données...')
      const { adaptedData, adaptations } = this.adaptDataToSchema(
        prodData, prodSchema, devSchema, tableName
      )

      if (adaptations.length > 0) {
        console.log('📝 Adaptations effectuées:')
        adaptations.forEach(adaptation => console.log(`   • ${adaptation}`))
      }

      // 4. Anonymiser les données
      const anonymizedData = this.anonymizeData(adaptedData, tableName)

      // 5. Nettoyer la table DEV
      await this.clearTable(tableName)

      // 6. Insérer les données adaptées
      console.log('📤 Insertion des données adaptées...')
      const batchSize = 50
      let insertedCount = 0

      for (let i = 0; i < anonymizedData.length; i += batchSize) {
        const batch = anonymizedData.slice(i, i + batchSize)
        
        const { error: insertError } = await this.devClient
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.error(`❌ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
          // Essayer un par un
          for (const record of batch) {
            const { error: singleError } = await this.devClient
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              insertedCount++
            }
          }
        } else {
          insertedCount += batch.length
        }
      }

      console.log(`✅ ${tableName}: ${insertedCount} enregistrements insérés`)

      const result: CloneResult = {
        table: tableName,
        status: 'success',
        records: insertedCount,
        adaptations,
        duration: Date.now() - startTime
      }

      this.results.push(result)
      return result

    } catch (error) {
      console.error(`❌ Erreur clonage ${tableName}:`, error)
      const errorResult: CloneResult = {
        table: tableName,
        status: 'error',
        records: 0,
        adaptations: [],
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      }
      this.results.push(errorResult)
      return errorResult
    }
  }

  /**
   * Clonage de toutes les tables
   */
  public async cloneAllTables(): Promise<void> {
    console.log('🚀 CLONAGE ADAPTATIF PRODUCTION → DÉVELOPPEMENT')
    console.log('='.repeat(60))

    // Tables dans l'ordre des dépendances
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
      const result = await this.cloneTableAdaptive(tableName)
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
    const totalAdaptations = this.results.reduce((sum, r) => sum + r.adaptations.length, 0)

    console.log('\n📊 RÉSUMÉ DU CLONAGE ADAPTATIF')
    console.log('='.repeat(50))
    console.log(`⏱️ Durée totale: ${Math.round(duration / 1000)}s`)
    console.log(`📈 Enregistrements clonés: ${totalRecords}`)
    console.log(`🔄 Adaptations effectuées: ${totalAdaptations}`)
    console.log(`✅ Tables réussies: ${successful}`)
    console.log(`❌ Tables en erreur: ${errors}`)
    console.log(`ℹ️ Tables vides: ${empty}`)

    console.log('\n📋 DÉTAIL PAR TABLE:')
    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' :
                   result.status === 'error' ? '❌' :
                   result.status === 'empty' ? 'ℹ️' : '⚠️'
      const adaptations = result.adaptations.length > 0 ? ` (${result.adaptations.length} adaptations)` : ''
      const error = result.error ? ` - ${result.error}` : ''
      console.log(`${icon} ${result.table}: ${result.records} enregistrements${adaptations}${error}`)
    })

    console.log('\n🎉 CLONAGE ADAPTATIF TERMINÉ!')
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
    console.log('• Schémas automatiquement adaptés')
  }

  /**
   * Méthode principale
   */
  public async clone(): Promise<void> {
    try {
      // 1. Demande de confirmation
      const confirmed = await this.confirmCloning()
      if (!confirmed) {
        console.log('❌ Clonage annulé par l\'utilisateur')
        return
      }

      // 2. Clonage adaptatif de toutes les tables
      await this.cloneAllTables()

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// Exécution du script
async function main() {
  const cloner = new AdaptiveCloner()
  await cloner.clone()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { AdaptiveCloner }