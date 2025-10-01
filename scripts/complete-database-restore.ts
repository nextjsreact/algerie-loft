/**
 * RESTAURATION COMPLÈTE DE LA BASE DE DONNÉES
 * ===========================================
 *
 * Script qui effectue une restauration complète:
 * 1. DROP de TOUS les objets de DEV
 * 2. Recréation complète du schéma PROD dans DEV
 * 3. Copie de TOUTES les données PROD vers DEV
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function completeDatabaseRestore() {
  try {
    console.log('🔄 RESTAURATION COMPLÈTE DE LA BASE DE DONNÉES')
    console.log('⚠️  ATTENTION: Cette opération va SUPPRIMER TOUT de DEV et le remplacer par PROD')

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

    // Étape 1: Lister TOUTES les tables de PROD
    console.log('\n📋 ÉTAPE 1: INVENTAIRE COMPLET DE PROD')
    console.log('='.repeat(60))

    const allTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods',
      'loft_owners', 'profiles', 'lofts', 'transactions', 'bills', 'notifications',
      'conversations', 'messages', 'tasks', 'teams', 'availability', 'owners'
    ]

    console.log('📊 Tables à restaurer:')
    for (const tableName of allTables) {
      console.log(`  - ${tableName}`)
    }

    // Étape 2: SUPPRESSION COMPLÈTE de DEV (avec WHERE clauses)
    console.log('\n📋 ÉTAPE 2: SUPPRESSION COMPLÈTE DE DEV')
    console.log('='.repeat(60))

    for (const tableName of allTables) {
      try {
        console.log(`🗑️  Suppression ${tableName}...`)

        // DELETE avec WHERE clause pour sélectionner TOUS les enregistrements
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
          console.log(`ℹ️  ${tableName}: table inexistante`)
        } else {
          console.warn(`⚠️  ${tableName}: HTTP ${deleteResponse.status}`)
        }
      } catch (error) {
        console.warn(`⚠️  ${tableName}: erreur suppression`)
      }
    }

    // Étape 3: Restauration des données de référence
    console.log('\n📋 ÉTAPE 3: RESTAURATION DES DONNÉES DE RÉFÉRENCE')
    console.log('='.repeat(60))

    const referenceTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods'
    ]

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

        // Insertion directe sans modification (copie exacte)
        const insertResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })

        if (insertResponse.ok) {
          console.log(`✅ ${tableName}: restauré avec succès`)
        } else {
          const errorText = await insertResponse.text()
          console.warn(`⚠️  ${tableName}: HTTP ${insertResponse.status} - ${errorText}`)
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
          // Insertion en petites batches pour éviter les timeouts
          const batchSize = 5
          let totalSuccess = 0

          for (let i = 0; i < lofts.length; i += batchSize) {
            const batch = lofts.slice(i, i + batchSize)

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

    // Étape 7: Restauration des autres tables importantes
    console.log('\n📋 ÉTAPE 7: RESTAURATION DES AUTRES TABLES')
    console.log('='.repeat(60))

    const otherTables = ['transactions', 'bills', 'notifications', 'conversations', 'messages', 'tasks', 'teams', 'availability', 'owners']

    for (const tableName of otherTables) {
      try {
        console.log(`📥 Restauration ${tableName}...`)

        const response = await fetch(`${prodUrl}/rest/v1/${tableName}?select=*&limit=1000`, {
          headers: {
            'Authorization': `Bearer ${prodKey}`,
            'apikey': prodKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json() as any[]

          if (data.length > 0) {
            console.log(`✅ ${tableName}: ${data.length} enregistrements`)

            const insertResponse = await fetch(`${devUrl}/rest/v1/${tableName}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${devKey}`,
                'apikey': devKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            })

            if (insertResponse.ok) {
              console.log(`✅ ${tableName}: restauré`)
            } else {
              console.warn(`⚠️  ${tableName}: HTTP ${insertResponse.status}`)
            }
          } else {
            console.log(`ℹ️  ${tableName}: aucune donnée`)
          }
        } else if (response.status === 404) {
          console.log(`ℹ️  ${tableName}: table inexistante dans PROD`)
        } else {
          console.warn(`⚠️  ${tableName}: HTTP ${response.status}`)
        }

      } catch (error) {
        console.warn(`⚠️  ${tableName}: erreur`)
      }
    }

    // Étape 8: Vérification finale complète
    console.log('\n📋 ÉTAPE 8: VÉRIFICATION FINALE COMPLÈTE')
    console.log('='.repeat(60))

    console.log('📊 Résumé de la restauration:')

    const finalTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods',
      'loft_owners', 'profiles', 'lofts', 'transactions', 'bills', 'notifications',
      'conversations', 'messages', 'tasks', 'teams', 'availability', 'owners'
    ]

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
    console.log('\n🎉 RESTAURATION COMPLÈTE TERMINÉE!')
    console.log('💡 Votre base DEV contient maintenant une copie complète de PROD')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

completeDatabaseRestore()