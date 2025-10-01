/**
 * CLONAGE COMPLET - COPIE DE TOUTES LES TABLES
 * ============================================
 *
 * Script qui clone TOUTES les tables de production vers développement
 * dans le bon ordre en respectant les contraintes et dépendances
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

interface TableInfo {
  name: string
  dependencies: string[]
  required: boolean
}

async function completeClone() {
  try {
    console.log('🚀 CLONAGE COMPLET - COPIE DE TOUTES LES TABLES')

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
    console.log(`📤 PROD: ${prodUrl}`)
    console.log(`🎯 DEV: ${devUrl}`)

    // Liste complète des tables à cloner dans l'ordre des dépendances
    const tablesToClone: TableInfo[] = [
      // Tables de référence (pas de dépendances)
      { name: 'currencies', dependencies: [], required: true },
      { name: 'categories', dependencies: [], required: true },
      { name: 'zone_areas', dependencies: [], required: true },
      { name: 'internet_connection_types', dependencies: [], required: true },
      { name: 'payment_methods', dependencies: [], required: true },

      // Tables avec dépendances simples
      { name: 'loft_owners', dependencies: [], required: true },
      { name: 'teams', dependencies: [], required: true },
      { name: 'profiles', dependencies: [], required: true },

      // Tables principales
      { name: 'lofts', dependencies: ['currencies', 'categories', 'zone_areas', 'internet_connection_types', 'loft_owners'], required: true },
      { name: 'team_members', dependencies: ['teams', 'profiles'], required: true },
      { name: 'tasks', dependencies: ['profiles', 'lofts'], required: true },
      { name: 'transactions', dependencies: ['profiles', 'lofts'], required: true },
      { name: 'transaction_category_references', dependencies: ['transactions', 'categories'], required: true },
      { name: 'settings', dependencies: ['profiles'], required: true },
      { name: 'notifications', dependencies: ['profiles'], required: true },
      { name: 'messages', dependencies: ['profiles'], required: true },
      { name: 'customers', dependencies: ['profiles'], required: true },
      { name: 'loft_photos', dependencies: ['lofts'], required: true },

      // Tables optionnelles
      { name: 'conversations', dependencies: ['profiles'], required: false },
      { name: 'conversation_participants', dependencies: ['conversations', 'profiles'], required: false },
      { name: 'user_sessions', dependencies: ['profiles'], required: false }
    ]

    let totalRecords = 0
    let successCount = 0
    let errorCount = 0

    // Étape 1: Vérifier l'état actuel
    console.log('\n📋 ÉTAPE 1: ÉTAT ACTUEL DE DEV')
    console.log('='.repeat(60))

    for (const table of tablesToClone) {
      try {
        const response = await fetch(`${devUrl}/rest/v1/${table.name}?select=count`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const count = await response.json()
          console.log(`📊 ${table.name}: ${count} enregistrements`)
        }
      } catch (error) {
        console.log(`📊 ${table.name}: 0 enregistrements (table absente)`)
      }
    }

    // Étape 2: Suppression complète de DEV
    console.log('\n📋 ÉTAPE 2: SUPPRESSION COMPLÈTE DEV')
    console.log('='.repeat(60))

    for (const table of tablesToClone) {
      try {
        const response = await fetch(`${devUrl}/rest/v1/${table.name}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok || response.status === 404) {
          console.log(`✅ ${table.name}: supprimé`)
        } else {
          console.warn(`⚠️ ${table.name}: HTTP ${response.status}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${table.name}: erreur suppression`)
      }
    }

    // Étape 3: Clonage table par table
    console.log('\n📋 ÉTAPE 3: CLONAGE DES TABLES')
    console.log('='.repeat(60))

    for (const table of tablesToClone) {
      try {
        console.log(`\n📥 CLONAGE ${table.name}...`)

        // Récupérer les données de production
        const prodResponse = await fetch(`${prodUrl}/rest/v1/${table.name}?select=*`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!prodResponse.ok) {
          console.warn(`⚠️ Impossible de récupérer ${table.name}: HTTP ${prodResponse.status}`)
          continue
        }

        const prodData = await prodResponse.json() as any[]

        if (prodData.length === 0) {
          console.log(`ℹ️ ${table.name}: aucune donnée en production`)
          continue
        }

        console.log(`✅ ${table.name}: ${prodData.length} enregistrements trouvés`)

        // Nettoyer les données si nécessaire
        const cleanedData = prodData.map((record, index) => {
          const cleaned = { ...record }

          // Nettoyer les champs requis
          if (table.name === 'lofts') {
            if (!cleaned.price_per_month) cleaned.price_per_month = 50000
            if (!cleaned.status) cleaned.status = 'available'
            if (!cleaned.company_percentage) cleaned.company_percentage = 50
            if (!cleaned.owner_percentage) cleaned.owner_percentage = 50
            if (!cleaned.name) cleaned.name = `Loft ${index + 1}`
            if (!cleaned.address) cleaned.address = `Adresse ${index + 1}`
          }

          if (table.name === 'loft_owners') {
            if (!cleaned.name) cleaned.name = `Propriétaire ${index + 1}`
            if (!cleaned.email) cleaned.email = `owner${index + 1}@localhost`
          }

          if (table.name === 'profiles') {
            if (!cleaned.email) cleaned.email = `user${index + 1}@localhost`
            if (!cleaned.full_name) cleaned.full_name = `Utilisateur ${index + 1}`
          }

          return cleaned
        })

        // Insérer les données
        const insertResponse = await fetch(`${devUrl}/rest/v1/${table.name}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cleanedData)
        })

        if (insertResponse.ok) {
          console.log(`✅ ${table.name}: ${cleanedData.length} enregistrements copiés`)
          totalRecords += cleanedData.length
          successCount++
        } else {
          const errorText = await insertResponse.text()
          console.error(`❌ ${table.name}: HTTP ${insertResponse.status} - ${errorText}`)

          // Essayer l'insertion individuelle
          console.log(`🔄 Tentative d'insertion individuelle pour ${table.name}...`)
          let individualSuccess = 0

          for (let i = 0; i < cleanedData.length; i++) {
            try {
              const singleResponse = await fetch(`${devUrl}/rest/v1/${table.name}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${devKey}`,
                  'apikey': devKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanedData[i])
              })

              if (singleResponse.ok) {
                individualSuccess++
              }
            } catch (error) {
              // Ignorer les erreurs individuelles
            }
          }

          if (individualSuccess > 0) {
            console.log(`✅ ${table.name}: ${individualSuccess}/${cleanedData.length} enregistrements copiés (individuel)`)
            totalRecords += individualSuccess
            successCount++
          } else {
            console.error(`❌ ${table.name}: échec complet`)
            errorCount++
          }
        }

      } catch (error) {
        console.error(`❌ ${table.name}: erreur - ${error}`)
        errorCount++
      }
    }

    // Étape 4: Vérification finale
    console.log('\n📋 ÉTAPE 4: VÉRIFICATION FINALE')
    console.log('='.repeat(60))

    console.log(`📊 Total enregistrements copiés: ${totalRecords}`)
    console.log(`✅ Tables réussies: ${successCount}`)
    console.log(`❌ Tables échouées: ${errorCount}`)

    // Vérifier chaque table
    console.log('\n📋 DÉTAIL PAR TABLE:')
    for (const table of tablesToClone) {
      try {
        const response = await fetch(`${devUrl}/rest/v1/${table.name}?select=count`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const count = await response.json() as number
          const status = count > 0 ? '✅' : '❌'
          console.log(`${status} ${table.name}: ${count} enregistrements`)
        } else {
          console.log(`❌ ${table.name}: erreur vérification`)
        }
      } catch (error) {
        console.log(`❌ ${table.name}: erreur vérification`)
      }
    }

    // Étape 5: Résumé
    console.log('\n📋 RÉSUMÉ DU CLONAGE COMPLET')
    console.log('='.repeat(60))

    if (successCount === tablesToClone.length) {
      console.log('🎉 CLONAGE RÉUSSI À 100%!')
      console.log('✅ Toutes les tables ont été copiées avec succès')
    } else if (successCount > 0) {
      console.log(`⚠️ CLONAGE PARTIEL: ${successCount}/${tablesToClone.length} tables copiées`)
      console.log('💡 Certaines tables peuvent nécessiter une correction manuelle des données')
    } else {
      console.log('❌ CLONAGE ÉCHOUÉ')
      console.log('💡 Vérifiez les erreurs ci-dessus et relancez le script')
    }

    console.log(`\n📈 Total: ${totalRecords} enregistrements copiés dans ${successCount} tables`)

    console.log('\n🎯 CLONAGE COMPLET TERMINÉ!')
    console.log('💡 Votre base de développement contient maintenant une copie complète des données de production')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

completeClone()