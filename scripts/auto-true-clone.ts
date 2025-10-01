#!/usr/bin/env tsx
/**
 * CLONAGE AUTOMATIQUE COMPLET - SANS CONFIRMATION
 * ===============================================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

class AutoTrueCloner {
  private prodClient: any
  private devClient: any

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    console.log('🔧 Initialisation des clients...')

    // Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.prodClient = createClient(prodUrl, prodKey)

    // Development
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.devClient = createClient(devUrl, devKey)

    // Protection critique
    if (devUrl.includes('mhngbluefyucoesgcjoy')) {
      throw new Error('🚫 ERREUR: URL de PRODUCTION détectée dans DEV!')
    }

    console.log('✅ Clients initialisés')
    console.log('🤖 Mode automatique - Pas de confirmation requise')
  }

  /**
   * Récupération des tables connues
   */
  private getKnownTables(): string[] {
    return [
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
      'notifications'
      // Exclure customers et loft_photos qui n'existent pas dans DEV
    ]
  }

  /**
   * Nettoyage complet d'une table
   */
  private async clearTable(tableName: string): Promise<void> {
    try {
      console.log(`🗑️ Nettoyage ${tableName}...`)
      
      const { error } = await this.devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error && !error.message.includes('No rows found')) {
        console.warn(`⚠️ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName} nettoyé`)
      }
    } catch (error) {
      console.warn(`⚠️ Erreur nettoyage ${tableName}: ${error}`)
    }
  }

  /**
   * Adaptation des données pour DEV
   */
  private adaptDataForDev(data: any[], tableName: string): any[] {
    return data.map(record => {
      const adapted = { ...record }

      // Supprimer les colonnes problématiques connues
      const columnsToRemove: { [key: string]: string[] } = {
        'currencies': ['decimal_digits', 'updated_at'],
        'categories': ['updated_at'],
        'zone_areas': ['updated_at'],
        'internet_connection_types': ['updated_at'],
        'payment_methods': ['updated_at'],
        'loft_owners': ['updated_at'],
        'teams': ['updated_at'],
        'profiles': ['updated_at', 'email_verified'],
        'tasks': ['updated_at', 'amount'],
        'transactions': ['updated_at', 'type'],
        'transaction_category_references': ['updated_at'],
        'settings': ['updated_at'],
        'notifications': ['updated_at', 'message_key']
      }

      const toRemove = columnsToRemove[tableName] || []
      toRemove.forEach(col => delete adapted[col])

      // Valeurs par défaut
      if (tableName === 'lofts' && !adapted.price_per_month) {
        adapted.price_per_month = 0
      }

      return adapted
    })
  }

  /**
   * Anonymisation des données
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
   * Copie complète d'une table
   */
  private async copyTableCompletely(tableName: string): Promise<number> {
    console.log(`\n📋 Clonage complet: ${tableName}`)
    console.log('-'.repeat(40))

    try {
      // 1. Récupérer toutes les données de PROD
      console.log('📥 Récupération PROD...')
      const { data: prodData, error: prodError } = await this.prodClient
        .from(tableName)
        .select('*')

      if (prodError) {
        throw new Error(`Erreur PROD: ${prodError.message}`)
      }

      if (!prodData || prodData.length === 0) {
        console.log('ℹ️ Table vide dans PROD')
        return 0
      }

      console.log(`✅ ${prodData.length} enregistrements récupérés`)

      // 2. Nettoyer complètement DEV
      await this.clearTable(tableName)

      // 3. Adapter les données
      console.log('🔄 Adaptation des données...')
      const adaptedData = this.adaptDataForDev(prodData, tableName)

      // 4. Anonymiser
      const finalData = this.anonymizeData(adaptedData, tableName)

      // 5. Insérer par lots
      console.log('📤 Insertion des données...')
      const batchSize = 50
      let insertedCount = 0

      for (let i = 0; i < finalData.length; i += batchSize) {
        const batch = finalData.slice(i, i + batchSize)
        
        const { error: insertError } = await this.devClient
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.warn(`⚠️ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
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
          process.stdout.write(`\r📤 Progression: ${insertedCount}/${finalData.length}`)
        }
      }

      console.log('') // Nouvelle ligne
      console.log(`✅ ${tableName}: ${insertedCount} enregistrements copiés`)
      return insertedCount

    } catch (error) {
      console.error(`❌ Erreur ${tableName}: ${error}`)
      return 0
    }
  }

  /**
   * Clonage automatique complet
   */
  public async performAutoClone(): Promise<void> {
    console.log('🚀 CLONAGE AUTOMATIQUE COMPLET')
    console.log('='.repeat(50))

    const startTime = Date.now()
    const tables = this.getKnownTables()
    let totalRecords = 0
    const results: { table: string, records: number }[] = []

    console.log(`📋 ${tables.length} tables à cloner`)

    for (const table of tables) {
      const records = await this.copyTableCompletely(table)
      totalRecords += records
      results.push({ table, records })
    }

    // Résumé final
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log('\n🎉 CLONAGE AUTOMATIQUE TERMINÉ!')
    console.log('='.repeat(50))
    console.log(`⏱️ Durée totale: ${duration}s`)
    console.log(`📈 Total des enregistrements: ${totalRecords}`)
    console.log(`📋 Tables traitées: ${tables.length}`)

    console.log('\n📊 RÉSULTATS PAR TABLE:')
    results.forEach(result => {
      const icon = result.records > 0 ? '✅' : 'ℹ️'
      console.log(`${icon} ${result.table}: ${result.records} enregistrements`)
    })

    const successful = results.filter(r => r.records > 0).length
    const successRate = (successful / tables.length) * 100

    console.log('\n🎯 ÉVALUATION:')
    if (successRate >= 80) {
      console.log('🎉 EXCELLENT - Clonage très réussi')
    } else if (successRate >= 60) {
      console.log('✅ BON - Clonage réussi')
    } else {
      console.log('⚠️ PARTIEL - Quelques problèmes')
    }

    console.log(`📈 Taux de réussite: ${successRate.toFixed(1)}%`)

    console.log('\n💡 PROCHAINES ÉTAPES:')
    console.log('• Testez: npm run dev')
    console.log('• Validez: npm run validate:clone-quick')
    console.log('• Mot de passe DEV: dev123')
  }
}

// Exécution automatique
async function main() {
  try {
    const cloner = new AutoTrueCloner()
    await cloner.performAutoClone()
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
    process.exit(1)
  }
}

main().catch(console.error)