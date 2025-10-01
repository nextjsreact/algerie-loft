#!/usr/bin/env tsx
/**
 * TEST DIRECT DU CLONAGE - SANS ANALYSE DE SCHÉMA
 * ===============================================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testDirectClone() {
  console.log('🧪 TEST DIRECT DU CLONAGE')
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

    // Test sur plusieurs tables
    const tablesToTest = ['currencies', 'categories', 'lofts']
    
    for (const tableName of tablesToTest) {
      console.log(`\n📋 Test: ${tableName}`)
      console.log('-'.repeat(30))

      try {
        // 1. Récupérer les données de PROD
        console.log('📥 Récupération PROD...')
        const { data: prodData, error: prodError } = await prodClient
          .from(tableName)
          .select('*')
          .limit(1) // Juste un échantillon

        if (prodError) {
          console.error(`❌ PROD: ${prodError.message}`)
          continue
        }

        console.log(`✅ PROD: ${prodData?.length || 0} enregistrements`)
        
        if (prodData && prodData.length > 0) {
          const prodColumns = Object.keys(prodData[0])
          console.log(`📊 Colonnes PROD: ${prodColumns.join(', ')}`)

          // 2. Tester l'insertion dans DEV
          console.log('📤 Test insertion DEV...')
          
          // D'abord, essayer d'insérer tel quel
          const { error: insertError } = await devClient
            .from(tableName)
            .insert([prodData[0]])

          if (insertError) {
            console.warn(`⚠️ Insertion directe échouée: ${insertError.message}`)
            
            // Essayer de deviner quelles colonnes poser problème
            if (insertError.message.includes('updated_at')) {
              console.log('🔄 Tentative sans updated_at...')
              const { updated_at, ...recordWithoutUpdatedAt } = prodData[0]
              
              const { error: retryError } = await devClient
                .from(tableName)
                .insert([recordWithoutUpdatedAt])

              if (retryError) {
                console.error(`❌ Retry échouée: ${retryError.message}`)
              } else {
                console.log('✅ Insertion réussie sans updated_at!')
              }
            }
          } else {
            console.log('✅ Insertion directe réussie!')
          }
        }

      } catch (error) {
        console.error(`❌ Erreur ${tableName}:`, error)
      }
    }

    console.log('\n🎉 TEST DIRECT TERMINÉ')

  } catch (error) {
    console.error('❌ ERREUR TEST:', error)
    process.exit(1)
  }
}

testDirectClone().catch(console.error)