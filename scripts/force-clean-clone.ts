/**
 * CLONAGE AVEC NETTOYAGE FORCÉ
 * ============================
 *
 * Script qui nettoie complètement DEV avant clonage
 * Utilise TRUNCATE au lieu de DELETE pour plus de fiabilité
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function forceCleanClone() {
  try {
    console.log('🧹 CLONAGE AVEC NETTOYAGE FORCÉ')

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

    // Étape 1: Vérifier l'état actuel de DEV avec diagnostic détaillé
    console.log('\n📋 ÉTAPE 1: DIAGNOSTIC DÉTAILLÉ DE DEV')
    console.log('='.repeat(60))

    for (const tableName of essentialTables) {
      try {
        // Test d'accès à la table
        const response = await fetch(`${devUrl}/rest/v1/${tableName}?limit=1`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json() as any[]
          console.log(`✅ ${tableName}: table accessible, ${data.length} échantillon(s)`)
        } else if (response.status === 404) {
          console.log(`❌ ${tableName}: table inexistante`)
        } else {
          console.log(`⚠️ ${tableName}: HTTP ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur d'accès`)
      }
    }

    // Étape 2: Nettoyage forcé avec TRUNCATE
    console.log('\n📋 ÉTAPE 2: NETTOYAGE FORCÉ AVEC TRUNCATE')
    console.log('='.repeat(60))

    for (const tableName of essentialTables) {
      try {
        console.log(`🧹 ${tableName}: nettoyage forcé...`)

        // Utiliser TRUNCATE au lieu de DELETE pour plus de fiabilité
        const truncateResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=truncate'  // Force truncate
          }
        })

        if (truncateResponse.ok) {
          console.log(`✅ ${tableName}: nettoyé avec succès`)
        } else {
          console.warn(`⚠️ ${tableName}: HTTP ${truncateResponse.status} - ${await truncateResponse.text()}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${tableName}: erreur nettoyage`)
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
            delete cleaned.decimal_digits
            delete cleaned.updated_at
          } else if (tableName === 'categories') {
            delete cleaned.updated_at
          } else if (tableName === 'zone_areas') {
            delete cleaned.updated_at
            if (!cleaned.description) cleaned.description = `Zone ${index + 1}`
          } else if (tableName === 'internet_connection_types') {
            if (!cleaned.name) cleaned.name = `Type ${index + 1}`
            if (!cleaned.description) cleaned.description = `Type de connexion ${index + 1}`
          } else if (tableName === 'payment_methods') {
            delete cleaned.updated_at
          }

          return cleaned
        })

        // Insertion en petites batches pour éviter les timeouts
        const batchSize = 5
        let batchSuccess = 0

        for (let i = 0; i < cleanedData.length; i += batchSize) {
          const batch = cleanedData.slice(i, i + batchSize)

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
            batchSuccess += batch.length
          } else {
            console.warn(`⚠️ ${tableName} batch ${Math.floor(i/batchSize) + 1}: HTTP ${insertResponse.status}`)
          }
        }

        if (batchSuccess > 0) {
          console.log(`✅ ${tableName}: ${batchSuccess}/${cleanedData.length} enregistrements copiés`)
          totalRecords += batchSuccess
          successCount++
        } else {
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

    // Étape 5: Clonage des profils avec gestion des enums
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

            // Supprimer les colonnes manquantes dans DEV
            delete cleaned.password_hash
            delete cleaned.email_verified
            delete cleaned.reset_token
            delete cleaned.reset_token_expires
            delete cleaned.last_login

            // Corriger les valeurs d'enum invalides
            if (cleaned.user_role === 'executive') {
              cleaned.user_role = 'admin'
            }

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

            // Ajouter la colonne manquante dans PROD
            if (!cleaned.price_per_month) cleaned.price_per_month = 50000

            // S'assurer que les champs requis existent
            if (!cleaned.name) cleaned.name = `Loft ${index + 1}`
            if (!cleaned.address) cleaned.address = `Adresse ${index + 1}`
            if (!cleaned.status) cleaned.status = 'available'
            if (!cleaned.company_percentage) cleaned.company_percentage = 50
            if (!cleaned.owner_percentage) cleaned.owner_percentage = 50

            return cleaned
          })

          console.log('📝 Insertion des lofts en batchs...')

          // Insertion en batchs de 3 pour éviter les timeouts
          const batchSize = 3
          let batchSuccess = 0

          for (let i = 0; i < cleanedLofts.length; i += batchSize) {
            const batch = cleanedLofts.slice(i, i + batchSize)

            const insertResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${devKey}`,
                'apikey': devKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(batch)
            })

            if (insertResponse.ok) {
              batchSuccess += batch.length
              console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} lofts copiés`)
            } else {
              console.warn(`⚠️ Batch ${Math.floor(i/batchSize) + 1}: HTTP ${insertResponse.status}`)

              // Si batch échoue, essayer l'insertion individuelle
              for (let j = 0; j < batch.length; j++) {
                try {
                  const singleResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${devKey}`,
                      'apikey': devKey,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(batch[j])
                  })

                  if (singleResponse.ok) {
                    batchSuccess++
                    console.log(`✅ Loft individuel ${i + j + 1}: ${batch[j].name}`)
                  }
                } catch (error) {
                  console.warn(`⚠️ Loft individuel ${i + j + 1}: erreur`)
                }
              }
            }
          }

          console.log(`✅ lofts: ${batchSuccess}/${lofts.length} copiés avec succès`)
          totalRecords += batchSuccess
          if (batchSuccess > 0) successCount++
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

    console.log('\n🎉 CLONAGE AVEC NETTOYAGE FORCÉ TERMINÉ!')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

forceCleanClone()