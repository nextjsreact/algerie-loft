/**
 * CLONAGE ESSENTIEL - TABLES CRITIQUES UNIQUEMENT
 * ===============================================
 *
 * Script qui se concentre sur les tables essentielles:
 * - currencies, categories, zone_areas, internet_connection_types, payment_methods
 * - loft_owners, profiles, lofts
 * - Crée les tables manquantes et copie les données
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function essentialClone() {
  try {
    console.log('🚀 CLONAGE ESSENTIEL - TABLES CRITIQUES')

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

    // Tables essentielles à cloner
    const essentialTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods',
      'loft_owners', 'profiles', 'lofts'
    ]

    let totalRecords = 0
    let successCount = 0
    let errorCount = 0

    // Étape 1: Vérifier l'état actuel de DEV
    console.log('\n📋 ÉTAPE 1: ÉTAT ACTUEL DE DEV')
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
          console.log(`📊 ${tableName}: table absente`)
        }
      } catch (error) {
        console.log(`📊 ${tableName}: table absente`)
      }
    }

    // Étape 2: Suppression complète des données en DEV
    console.log('\n📋 ÉTAPE 2: SUPPRESSION DES DONNÉES DEV')
    console.log('='.repeat(60))

    for (const tableName of essentialTables) {
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

    // Étape 3: Clonage des données de référence d'abord
    console.log('\n📋 ÉTAPE 3: CLONAGE DES DONNÉES DE RÉFÉRENCE')
    console.log('='.repeat(60))

    const referenceTables = ['currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods']

    for (const tableName of referenceTables) {
      try {
        console.log(`📥 ${tableName}...`)

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

        // Nettoyer les données si nécessaire
        const cleanedData = data.map((record, index) => {
          const cleaned = { ...record }

          // Nettoyer les champs requis
          if (tableName === 'internet_connection_types') {
            if (!cleaned.name) cleaned.name = `Type ${index + 1}`
          }

          return cleaned
        })

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
          console.warn(`⚠️ ${tableName}: HTTP ${insertResponse.status} - ${errorText}`)
          errorCount++
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur - ${error}`)
        errorCount++
      }
    }

    // Étape 4: Clonage des propriétaires
    console.log('\n📋 ÉTAPE 4: CLONAGE DES PROPRIÉTAIRES')
    console.log('='.repeat(60))

    try {
      const response = await fetch(`${prodUrl}/rest/v1/loft_owners?select=*`, {
        headers: {
          'Authorization': `Bearer ${prodKey}`,
          'apikey': prodKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const owners = await response.json() as any[]
        console.log(`✅ loft_owners: ${owners.length} propriétaires trouvés`)

        if (owners.length > 0) {
          const cleanedOwners = owners.map((owner, index) => ({
            ...owner,
            name: owner.name || `Propriétaire ${index + 1}`,
            email: owner.email || `owner${index + 1}@localhost`
          }))

          const insertResponse = await fetch(`${devUrl}/rest/v1/loft_owners`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanedOwners)
          })

          if (insertResponse.ok) {
            console.log('✅ loft_owners: copiés avec succès')
            totalRecords += cleanedOwners.length
            successCount++
          } else {
            const errorText = await insertResponse.text()
            console.warn(`⚠️ loft_owners: HTTP ${insertResponse.status} - ${errorText}`)
            errorCount++
          }
        }
      }
    } catch (error) {
      console.error('❌ loft_owners: erreur -', error)
      errorCount++
    }

    // Étape 5: Clonage des profils
    console.log('\n📋 ÉTAPE 5: CLONAGE DES PROFILS')
    console.log('='.repeat(60))

    try {
      const response = await fetch(`${prodUrl}/rest/v1/profiles?select=*`, {
        headers: {
          'Authorization': `Bearer ${prodKey}`,
          'apikey': prodKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const profiles = await response.json() as any[]
        console.log(`✅ profiles: ${profiles.length} profils trouvés`)

        if (profiles.length > 0) {
          const cleanedProfiles = profiles.map((profile, index) => ({
            ...profile,
            email: profile.email || `user${index + 1}@localhost`,
            full_name: profile.full_name || `Utilisateur ${index + 1}`
          }))

          const insertResponse = await fetch(`${devUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanedProfiles)
          })

          if (insertResponse.ok) {
            console.log('✅ profiles: copiés avec succès')
            totalRecords += cleanedProfiles.length
            successCount++
          } else {
            const errorText = await insertResponse.text()
            console.warn(`⚠️ profiles: HTTP ${insertResponse.status} - ${errorText}`)
            errorCount++
          }
        }
      }
    } catch (error) {
      console.error('❌ profiles: erreur -', error)
      errorCount++
    }

    // Étape 6: Clonage des LOFTS (les plus importants)
    console.log('\n📋 ÉTAPE 6: CLONAGE DES LOFTS')
    console.log('='.repeat(60))

    try {
      const response = await fetch(`${prodUrl}/rest/v1/lofts?select=*`, {
        headers: {
          'Authorization': `Bearer ${prodKey}`,
          'apikey': prodKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const lofts = await response.json() as any[]
        console.log(`✅ lofts: ${lofts.length} lofts trouvés`)

        if (lofts.length > 0) {
          const cleanedLofts = lofts.map((loft, index) => ({
            ...loft,
            name: loft.name || `Loft ${index + 1}`,
            address: loft.address || `Adresse ${index + 1}`,
            price_per_month: loft.price_per_month || 50000,
            status: loft.status || 'available',
            company_percentage: loft.company_percentage || 50,
            owner_percentage: loft.owner_percentage || 50
          }))

          console.log('📝 Insertion des lofts...')

          const insertResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanedLofts)
          })

          if (insertResponse.ok) {
            console.log('✅ lofts: TOUS COPIÉS AVEC SUCCÈS!')
            totalRecords += cleanedLofts.length
            successCount++
          } else {
            const errorText = await insertResponse.text()
            console.error(`❌ lofts: HTTP ${insertResponse.status} - ${errorText}`)

            // Insertion individuelle
            console.log('🔄 Tentative d\'insertion individuelle...')
            let successCount = 0

            for (let i = 0; i < cleanedLofts.length; i++) {
              try {
                const singleResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${devKey}`,
                    'apikey': devKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(cleanedLofts[i])
                })

                if (singleResponse.ok) {
                  successCount++
                  console.log(`✅ Loft ${i + 1}/${lofts.length}: ${cleanedLofts[i].name}`)
                }
              } catch (error) {
                console.warn(`⚠️ Loft ${i + 1}/${lofts.length}: erreur`)
              }
            }

            console.log(`✅ Insertion individuelle: ${successCount}/${lofts.length} lofts copiés`)
            totalRecords += successCount
            successCount++
          }
        }
      }
    } catch (error) {
      console.error('❌ lofts: erreur -', error)
      errorCount++
    }

    // Étape 7: Vérification finale
    console.log('\n📋 ÉTAPE 7: VÉRIFICATION FINALE')
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

    console.log('\n🎉 CLONAGE ESSENTIEL TERMINÉ!')
    console.log('💡 Votre base de développement contient maintenant les tables essentielles')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

essentialClone()