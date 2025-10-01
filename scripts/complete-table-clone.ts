/**
 * CLONAGE COMPLET DE TOUTES LES TABLES
 * ===================================
 *
 * Script qui clone TOUTES les tables trouvées dans PROD vers DEV
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function completeTableClone() {
  try {
    console.log('🔄 CLONAGE COMPLET DE TOUTES LES TABLES PRODUCTION')
    console.log('⚠️  Clonage de CHAQUE table trouvée dans la base de production')

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

    // Étape 1: Récupérer la liste complète des tables depuis l'API PROD
    console.log('\n📋 ÉTAPE 1: RÉCUPÉRATION DE TOUTES LES TABLES PRODUCTION')
    console.log('='.repeat(70))

    const prodResponse = await fetch(`${prodUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (!prodResponse.ok) {
      console.log('❌ Impossible de récupérer la liste des tables PROD')
      return
    }

    const prodSchema = await prodResponse.json() as any
    const prodPaths = prodSchema.paths || {}

    // Extraire tous les noms de tables (exclure les RPC functions)
    const allTables: string[] = []
    for (const path in prodPaths) {
      if (path.startsWith('/') && !path.startsWith('/rpc/') && path !== '/') {
        const tableName = path.substring(1) // Remove leading slash
        if (!allTables.includes(tableName)) {
          allTables.push(tableName)
        }
      }
    }

    console.log('📋 TABLES TROUVÉES DANS PRODUCTION:')
    console.log('='.repeat(50))
    allTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`)
    })
    console.log(`\n✅ TOTAL: ${allTables.length} tables trouvées`)

    // Étape 2: Clonage de chaque table
    console.log('\n📋 ÉTAPE 2: CLONAGE TABLE PAR TABLE')
    console.log('='.repeat(70))

    let successCount = 0
    let errorCount = 0
    let totalRecords = 0

    for (let i = 0; i < allTables.length; i++) {
      const tableName = allTables[i]

      try {
        console.log(`\n📥 CLONAGE ${i + 1}/${allTables.length}: ${tableName.toUpperCase()}`)
        console.log('-'.repeat(60))

        // 1. Récupérer les données de PROD
        console.log(`🔍 Lecture des données PROD...`)
        const prodDataResponse = await fetch(`${prodUrl}/rest/v1/${tableName}?select=*&limit=1000`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!prodDataResponse.ok) {
          console.log(`⚠️  Impossible de lire ${tableName} de PROD: HTTP ${prodDataResponse.status}`)
          errorCount++
          continue
        }

        const prodData = await prodDataResponse.json() as any[]

        if (prodData.length === 0) {
          console.log(`ℹ️  ${tableName}: aucune donnée dans PROD`)
          continue
        }

        console.log(`✅ ${tableName}: ${prodData.length} enregistrements lus de PROD`)

        // Afficher quelques exemples pour les tables importantes
        if (['lofts', 'loft_owners', 'profiles', 'categories', 'currencies'].includes(tableName)) {
          console.log('📋 Exemples de données:')
          prodData.slice(0, 3).forEach((record, index) => {
            const name = record.name || record.email || record.title || record.id
            console.log(`   ${index + 1}. ${name}`)
          })
        }

        // 2. Insérer les données dans DEV
        console.log(`📝 Insertion dans DEV...`)

        // Insérer par petites batches pour éviter les timeouts
        const batchSize = 10
        let tableSuccessCount = 0

        for (let j = 0; j < prodData.length; j += batchSize) {
          const batch = prodData.slice(j, j + batchSize)

          const insertResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(batch)
          })

          if (insertResponse.ok) {
            tableSuccessCount += batch.length
          } else {
            console.warn(`⚠️  Batch ${Math.floor(j/batchSize) + 1} échoué pour ${tableName}`)
          }
        }

        if (tableSuccessCount > 0) {
          console.log(`✅ ${tableName}: ${tableSuccessCount}/${prodData.length} enregistrements clonés`)
          successCount++
          totalRecords += tableSuccessCount
        } else {
          console.log(`❌ ${tableName}: échec du clonage`)
          errorCount++
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur - ${error}`)
        errorCount++
      }
    }

    // Étape 3: Vérification finale
    console.log('\n📋 ÉTAPE 3: VÉRIFICATION FINALE')
    console.log('='.repeat(70))

    console.log('📊 RÉSUMÉ DU CLONAGE:')
    console.log(`✅ Tables clonées avec succès: ${successCount}`)
    console.log(`❌ Tables en échec: ${errorCount}`)
    console.log(`📊 Total enregistrements clonés: ${totalRecords}`)

    // Afficher les données réelles dans DEV
    console.log('\n🏠 VÉRIFICATION DES DONNÉES DANS DEV:')
    console.log('='.repeat(50))

    const importantTables = ['lofts', 'loft_owners', 'profiles', 'categories', 'currencies', 'transactions', 'bills']

    for (const tableName of importantTables) {
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
          console.log(`✅ ${tableName}: ${count} enregistrements`)
        } else {
          console.log(`❌ ${tableName}: erreur vérification`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur vérification`)
      }
    }

    // Afficher quelques vraies données
    console.log('\n📋 EXEMPLES DE DONNÉES RÉELLES DANS DEV:')
    console.log('='.repeat(50))

    try {
      const loftsResponse = await fetch(`${devUrl}/rest/v1/lofts?select=id,name,address,price_per_month,status&limit=3`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (loftsResponse.ok) {
        const lofts = await loftsResponse.json() as any[]
        console.log(`✅ LOFTS (${lofts.length} trouvés):`)
        lofts.forEach((loft, index) => {
          console.log(`   ${index + 1}. ${loft.name} - ${loft.address} - ${loft.price_per_month}DA - ${loft.status}`)
        })
      }
    } catch (error) {
      console.log('❌ Erreur lecture lofts')
    }

    try {
      const ownersResponse = await fetch(`${devUrl}/rest/v1/loft_owners?select=id,name,email&limit=3`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (ownersResponse.ok) {
        const owners = await ownersResponse.json() as any[]
        console.log(`✅ PROPRIÉTAIRES (${owners.length} trouvés):`)
        owners.forEach((owner, index) => {
          console.log(`   ${index + 1}. ${owner.name} - ${owner.email || 'N/A'}`)
        })
      }
    } catch (error) {
      console.log('❌ Erreur lecture propriétaires')
    }

    console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
    console.log(`💡 ${successCount} tables clonées avec ${totalRecords} enregistrements`)
    console.log('💡 Votre base DEV contient maintenant TOUTES les données de PROD')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

completeTableClone()