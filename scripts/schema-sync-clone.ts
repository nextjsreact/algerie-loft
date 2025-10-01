/**
 * SYNCHRONISATION DE SCHÉMA + CLONAGE
 * ===================================
 *
 * Script qui synchronise d'abord les schémas puis clone les données
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function schemaSyncClone() {
  try {
    console.log('🔄 SYNCHRONISATION SCHÉMA + CLONAGE')

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

    // Tables essentielles à cloner
    const essentialTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'profiles', 'lofts'
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

    // Étape 2: Suppression complète des données en DEV (avec vérification)
    console.log('\n📋 ÉTAPE 2: SUPPRESSION DES DONNÉES DEV')
    console.log('='.repeat(60))

    for (const tableName of essentialTables) {
      try {
        // D'abord vérifier si la table existe et a des données
        const checkResponse = await fetch(`${devUrl}/rest/v1/${tableName}?select=count`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (checkResponse.ok) {
          const count = await checkResponse.json() as number
          if (count > 0) {
            console.log(`🗑️ ${tableName}: suppression de ${count} enregistrements...`)

            const deleteResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${devKey}`,
                'apikey': devKey,
                'Content-Type': 'application/json'
              }
            })

            if (deleteResponse.ok) {
              console.log(`✅ ${tableName}: supprimé`)
            } else {
              console.warn(`⚠️ ${tableName}: HTTP ${deleteResponse.status}`)
            }
          } else {
            console.log(`ℹ️ ${tableName}: déjà vide`)
          }
        } else {
          console.log(`ℹ️ ${tableName}: table absente`)
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

        // Nettoyer les données selon les besoins du schéma DEV
        const cleanedData = data.map((record, index) => {
          const cleaned = { ...record }

          // Adapter aux schémas DEV
          if (tableName === 'currencies') {
            // DEV n'a pas decimal_digits et updated_at
            delete cleaned.decimal_digits
            delete cleaned.updated_at
          } else if (tableName === 'categories') {
            // DEV n'a pas updated_at
            delete cleaned.updated_at
          } else if (tableName === 'zone_areas') {
            // DEV n'a pas updated_at mais a description
            delete cleaned.updated_at
            if (!cleaned.description) cleaned.description = `Zone ${index + 1}`
          } else if (tableName === 'internet_connection_types') {
            // PROD n'a pas name et description, mais DEV les a
            if (!cleaned.name) cleaned.name = `Type ${index + 1}`
            if (!cleaned.description) cleaned.description = `Type de connexion ${index + 1}`
          } else if (tableName === 'payment_methods') {
            // DEV n'a pas updated_at
            delete cleaned.updated_at
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
          const cleanedProfiles = profiles.map((profile, index) => {
            const cleaned = { ...profile }

            // Adapter au schéma DEV (supprimer les colonnes manquantes)
            delete cleaned.password_hash
            delete cleaned.email_verified
            delete cleaned.reset_token
            delete cleaned.reset_token_expires
            delete cleaned.last_login

            // S'assurer que les champs requis existent
            if (!cleaned.email) cleaned.email = `user${index + 1}@localhost`
            if (!cleaned.full_name) cleaned.full_name = `Utilisateur ${index + 1}`

            return cleaned
          })

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
          const cleanedLofts = lofts.map((loft, index) => {
            const cleaned = { ...loft }

            // Adapter au schéma DEV (ajouter la colonne manquante dans PROD)
            if (!cleaned.price_per_month) cleaned.price_per_month = 50000

            // S'assurer que les champs requis existent
            if (!cleaned.name) cleaned.name = `Loft ${index + 1}`
            if (!cleaned.address) cleaned.address = `Adresse ${index + 1}`
            if (!cleaned.status) cleaned.status = 'available'
            if (!cleaned.company_percentage) cleaned.company_percentage = 50
            if (!cleaned.owner_percentage) cleaned.owner_percentage = 50

            return cleaned
          })

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

            // Insertion individuelle si échec en lot
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
                } else {
                  console.warn(`⚠️ Loft ${i + 1}/${lofts.length}: HTTP ${singleResponse.status}`)
                }
              } catch (error) {
                console.warn(`⚠️ Loft ${i + 1}/${lofts.length}: erreur`)
              }
            }

            console.log(`✅ Insertion individuelle: ${successCount}/${lofts.length} lofts copiés`)
            totalRecords += successCount
            if (successCount > 0) successCount++
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

    console.log('\n🎉 CLONAGE AVEC SYNCHRO SCHÉMA TERMINÉ!')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

schemaSyncClone()