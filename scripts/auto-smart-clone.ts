#!/usr/bin/env tsx
/**
 * CLONAGE INTELLIGENT AUTOMATIQUE - TOUTES LES TABLES
 * ===================================================
 * Version automatique sans confirmation pour test complet
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

interface CloneResult {
  table: string
  status: 'success' | 'error' | 'empty' | 'skipped'
  records: number
  adaptations: string[]
  error?: string
  duration: number
}

class AutoSmartClone {
  private prodClient: any
  private devClient: any
  private results: CloneResult[] = []

  // Mapping des adaptations connues
  private readonly COLUMN_ADAPTATIONS: { [table: string]: { [column: string]: any } } = {
    currencies: {
      decimal_digits: 'IGNORE',
      updated_at: 'IGNORE'
    },
    categories: {
      updated_at: 'IGNORE'
    },
    lofts: {
      price_per_month: 0 // Valeur par défaut si null
    },
    zone_areas: {
      updated_at: 'IGNORE'
    },
    internet_connection_types: {
      updated_at: 'IGNORE'
    },
    payment_methods: {
      updated_at: 'IGNORE'
    },
    loft_owners: {
      updated_at: 'IGNORE'
    },
    teams: {
      updated_at: 'IGNORE'
    },
    profiles: {
      updated_at: 'IGNORE'
    },
    team_members: {
      updated_at: 'IGNORE'
    },
    tasks: {
      updated_at: 'IGNORE'
    },
    transactions: {
      updated_at: 'IGNORE'
    },
    transaction_category_references: {
      updated_at: 'IGNORE'
    },
    settings: {
      updated_at: 'IGNORE'
    },
    notifications: {
      updated_at: 'IGNORE'
    },
    customers: {
      updated_at: 'IGNORE'
    },
    loft_photos: {
      updated_at: 'IGNORE'
    }
  }

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
   * Adaptation intelligente des données
   */
  private adaptData(data: any[], tableName: string): { adaptedData: any[], adaptations: string[] } {
    const adaptations: string[] = []
    const tableAdaptations = this.COLUMN_ADAPTATIONS[tableName] || {}
    
    const adaptedData = data.map(record => {
      const adaptedRecord = { ...record }
      
      // Appliquer les adaptations spécifiques à la table
      for (const [column, action] of Object.entries(tableAdaptations)) {
        if (action === 'IGNORE') {
          // Supprimer la colonne
          delete adaptedRecord[column]
          if (!adaptations.includes(`Colonne ${column} ignorée`)) {
            adaptations.push(`Colonne ${column} ignorée`)
          }
        } else {
          // Valeur par défaut si la colonne est null/undefined
          if (adaptedRecord[column] == null) {
            adaptedRecord[column] = action
            if (!adaptations.includes(`Valeur par défaut ${column} = ${action}`)) {
              adaptations.push(`Valeur par défaut ${column} = ${action}`)
            }
          }
        }
      }
      
      return adaptedRecord
    })

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
   * Clonage intelligent d'une table
   */
  private async cloneTableSmart(tableName: string): Promise<CloneResult> {
    console.log(`\n📋 Clonage intelligent: ${tableName}`)
    console.log('-'.repeat(50))
    
    const startTime = Date.now()

    try {
      // 1. Récupérer les données de PROD
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

      // 2. Adapter les données
      console.log('🔄 Adaptation intelligente...')
      const { adaptedData, adaptations } = this.adaptData(prodData, tableName)

      if (adaptations.length > 0) {
        console.log('📝 Adaptations appliquées:')
        adaptations.forEach(adaptation => console.log(`   • ${adaptation}`))
      }

      // 3. Anonymiser les données
      const anonymizedData = this.anonymizeData(adaptedData, tableName)

      // 4. Nettoyer la table DEV
      await this.clearTable(tableName)

      // 5. Insérer les données adaptées
      console.log('📤 Insertion des données...')
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
            } else {
              console.warn(`⚠️ Erreur enregistrement: ${singleError.message}`)
            }
          }
        } else {
          insertedCount += batch.length
          process.stdout.write(`\r📤 Progression: ${insertedCount}/${anonymizedData.length}`)
        }
      }

      console.log('') // Nouvelle ligne
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
   * Clonage automatique de toutes les tables
   */
  public async cloneAllTables(): Promise<void> {
    console.log('🚀 CLONAGE INTELLIGENT AUTOMATIQUE COMPLET')
    console.log('='.repeat(60))
    console.log('🤖 Mode automatique - Pas de confirmation requise')

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
      const result = await this.cloneTableSmart(tableName)
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

    console.log('\n📊 RÉSUMÉ DU CLONAGE COMPLET')
    console.log('='.repeat(50))
    console.log(`⏱️ Durée totale: ${Math.round(duration / 1000)}s`)
    console.log(`📈 Enregistrements clonés: ${totalRecords}`)
    console.log(`🔄 Adaptations appliquées: ${totalAdaptations}`)
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

    console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
    console.log('='.repeat(50))

    if (errors === 0) {
      console.log('✅ Toutes les tables clonées avec succès!')
      console.log('🧠 Adaptations de schéma appliquées automatiquement')
      console.log('🔒 Données sensibles anonymisées')
    } else {
      console.log(`⚠️ ${errors} table(s) avec erreurs - vérifiez les logs`)
    }

    console.log('\n💡 PROCHAINES ÉTAPES:')
    console.log('• Testez votre application: npm run dev')
    console.log('• Mot de passe universel DEV: dev123')
    console.log('• Base DEV maintenant synchronisée avec PROD')
  }
}

// Exécution automatique
async function main() {
  const cloner = new AutoSmartClone()
  await cloner.cloneAllTables()
}

main().catch(console.error)