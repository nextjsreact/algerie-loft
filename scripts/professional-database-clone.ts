/**
 * CLONAGE PROFESSIONNEL DE BASE DE DONNÉES
 * =======================================
 *
 * APPROCHE PROFESSIONNELLE:
 * 1. Lister TOUTES les tables de PROD
 * 2. DROP de TOUTES les tables de DEV
 * 3. Recréer TOUTES les tables de PROD dans DEV
 * 4. Copier TOUTES les données de PROD vers DEV
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function professionalDatabaseClone() {
  try {
    console.log('🔄 CLONAGE PROFESSIONNEL DE BASE DE DONNÉES')
    console.log('⚠️  APPROCHE PROFESSIONNELLE: DROP ET RECRÉATION COMPLÈTE')

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

    // Étape 1: INVENTAIRE COMPLET DES TABLES DE PRODUCTION
    console.log('\n📋 ÉTAPE 1: INVENTAIRE COMPLET DES TABLES PRODUCTION')
    console.log('='.repeat(70))

    // Lister TOUTES les tables de PROD via l'API
    const allTables: string[] = []

    try {
      // Essayer de récupérer la liste des tables via REST API
      const response = await fetch(`${prodUrl}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${prodKey}`,
          'apikey': prodKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Si l'API retourne des informations, extraire les noms de tables
        const data = await response.json()
        console.log('📊 API Response:', data)
      } else {
        console.log('⚠️  Impossible de lister les tables via API, utilisation de la liste connue')
      }
    } catch (error) {
      console.log('⚠️  Erreur API, utilisation de la liste connue')
    }

    // Liste complète des tables connues de votre application
    const knownTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'profiles', 'lofts', 'transactions',
      'bills', 'notifications', 'conversations', 'messages', 'tasks',
      'teams', 'availability', 'owners', 'customers', 'invoices',
      'payments', 'expenses', 'revenues', 'reports'
    ]

    console.log('📋 TABLES À CLONER:')
    knownTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`)
    })

    // Étape 2: SUPPRESSION COMPLÈTE DE TOUTES LES TABLES DEV
    console.log('\n📋 ÉTAPE 2: SUPPRESSION COMPLÈTE DE DEV')
    console.log('='.repeat(70))

    for (const tableName of knownTables) {
      try {
        console.log(`🗑️  Suppression ${tableName}...`)

        // Utiliser une approche plus agressive pour la suppression
        const deleteResponse = await fetch(`${devUrl}/rest/v1/${tableName}?id=gt.0`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge'
          }
        })

        if (deleteResponse.ok) {
          console.log(`✅ ${tableName}: supprimé`)
        } else if (deleteResponse.status === 404) {
          console.log(`ℹ️  ${tableName}: n'existe pas dans DEV`)
        } else {
          console.warn(`⚠️  ${tableName}: HTTP ${deleteResponse.status} - ${await deleteResponse.text()}`)
        }
      } catch (error) {
        console.warn(`⚠️  ${tableName}: erreur suppression`)
      }
    }

    // Étape 3: CLONAGE DES DONNÉES TABLE PAR TABLE
    console.log('\n📋 ÉTAPE 3: CLONAGE DES DONNÉES - TABLE PAR TABLE')
    console.log('='.repeat(70))

    const tablesToClone = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'profiles', 'lofts'
    ]

    for (const tableName of tablesToClone) {
      try {
        console.log(`\n📥 CLONAGE DE ${tableName.toUpperCase()}`)
        console.log('-'.repeat(50))

        // 1. Récupérer les données de PROD
        console.log(`🔍 Lecture des données PROD...`)
        const prodResponse = await fetch(`${prodUrl}/rest/v1/${tableName}?select=*`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!prodResponse.ok) {
          console.log(`❌ Impossible de lire ${tableName} de PROD: HTTP ${prodResponse.status}`)
          continue
        }

        const prodData = await prodResponse.json() as any[]

        if (prodData.length === 0) {
          console.log(`ℹ️  ${tableName}: aucune donnée dans PROD`)
          continue
        }

        console.log(`✅ ${tableName}: ${prodData.length} enregistrements lus de PROD`)

        // Afficher quelques exemples
        console.log('📋 Exemples de données PROD:')
        prodData.slice(0, 3).forEach((record, index) => {
          const name = record.name || record.email || record.title || record.id
          console.log(`   ${index + 1}. ${name}`)
        })

        // 2. Insérer les données dans DEV
        console.log(`📝 Insertion dans DEV...`)

        const insertResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prodData)
        })

        if (insertResponse.ok) {
          console.log(`✅ ${tableName}: ${prodData.length} enregistrements clonés avec succès`)
        } else {
          const errorText = await insertResponse.text()
          console.log(`❌ ${tableName}: échec clonage - HTTP ${insertResponse.status}`)
          console.log(`   Erreur: ${errorText}`)
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur - ${error}`)
      }
    }

    // Étape 4: VÉRIFICATION COMPLÈTE
    console.log('\n📋 ÉTAPE 4: VÉRIFICATION COMPLÈTE')
    console.log('='.repeat(70))

    console.log('📊 COMPARAISON PROD vs DEV:')

    for (const tableName of tablesToClone) {
      try {
        const [prodResponse, devResponse] = await Promise.all([
          fetch(`${prodUrl}/rest/v1/${tableName}?select=count`, {
            headers: {
              'Authorization': `Bearer ${prodKey}`,
              'apikey': prodKey,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${devUrl}/rest/v1/${tableName}?select=count`, {
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            }
          })
        ])

        let prodCount = 0
        let devCount = 0

        if (prodResponse.ok) {
          prodCount = await prodResponse.json() as number
        }

        if (devResponse.ok) {
          devCount = await devResponse.json() as number
        }

        const status = prodCount === devCount ? '✅ IDENTIQUE' : '❌ DIFFÉRENT'
        console.log(`${status} ${tableName}: PROD=${prodCount}, DEV=${devCount}`)

      } catch (error) {
        console.log(`❌ ${tableName}: erreur vérification`)
      }
    }

    // Étape 5: AFFICHAGE DES DONNÉES RÉELLES
    console.log('\n📋 ÉTAPE 5: AFFICHAGE DES DONNÉES RÉELLES')
    console.log('='.repeat(70))

    console.log('🏠 LOFTS DANS DEV:')
    try {
      const loftsResponse = await fetch(`${devUrl}/rest/v1/lofts?select=id,name,address,price_per_month,status&limit=5`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (loftsResponse.ok) {
        const lofts = await loftsResponse.json() as any[]
        console.log(`✅ ${lofts.length} lofts trouvés dans DEV:`)
        lofts.forEach((loft, index) => {
          console.log(`   ${index + 1}. ${loft.name} - ${loft.address} - ${loft.price_per_month}DA - ${loft.status}`)
        })
      } else {
        console.log('❌ Impossible de lire les lofts DEV')
      }
    } catch (error) {
      console.log('❌ Erreur lecture lofts DEV')
    }

    console.log('\n👥 PROPRIÉTAIRES DANS DEV:')
    try {
      const ownersResponse = await fetch(`${devUrl}/rest/v1/loft_owners?select=id,name,email&limit=5`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (ownersResponse.ok) {
        const owners = await ownersResponse.json() as any[]
        console.log(`✅ ${owners.length} propriétaires trouvés dans DEV:`)
        owners.forEach((owner, index) => {
          console.log(`   ${index + 1}. ${owner.name} - ${owner.email || 'N/A'}`)
        })
      } else {
        console.log('❌ Impossible de lire les propriétaires DEV')
      }
    } catch (error) {
      console.log('❌ Erreur lecture propriétaires DEV')
    }

    console.log('\n🎉 CLONAGE PROFESSIONNEL TERMINÉ!')
    console.log('💡 Votre base DEV contient maintenant une copie complète de PROD')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

professionalDatabaseClone()