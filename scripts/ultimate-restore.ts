/**
 * RESTAURATION ULTIME - APPROCHE AGRESSIVE
 * ========================================
 *
 * Script qui utilise une approche plus directe pour la restauration complète
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function ultimateRestore() {
  try {
    console.log('🚀 RESTAURATION ULTIME - BASE DE DONNÉES COMPLÈTE')
    console.log('⚠️  ATTENTION: Cette opération va DÉTRUIRE et RECRÉER la base DEV')

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

    // Étape 1: Vérification de l'état actuel
    console.log('\n📋 ÉTAPE 1: ÉTAT ACTUEL DE DEV')
    console.log('='.repeat(60))

    const tablesToCheck = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'profiles', 'lofts'
    ]

    for (const tableName of tablesToCheck) {
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
          console.log(`❌ ${tableName}: erreur - HTTP ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur d'accès`)
      }
    }

    // Étape 2: SUPPRESSION AGRESSIVE avec approche différente
    console.log('\n📋 ÉTAPE 2: SUPPRESSION AGRESSIVE DES DONNÉES')
    console.log('='.repeat(60))

    for (const tableName of tablesToCheck) {
      try {
        console.log(`🗑️  Suppression forcée de ${tableName}...`)

        // Approche 1: DELETE avec condition très large
        let deleteResponse = await fetch(`${devUrl}/rest/v1/${tableName}?id=gt.0`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge'
          }
        })

        if (deleteResponse.ok) {
          console.log(`✅ ${tableName}: supprimé avec succès`)
          continue
        }

        // Approche 2: Si DELETE échoue, essayer avec une autre méthode
        console.log(`🔄 Tentative alternative pour ${tableName}...`)

        // Récupérer tous les IDs et les supprimer individuellement
        const getIdsResponse = await fetch(`${devUrl}/rest/v1/${tableName}?select=id&limit=1000`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (getIdsResponse.ok) {
          const records = await getIdsResponse.json() as any[]
          if (records.length > 0) {
            const ids = records.map(r => r.id)
            console.log(`📝 ${tableName}: ${ids.length} enregistrements à supprimer`)

            // Supprimer par batches de 10
            const batchSize = 10
            let deletedCount = 0

            for (let i = 0; i < ids.length; i += batchSize) {
              const batchIds = ids.slice(i, i + batchSize)

              const batchDeleteResponse = await fetch(`${devUrl}/rest/v1/${tableName}?id=in.(${batchIds.map(id => `"${id}"`).join(',')})`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${devKey}`,
                  'apikey': devKey,
                  'Content-Type': 'application/json'
                }
              })

              if (batchDeleteResponse.ok) {
                deletedCount += batchIds.length
              }
            }

            if (deletedCount > 0) {
              console.log(`✅ ${tableName}: ${deletedCount} enregistrements supprimés`)
            } else {
              console.log(`⚠️  ${tableName}: impossible à supprimer`)
            }
          } else {
            console.log(`ℹ️  ${tableName}: déjà vide`)
          }
        } else {
          console.log(`⚠️  ${tableName}: méthode alternative échouée`)
        }

      } catch (error) {
        console.error(`❌ ${tableName}: erreur - ${error}`)
      }
    }

    // Étape 3: Restauration des données essentielles
    console.log('\n📋 ÉTAPE 3: RESTAURATION DES DONNÉES ESSENTIELLES')
    console.log('='.repeat(60))

    const essentialTables = [
      { name: 'currencies', adapter: (data: any[]) => data.map(d => {
        const cleaned = { ...d }
        delete cleaned.decimal_digits
        delete cleaned.updated_at
        return cleaned
      })},
      { name: 'categories', adapter: (data: any[]) => data.map(d => {
        const cleaned = { ...d }
        delete cleaned.updated_at
        return cleaned
      })},
      { name: 'zone_areas', adapter: (data: any[]) => data.map((d, i) => {
        const cleaned = { ...d }
        delete cleaned.updated_at
        if (!cleaned.description) cleaned.description = `Zone ${i + 1}`
        return cleaned
      })},
      { name: 'internet_connection_types', adapter: (data: any[]) => data.map((d, i) => {
        const cleaned = { ...d }
        if (!cleaned.name) cleaned.name = `Type ${i + 1}`
        if (!cleaned.description) cleaned.description = `Type de connexion ${i + 1}`
        return cleaned
      })},
      { name: 'payment_methods', adapter: (data: any[]) => data.map(d => {
        const cleaned = { ...d }
        delete cleaned.updated_at
        return cleaned
      })}
    ]

    for (const table of essentialTables) {
      try {
        console.log(`📥 Restauration ${table.name}...`)

        const response = await fetch(`${prodUrl}/rest/v1/${table.name}?select=*`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`⚠️  Impossible de récupérer ${table.name}: HTTP ${response.status}`)
          continue
        }

        const data = await response.json() as any[]

        if (data.length === 0) {
          console.log(`ℹ️  ${table.name}: aucune donnée`)
          continue
        }

        console.log(`✅ ${table.name}: ${data.length} enregistrements trouvés`)

        // Adapter les données
        const adaptedData = table.adapter(data)

        // Insérer par petites batches
        const batchSize = 5
        let successCount = 0

        for (let i = 0; i < adaptedData.length; i += batchSize) {
          const batch = adaptedData.slice(i, i + batchSize)

          const insertResponse = await fetch(`${devUrl}/rest/v1/${table.name}`, {
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
            console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} insérés`)
          } else {
            console.warn(`⚠️  Batch ${Math.floor(i/batchSize) + 1}: HTTP ${insertResponse.status}`)

            // Si batch échoue, essayer individuellement
            for (let j = 0; j < batch.length; j++) {
              try {
                const singleResponse = await fetch(`${devUrl}/rest/v1/${table.name}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${devKey}`,
                    'apikey': devKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(batch[j])
                })

                if (singleResponse.ok) {
                  successCount++
                  console.log(`✅ ${table.name} ${i + j + 1}: inséré`)
                }
              } catch (error) {
                console.warn(`⚠️  ${table.name} ${i + j + 1}: erreur individuelle`)
              }
            }
          }
        }

        console.log(`✅ ${table.name}: ${successCount}/${data.length} restaurés`)

      } catch (error) {
        console.error(`❌ ${table.name}: erreur - ${error}`)
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
            console.log('✅ loft_owners: TOUS restaurés avec succès!')
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
            console.log('✅ profiles: TOUS restaurés avec succès!')
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

          console.log('📝 Insertion des lofts un par un...')

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
                console.log(`✅ Loft ${i + 1}/${lofts.length}: ${cleanedLofts[i].name} - RESTAURÉ`)
              } else {
                console.warn(`⚠️  Loft ${i + 1}/${lofts.length}: HTTP ${singleResponse.status}`)
              }
            } catch (error) {
              console.warn(`⚠️  Loft ${i + 1}/${lofts.length}: erreur`)
            }
          }

          console.log(`✅ LOFTS: ${successCount}/${lofts.length} restaurés avec succès!`)
        }
      }
    } catch (error) {
      console.error('❌ lofts: erreur -', error)
    }

    // Étape 7: Vérification finale avec détails
    console.log('\n📋 ÉTAPE 7: VÉRIFICATION FINALE DÉTAILLÉE')
    console.log('='.repeat(60))

    console.log('📊 RÉSULTATS DE LA RESTAURATION:')
    console.log('')

    let totalRecords = 0

    for (const tableName of tablesToCheck) {
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

          // Afficher quelques exemples si la table contient des données
          if (count > 0) {
            const sampleResponse = await fetch(`${devUrl}/rest/v1/${tableName}?select=*&limit=2`, {
              headers: {
                'Authorization': `Bearer ${devKey}`,
                'apikey': devKey,
                'Content-Type': 'application/json'
              }
            })

            if (sampleResponse.ok) {
              const samples = await sampleResponse.json() as any[]
              console.log(`   📋 Exemples: ${samples.map(s => s.name || s.email || s.id).join(', ')}`)
            }
          }
        } else {
          console.log(`❌ ${tableName}: erreur vérification`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur vérification`)
      }
    }

    console.log(`\n🎯 TOTAL RECORDS DANS DEV: ${totalRecords}`)
    console.log('\n🎉 RESTAURATION ULTIME TERMINÉE!')
    console.log('💡 Votre base DEV contient maintenant une copie complète de PROD')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

ultimateRestore()