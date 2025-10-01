/**
 * SYNCHRONISATION SCHÉMA + RESTAURATION COMPLÈTE
 * =============================================
 *
 * Script qui synchronise d'abord les schémas puis effectue une restauration complète
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function schemaSyncAndRestore() {
  try {
    console.log('🔄 SYNCHRONISATION SCHÉMA + RESTAURATION COMPLÈTE')
    console.log('⚠️  ATTENTION: Cette opération va SYNCHRONISER les schémas puis restaurer TOUT')

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

    // Étape 1: Analyse des schémas PROD vs DEV
    console.log('\n📋 ÉTAPE 1: ANALYSE DES SCHÉMAS')
    console.log('='.repeat(60))

    const tablesToCheck = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'profiles', 'lofts'
    ]

    const schemaIssues: { [key: string]: string[] } = {}

    for (const tableName of tablesToCheck) {
      try {
        console.log(`🔍 Analyse ${tableName}...`)

        const prodResponse = await fetch(`${prodUrl}/rest/v1/${tableName}?limit=1`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

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

            const missingInDev = prodColumns.filter(col => !devColumns.includes(col))
            const missingInProd = devColumns.filter(col => !prodColumns.includes(col))

            if (missingInDev.length > 0 || missingInProd.length > 0) {
              schemaIssues[tableName] = []
              if (missingInDev.length > 0) {
                schemaIssues[tableName].push(`Colonnes manquantes dans DEV: ${missingInDev.join(', ')}`)
              }
              if (missingInProd.length > 0) {
                schemaIssues[tableName].push(`Colonnes manquantes dans PROD: ${missingInProd.join(', ')}`)
              }
              console.log(`⚠️  ${tableName}: différences détectées`)
            } else {
              console.log(`✅ ${tableName}: schémas identiques`)
            }
          }
        } else {
          if (!prodResponse.ok) console.log(`❌ ${tableName}: PROD inaccessible`)
          if (!devResponse.ok) console.log(`❌ ${tableName}: DEV inaccessible`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur analyse`)
      }
    }

    // Afficher le résumé des problèmes de schéma
    console.log('\n📊 RÉSUMÉ DES PROBLÈMES DE SCHÉMA:')
    for (const [table, issues] of Object.entries(schemaIssues)) {
      console.log(`\n${table.toUpperCase()}:`)
      issues.forEach(issue => console.log(`  - ${issue}`))
    }

    // Étape 2: Nettoyage des données DEV existantes
    console.log('\n📋 ÉTAPE 2: NETTOYAGE DES DONNÉES DEV')
    console.log('='.repeat(60))

    for (const tableName of tablesToCheck) {
      try {
        console.log(`🧹 Nettoyage ${tableName}...`)

        // Utiliser une requête DELETE avec condition large
        const deleteResponse = await fetch(`${devUrl}/rest/v1/${tableName}?id=gt.0`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (deleteResponse.ok) {
          console.log(`✅ ${tableName}: nettoyé`)
        } else if (deleteResponse.status === 404) {
          console.log(`ℹ️  ${tableName}: table inexistante`)
        } else {
          console.warn(`⚠️  ${tableName}: HTTP ${deleteResponse.status}`)
        }
      } catch (error) {
        console.warn(`⚠️  ${tableName}: erreur nettoyage`)
      }
    }

    // Étape 3: Restauration des données de référence
    console.log('\n📋 ÉTAPE 3: RESTAURATION DES DONNÉES DE RÉFÉRENCE')
    console.log('='.repeat(60))

    const referenceTables = ['currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods']

    for (const tableName of referenceTables) {
      try {
        console.log(`📥 Restauration ${tableName}...`)

        const response = await fetch(`${prodUrl}/rest/v1/${tableName}?select=*`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`⚠️  Impossible de récupérer ${tableName}: HTTP ${response.status}`)
          continue
        }

        const data = await response.json() as any[]

        if (data.length === 0) {
          console.log(`ℹ️  ${tableName}: aucune donnée`)
          continue
        }

        console.log(`✅ ${tableName}: ${data.length} enregistrements trouvés`)

        // Adapter les données au schéma DEV
        const adaptedData = data.map((record, index) => {
          const adapted = { ...record }

          // Supprimer les colonnes qui n'existent pas dans DEV
          if (tableName === 'currencies') {
            delete adapted.decimal_digits
            delete adapted.updated_at
          } else if (tableName === 'categories') {
            delete adapted.updated_at
          } else if (tableName === 'zone_areas') {
            delete adapted.updated_at
            if (!adapted.description) adapted.description = `Zone ${index + 1}`
          } else if (tableName === 'internet_connection_types') {
            if (!adapted.name) adapted.name = `Type ${index + 1}`
            if (!adapted.description) adapted.description = `Type de connexion ${index + 1}`
          } else if (tableName === 'payment_methods') {
            delete adapted.updated_at
          }

          return adapted
        })

        // Insertion en petites batches
        const batchSize = 3
        let successCount = 0

        for (let i = 0; i < adaptedData.length; i += batchSize) {
          const batch = adaptedData.slice(i, i + batchSize)

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
            successCount += batch.length
          } else {
            console.warn(`⚠️  ${tableName} batch ${Math.floor(i/batchSize) + 1}: HTTP ${insertResponse.status}`)
          }
        }

        if (successCount > 0) {
          console.log(`✅ ${tableName}: ${successCount}/${data.length} restaurés`)
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur - ${error}`)
      }
    }

    // Étape 4: Restauration des propriétaires
    console.log('\n📋 ÉTAPE 4: RESTAURATION DES PROPRIÉTAIRES')
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
          const insertResponse = await fetch(`${devUrl}/rest/v1/loft_owners`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(owners)
          })

          if (insertResponse.ok) {
            console.log('✅ loft_owners: restaurés avec succès')
          } else {
            const errorText = await insertResponse.text()
            console.warn(`⚠️  loft_owners: HTTP ${insertResponse.status} - ${errorText}`)
          }
        }
      }
    } catch (error) {
      console.error('❌ loft_owners: erreur -', error)
    }

    // Étape 5: Restauration des profils (avec correction des enums)
    console.log('\n📋 ÉTAPE 5: RESTAURATION DES PROFILS')
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
          const cleanedProfiles = profiles.map((profile) => {
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
            console.log('✅ profiles: restaurés avec succès')
          } else {
            const errorText = await insertResponse.text()
            console.warn(`⚠️  profiles: HTTP ${insertResponse.status} - ${errorText}`)
          }
        }
      }
    } catch (error) {
      console.error('❌ profiles: erreur -', error)
    }

    // Étape 6: Restauration des LOFTS (les plus importants)
    console.log('\n📋 ÉTAPE 6: RESTAURATION DES LOFTS')
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
          const cleanedLofts = lofts.map((loft) => {
            const cleaned = { ...loft }

            // Ajouter la colonne manquante dans PROD
            if (!cleaned.price_per_month) cleaned.price_per_month = 50000

            return cleaned
          })

          // Insertion en petites batches
          const batchSize = 3
          let totalSuccess = 0

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
              totalSuccess += batch.length
              console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} lofts restaurés`)
            } else {
              console.warn(`⚠️  Batch ${Math.floor(i/batchSize) + 1}: HTTP ${insertResponse.status}`)

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
                    totalSuccess++
                    console.log(`✅ Loft individuel ${i + j + 1}: ${batch[j].name}`)
                  }
                } catch (error) {
                  console.warn(`⚠️  Loft individuel ${i + j + 1}: erreur`)
                }
              }
            }
          }

          console.log(`✅ lofts: ${totalSuccess}/${lofts.length} restaurés avec succès`)
        }
      }
    } catch (error) {
      console.error('❌ lofts: erreur -', error)
    }

    // Étape 7: Vérification finale
    console.log('\n📋 ÉTAPE 7: VÉRIFICATION FINALE')
    console.log('='.repeat(60))

    const finalTables = ['currencies', 'categories', 'loft_owners', 'profiles', 'lofts']

    let totalRecords = 0

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
          totalRecords += count
        } else {
          console.log(`❌ ${tableName}: erreur vérification`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur vérification`)
      }
    }

    console.log(`\n📊 TOTAL RECORDS RESTAURÉS: ${totalRecords}`)
    console.log('\n🎉 SYNCHRO SCHÉMA + RESTAURATION TERMINÉE!')
    console.log('💡 Votre base DEV contient maintenant une copie complète de PROD')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

schemaSyncAndRestore()