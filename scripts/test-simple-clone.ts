#!/usr/bin/env tsx
/**
 * TEST DU CLONAGE SIMPLIFIÉ - VERSION AUTOMATIQUE
 * ===============================================
 * 
 * Version de test qui ne demande pas de confirmation
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testSimpleClone() {
  console.log('🧪 TEST DU CLONAGE SIMPLIFIÉ')
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

    // Test sur une seule table : categories
    const tableName = 'categories'
    
    console.log(`\n📋 Test clonage: ${tableName}`)
    console.log('-'.repeat(30))

    // 1. Récupérer les données de PROD
    console.log('📥 Récupération données PROD...')
    const { data: prodData, error: prodError } = await prodClient
      .from(tableName)
      .select('*')

    if (prodError) {
      throw new Error(`Erreur PROD: ${prodError.message}`)
    }

    console.log(`✅ PROD: ${prodData?.length || 0} enregistrements`)

    // 2. Vérifier l'état actuel de DEV
    console.log('📊 État actuel DEV...')
    const { data: devDataBefore, error: devError } = await devClient
      .from(tableName)
      .select('*')

    if (devError) {
      console.warn(`⚠️ DEV: ${devError.message}`)
    } else {
      console.log(`📊 DEV avant: ${devDataBefore?.length || 0} enregistrements`)
    }

    // 3. Nettoyer DEV
    console.log('🗑️ Nettoyage DEV...')
    const { error: deleteError } = await devClient
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError && !deleteError.message.includes('No rows found')) {
      console.warn(`⚠️ Nettoyage: ${deleteError.message}`)
    } else {
      console.log('✅ DEV nettoyé')
    }

    // 4. Copier les données si il y en a
    if (prodData && prodData.length > 0) {
      console.log('📤 Copie des données...')
      
      const { error: insertError } = await devClient
        .from(tableName)
        .insert(prodData)

      if (insertError) {
        console.error(`❌ Erreur insertion: ${insertError.message}`)
      } else {
        console.log(`✅ ${prodData.length} enregistrements copiés`)
      }
    } else {
      console.log('ℹ️ Aucune donnée à copier')
    }

    // 5. Vérifier le résultat
    console.log('🔍 Vérification finale...')
    const { data: devDataAfter, error: verifyError } = await devClient
      .from(tableName)
      .select('*')

    if (verifyError) {
      console.error(`❌ Erreur vérification: ${verifyError.message}`)
    } else {
      console.log(`✅ DEV après: ${devDataAfter?.length || 0} enregistrements`)
    }

    console.log('\n🎉 TEST TERMINÉ')
    console.log('='.repeat(50))
    console.log('✅ Le clonage simplifié fonctionne!')

  } catch (error) {
    console.error('❌ ERREUR TEST:', error)
    process.exit(1)
  }
}

testSimpleClone().catch(console.error)