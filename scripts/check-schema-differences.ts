/**
 * VÉRIFICATION DES DIFFÉRENCES DE SCHÉMA PROD/DEV
 * ==============================================
 *
 * Script pour identifier les différences de schéma entre PROD et DEV
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function checkSchemaDifferences() {
  try {
    console.log('🔍 VÉRIFICATION DES SCHÉMAS PROD/DEV')

    // Configuration
    const prodConfig = config({ path: 'env-backup/.env.prod' })
    const devConfig = config({ path: 'env-backup/.env.development' })

    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    config({ path: 'env-backup/.env.development', override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!prodUrl || !prodKey || !devUrl || !devKey) {
      throw new Error('Configuration manquante')
    }

    console.log('✅ Configuration chargée')

    // Tables essentielles à vérifier
    const essentialTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'profiles', 'lofts'
    ]

    console.log('\n📋 COMPARAISON DES SCHÉMAS')
    console.log('='.repeat(60))

    for (const tableName of essentialTables) {
      console.log(`\n🔍 TABLE: ${tableName.toUpperCase()}`)
      console.log('-'.repeat(40))

      try {
        // Récupérer le schéma PROD
        const prodResponse = await fetch(`${prodUrl}/rest/v1/${tableName}?limit=1`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        // Récupérer le schéma DEV
        const devResponse = await fetch(`${devUrl}/rest/v1/${tableName}?limit=1`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (prodResponse.ok && devResponse.ok) {
          const prodData = await prodResponse.json() as any[]
          const devData = await devResponse.json() as any[]

          if (prodData.length > 0 && devData.length > 0) {
            const prodColumns = Object.keys(prodData[0])
            const devColumns = Object.keys(devData[0])

            console.log(`📊 PROD: ${prodColumns.length} colonnes`)
            console.log(`📊 DEV: ${devColumns.length} colonnes`)

            // Colonnes manquantes dans DEV
            const missingInDev = prodColumns.filter(col => !devColumns.includes(col))
            if (missingInDev.length > 0) {
              console.log(`❌ Colonnes manquantes dans DEV: ${missingInDev.join(', ')}`)
            }

            // Colonnes manquantes dans PROD
            const missingInProd = devColumns.filter(col => !prodColumns.includes(col))
            if (missingInProd.length > 0) {
              console.log(`❌ Colonnes manquantes dans PROD: ${missingInProd.join(', ')}`)
            }

            if (missingInDev.length === 0 && missingInProd.length === 0) {
              console.log(`✅ Schémas identiques`)
            }
          } else {
            console.log(`⚠️ Pas de données pour comparer`)
          }
        } else {
          if (!prodResponse.ok) {
            console.log(`❌ PROD: HTTP ${prodResponse.status}`)
          }
          if (!devResponse.ok) {
            console.log(`❌ DEV: HTTP ${devResponse.status}`)
          }
        }

      } catch (error) {
        console.error(`❌ Erreur pour ${tableName}:`, error)
      }
    }

    console.log('\n📋 VÉRIFICATION DES DONNÉES EXISTANTES')
    console.log('='.repeat(60))

    for (const tableName of essentialTables) {
      try {
        const response = await fetch(`${devUrl}/rest/v1/${tableName}?select=count`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const count = await response.json() as number
          console.log(`📊 ${tableName}: ${count} enregistrements`)
        } else {
          console.log(`❌ ${tableName}: HTTP ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur`)
      }
    }

    console.log('\n🎉 VÉRIFICATION TERMINÉE!')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

checkSchemaDifferences()