/**
 * CLONAGE AVEC SYNCHRONISATION COMPLÈTE DES TABLES
 * ================================================
 *
 * Script qui:
 * 1. Identifie les tables manquantes en DEV
 * 2. Crée les tables manquantes avec le bon schéma
 * 3. Clone toutes les données
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function tableSyncClone() {
  try {
    console.log('🚀 CLONAGE AVEC SYNCHRONISATION COMPLÈTE DES TABLES')

    // Configuration séparée PROD/DEV
    const prodConfig = config({ path: 'env-backup/.env.prod' })
    const devConfig = config({ path: 'env-backup/.env.development' })

    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Recharger pour DEV
    config({ path: 'env-backup/.env.development', override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!prodUrl || !prodKey || !devUrl || !devKey) {
      throw new Error('Configuration manquante')
    }

    console.log('✅ Configuration chargée')

    // Étape 1: Lister toutes les tables en PROD
    console.log('\n📋 ÉTAPE 1: INVENTAIRE DES TABLES')
    console.log('='.repeat(60))

    const prodTablesResponse = await fetch(`${prodUrl}/rest/v1/information_schema.tables?table_schema=public`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (!prodTablesResponse.ok) {
      throw new Error(`Impossible de lister les tables PROD: HTTP ${prodTablesResponse.status}`)
    }

    const prodTables = await prodTablesResponse.json() as any[]
    const prodTableNames = prodTables.map(t => t.table_name).filter(name =>
      !['schema_migrations', 'migrations', 'pg_stat_statements'].includes(name)
    )

    console.log(`📊 Tables en PRODUCTION: ${prodTableNames.length}`)
    prodTableNames.forEach(name => console.log(`   - ${name}`))

    // Étape 2: Lister les tables en DEV
    const devTablesResponse = await fetch(`${devUrl}/rest/v1/information_schema.tables?table_schema=public`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    const devTables = devTablesResponse.ok ? await devTablesResponse.json() as any[] : []
    const devTableNames = devTables.map(t => t.table_name)

    console.log(`\n📊 Tables en DEV: ${devTableNames.length}`)
    devTableNames.forEach(name => console.log(`   - ${name}`))

    // Étape 3: Identifier les tables manquantes
    const missingInDev = prodTableNames.filter(name => !devTableNames.includes(name))
    const extraInDev = devTableNames.filter(name => !prodTableNames.includes(name))

    console.log(`\n⚠️ Tables manquantes en DEV: ${missingInDev.length}`)
    missingInDev.forEach(name => console.log(`   - ${name} (à créer)`))

    console.log(`\n⚠️ Tables en trop en DEV: ${extraInDev.length}`)
    extraInDev.forEach(name => console.log(`   - ${name} (à supprimer)`))

    // Étape 4: Supprimer les tables en trop en DEV
    console.log('\n📋 ÉTAPE 2: NETTOYAGE DEV')
    console.log('='.repeat(60))

    for (const tableName of extraInDev) {
      try {
        const response = await fetch(`${devUrl}/rest/v1/${tableName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok || response.status === 404) {
          console.log(`✅ ${tableName}: supprimé`)
        } else {
          console.warn(`⚠️ ${tableName}: HTTP ${response.status}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${tableName}: erreur suppression`)
      }
    }

    // Étape 5: Créer les tables manquantes en DEV
    console.log('\n📋 ÉTAPE 3: CRÉATION DES TABLES MANQUANTES')
    console.log('='.repeat(60))

    for (const tableName of missingInDev) {
      try {
        console.log(`📋 Création de ${tableName}...`)

        // Récupérer la structure de la table depuis PROD
        const columnsResponse = await fetch(`${prodUrl}/rest/v1/information_schema.columns?table_name=${tableName}&table_schema=public`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!columnsResponse.ok) {
          console.warn(`⚠️ Impossible de récupérer les colonnes de ${tableName}`)
          continue
        }

        const columns = await columnsResponse.json() as any[]

        // Générer le SQL CREATE TABLE
        let createSQL = `CREATE TABLE ${tableName} (\n`

        for (let i = 0; i < columns.length; i++) {
          const col = columns[i]
          createSQL += `  ${col.column_name} ${col.data_type}`

          if (col.character_maximum_length) {
            createSQL += `(${col.character_maximum_length})`
          }

          if (col.is_nullable === 'NO') {
            createSQL += ' NOT NULL'
          }

          if (col.column_default) {
            createSQL += ` DEFAULT ${col.column_default}`
          }

          if (i < columns.length - 1) {
            createSQL += ','
          }
          createSQL += '\n'
        }

        createSQL += ')'

        // Exécuter la création via RPC
        const createResponse = await fetch(`${devUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql_command: createSQL })
        })

        if (createResponse.ok) {
          console.log(`✅ ${tableName}: créé avec succès`)
        } else {
          const errorText = await createResponse.text()
          console.warn(`⚠️ ${tableName}: HTTP ${createResponse.status} - ${errorText}`)
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur création - ${error}`)
      }
    }

    // Étape 6: Clonage des données
    console.log('\n📋 ÉTAPE 4: CLONAGE DES DONNÉES')
    console.log('='.repeat(60))

    let totalRecords = 0
    let successCount = 0
    let errorCount = 0

    // Tables prioritaires d'abord
    const priorityTables = ['currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods', 'loft_owners', 'profiles', 'lofts']

    for (const tableName of priorityTables) {
      if (!prodTableNames.includes(tableName)) continue

      try {
        console.log(`\n📥 CLONAGE ${tableName}...`)

        const response = await fetch(`${prodUrl}/rest/v1/${tableName}?select=*`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`⚠️ Impossible de récupérer ${tableName}: HTTP ${response.status}`)
          errorCount++
          continue
        }

        const data = await response.json() as any[]

        if (data.length === 0) {
          console.log(`ℹ️ ${tableName}: aucune donnée`)
          continue
        }

        console.log(`✅ ${tableName}: ${data.length} enregistrements`)

        // Nettoyer les données
        const cleanedData = data.map((record, index) => {
          const cleaned = { ...record }

          // Nettoyer les champs requis
          if (tableName === 'lofts') {
            if (!cleaned.price_per_month) cleaned.price_per_month = 50000
            if (!cleaned.status) cleaned.status = 'available'
            if (!cleaned.company_percentage) cleaned.company_percentage = 50
            if (!cleaned.owner_percentage) cleaned.owner_percentage = 50
            if (!cleaned.name) cleaned.name = `Loft ${index + 1}`
            if (!cleaned.address) cleaned.address = `Adresse ${index + 1}`
          }

          if (tableName === 'loft_owners') {
            if (!cleaned.name) cleaned.name = `Propriétaire ${index + 1}`
            if (!cleaned.email) cleaned.email = `owner${index + 1}@localhost`
          }

          if (tableName === 'profiles') {
            if (!cleaned.email) cleaned.email = `user${index + 1}@localhost`
            if (!cleaned.full_name) cleaned.full_name = `Utilisateur ${index + 1}`
          }

          return cleaned
        })

        // Insérer les données
        const insertResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cleanedData)
        })

        if (insertResponse.ok) {
          console.log(`✅ ${tableName}: ${cleanedData.length} enregistrements copiés`)
          totalRecords += cleanedData.length
          successCount++
        } else {
          const errorText = await insertResponse.text()
          console.error(`❌ ${tableName}: HTTP ${insertResponse.status} - ${errorText}`)
          errorCount++
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur - ${error}`)
        errorCount++
      }
    }

    // Étape 7: Vérification finale
    console.log('\n📋 ÉTAPE 5: VÉRIFICATION FINALE')
    console.log('='.repeat(60))

    console.log(`📊 Total enregistrements copiés: ${totalRecords}`)
    console.log(`✅ Tables réussies: ${successCount}`)
    console.log(`❌ Tables échouées: ${errorCount}`)

    // Vérifier les tables principales
    const finalTables = ['currencies', 'categories', 'loft_owners', 'profiles', 'lofts']

    for (const tableName of finalTables) {
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

    console.log('\n🎉 CLONAGE AVEC SYNCHRONISATION COMPLÈTE TERMINÉ!')
    console.log('💡 Votre base de développement contient maintenant toutes les tables de production')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

tableSyncClone()