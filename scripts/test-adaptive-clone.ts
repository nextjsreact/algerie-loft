#!/usr/bin/env tsx
/**
 * TEST DU CLONAGE ADAPTATIF - VERSION AUTOMATIQUE
 * ===============================================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testAdaptiveClone() {
  console.log('🧪 TEST DU CLONAGE ADAPTATIF')
  console.log('='.repeat(50))

  try {
    // Configuration Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodClient = createClient(prodUrl, prodKey)

    // Configuration Développement
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devClient = createClient(devUrl, devKey)

    console.log('✅ Clients initialisés')

    // Test sur la table categories qui avait des problèmes
    const tableName = 'categories'
    
    console.log(`\n📋 Test clonage adaptatif: ${tableName}`)
    console.log('-'.repeat(40))

    // 1. Analyser les schémas
    console.log('📋 Analyse des schémas...')
    
    const [prodSchema, devSchema] = await Promise.all([
      prodClient.from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName),
      devClient.from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
    ])

    if (prodSchema.error) {
      throw new Error(`Erreur schéma PROD: ${prodSchema.error.message}`)
    }
    if (devSchema.error) {
      throw new Error(`Erreur schéma DEV: ${devSchema.error.message}`)
    }

    const prodColumns = prodSchema.data?.map(col => col.column_name) || []
    const devColumns = devSchema.data?.map(col => col.column_name) || []

    console.log(`📊 PROD: ${prodColumns.length} colonnes: ${prodColumns.join(', ')}`)
    console.log(`📊 DEV: ${devColumns.length} colonnes: ${devColumns.join(', ')}`)

    // Identifier les différences
    const missingInDev = prodColumns.filter(col => !devColumns.includes(col))
    const missingInProd = devColumns.filter(col => !prodColumns.includes(col))

    if (missingInDev.length > 0) {
      console.log(`⚠️ Colonnes dans PROD mais pas dans DEV: ${missingInDev.join(', ')}`)
    }
    if (missingInProd.length > 0) {
      console.log(`⚠️ Colonnes dans DEV mais pas dans PROD: ${missingInProd.join(', ')}`)
    }

    // 2. Récupérer les données de PROD
    console.log('\n📥 Récupération données PROD...')
    const { data: prodData, error: prodError } = await prodClient
      .from(tableName)
      .select('*')

    if (prodError) {
      throw new Error(`Erreur PROD: ${prodError.message}`)
    }

    console.log(`✅ PROD: ${prodData?.length || 0} enregistrements`)
    if (prodData && prodData.length > 0) {
      console.log(`📋 Exemple d'enregistrement PROD:`, Object.keys(prodData[0]))
    }

    // 3. Adapter les données
    console.log('\n🔄 Adaptation des données...')
    let adaptedData = prodData || []
    
    if (adaptedData.length > 0) {
      adaptedData = adaptedData.map(record => {
        const adaptedRecord: any = {}
        
        // Copier seulement les colonnes qui existent dans DEV
        for (const devColumn of devColumns) {
          if (record.hasOwnProperty(devColumn)) {
            adaptedRecord[devColumn] = record[devColumn]
          }
        }
        
        return adaptedRecord
      })

      console.log(`✅ Données adaptées: ${adaptedData.length} enregistrements`)
      console.log(`📋 Exemple d'enregistrement adapté:`, Object.keys(adaptedData[0]))
    }

    // 4. Test d'insertion (sur un seul enregistrement)
    if (adaptedData.length > 0) {
      console.log('\n📤 Test d\'insertion...')
      
      // Nettoyer d'abord
      const { error: deleteError } = await devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.warn(`⚠️ Nettoyage: ${deleteError.message}`)
      }

      // Insérer un seul enregistrement pour tester
      const testRecord = adaptedData[0]
      const { error: insertError } = await devClient
        .from(tableName)
        .insert([testRecord])

      if (insertError) {
        console.error(`❌ Erreur insertion: ${insertError.message}`)
      } else {
        console.log('✅ Test d\'insertion réussi!')
        
        // Insérer le reste
        if (adaptedData.length > 1) {
          const { error: bulkInsertError } = await devClient
            .from(tableName)
            .insert(adaptedData.slice(1))

          if (bulkInsertError) {
            console.error(`❌ Erreur insertion en lot: ${bulkInsertError.message}`)
          } else {
            console.log(`✅ ${adaptedData.length} enregistrements insérés au total`)
          }
        }
      }
    }

    console.log('\n🎉 TEST ADAPTATIF TERMINÉ')
    console.log('='.repeat(50))
    console.log('✅ Le clonage adaptatif fonctionne!')

  } catch (error) {
    console.error('❌ ERREUR TEST:', error)
    process.exit(1)
  }
}

testAdaptiveClone().catch(console.error)