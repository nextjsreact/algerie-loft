#!/usr/bin/env tsx
/**
 * CLONAGE RÉEL - SOLUTION QUI MARCHE VRAIMENT
 * ===========================================
 *
 * Maintenant qu'on sait qu'il y a 18 lofts en PROD,
 * créons un script qui marche vraiment.
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function realClone() {
  try {
    console.log('🚀 CLONAGE RÉEL - 18 LOFTS DE PRODUCTION')

    // Configuration
    config({ path: 'env-backup/.env.development' })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    config({ path: 'env-backup/.env.prod' })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!devUrl || !devKey || !prodUrl || !prodKey) {
      throw new Error('Configuration manquante')
    }

    console.log('✅ Configuration chargée')

    // Étape 1: Vérifier l'état actuel de DEV
    console.log('\n📋 ÉTAT ACTUEL DE DEV:')
    const currentState = await fetch(`${devUrl}/rest/v1/lofts?select=count`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })
    const currentCount = await currentState.json()
    console.log(`DEV a actuellement: ${currentCount} lofts`)

    // Étape 2: SUPPRESSION COMPLÈTE de toutes les données en DEV
    console.log('\n🗑️ SUPPRESSION COMPLÈTE DES DONNÉES EN DEV...')

    const tablesToClear = [
      'lofts', 'loft_owners', 'profiles', 'teams', 'team_members',
      'tasks', 'transactions', 'transaction_category_references',
      'settings', 'notifications', 'messages', 'customers', 'loft_photos'
    ]

    for (const table of tablesToClear) {
      try {
        // Utiliser une requête DELETE qui supprime tout
        const deleteResponse = await fetch(`${devUrl}/rest/v1/${table}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (deleteResponse.ok || deleteResponse.status === 404) {
          console.log(`✅ ${table}: supprimé`)
        } else {
          console.warn(`⚠️ ${table}: HTTP ${deleteResponse.status}`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur suppression ${table}:`, error)
      }
    }

    // Étape 3: Copier les données de référence d'abord
    console.log('\n📋 COPIE DES DONNÉES DE RÉFÉRENCE...')

    // Currencies
    const currenciesResponse = await fetch(`${prodUrl}/rest/v1/currencies?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (currenciesResponse.ok) {
      const currencies = await currenciesResponse.json() as any[]
      console.log(`✅ ${currencies.length} currencies trouvées`)

      if (currencies.length > 0) {
        const insertResponse = await fetch(`${devUrl}/rest/v1/currencies`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currencies)
        })

        if (insertResponse.ok) {
          console.log('✅ Currencies copiées')
        } else {
          console.warn(`⚠️ Erreur currencies: HTTP ${insertResponse.status}`)
        }
      }
    }

    // Categories
    const categoriesResponse = await fetch(`${prodUrl}/rest/v1/categories?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json() as any[]
      console.log(`✅ ${categories.length} categories trouvées`)

      if (categories.length > 0) {
        const insertResponse = await fetch(`${devUrl}/rest/v1/categories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(categories)
        })

        if (insertResponse.ok) {
          console.log('✅ Categories copiées')
        } else {
          console.warn(`⚠️ Erreur categories: HTTP ${insertResponse.status}`)
        }
      }
    }

    // Étape 4: Copier les propriétaires
    console.log('\n📋 COPIE DES PROPRIÉTAIRES...')

    const ownersResponse = await fetch(`${prodUrl}/rest/v1/loft_owners?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (ownersResponse.ok) {
      const owners = await ownersResponse.json() as any[]
      console.log(`✅ ${owners.length} propriétaires trouvés`)

      if (owners.length > 0) {
        // Nettoyer les données
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
          console.log('✅ Propriétaires copiés')
        } else {
          const errorText = await insertResponse.text()
          console.warn(`⚠️ Erreur propriétaires: HTTP ${insertResponse.status} - ${errorText}`)
        }
      }
    }

    // Étape 5: Copier les profils
    console.log('\n📋 COPIE DES PROFILS...')

    const profilesResponse = await fetch(`${prodUrl}/rest/v1/profiles?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json() as any[]
      console.log(`✅ ${profiles.length} profils trouvés`)

      if (profiles.length > 0) {
        // Nettoyer les données
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
          console.log('✅ Profils copiés')
        } else {
          const errorText = await insertResponse.text()
          console.warn(`⚠️ Erreur profils: HTTP ${insertResponse.status} - ${errorText}`)
        }
      }
    }

    // Étape 6: Copier les LOFTS (les plus importants)
    console.log('\n📋 COPIE DES LOFTS (18 attendus)...')

    const loftsResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (loftsResponse.ok) {
      const lofts = await loftsResponse.json() as any[]
      console.log(`✅ ${lofts.length} lofts trouvés en production`)

      if (lofts.length > 0) {
        // Nettoyer les données
        const cleanedLofts = lofts.map((loft, index) => ({
          ...loft,
          name: loft.name || `Loft ${index + 1}`,
          address: loft.address || `Adresse ${index + 1}`,
          price_per_month: loft.price_per_month || 50000,
          status: loft.status || 'available',
          company_percentage: loft.company_percentage || 50,
          owner_percentage: loft.owner_percentage || 50
        }))

        console.log('📝 Insertion des lofts en cours...')

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
          console.log('✅ TOUS LES LOFTS COPIÉS AVEC SUCCÈS!')
        } else {
          const errorText = await insertResponse.text()
          console.error(`❌ Erreur lofts: HTTP ${insertResponse.status} - ${errorText}`)

          // Si ça échoue, essayer l'insertion individuelle
          console.log('🔄 Tentative d\'insertion individuelle...')
          let successCount = 0

          for (let i = 0; i < cleanedLofts.length; i++) {
            const loft = cleanedLofts[i]

            try {
              const singleResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${devKey}`,
                  'apikey': devKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(loft)
              })

              if (singleResponse.ok) {
                successCount++
                console.log(`✅ Loft ${i + 1}/${lofts.length}: ${loft.name}`)
              } else {
                console.warn(`⚠️ Loft ${i + 1}/${lofts.length}: échec`)
              }
            } catch (error) {
              console.warn(`⚠️ Loft ${i + 1}/${lofts.length}: erreur - ${error}`)
            }
          }

          console.log(`✅ Insertion individuelle: ${successCount}/${lofts.length} lofts copiés`)
        }
      } else {
        console.log('ℹ️ Aucun loft à copier')
      }
    } else {
      console.error(`❌ Impossible de récupérer les lofts: HTTP ${loftsResponse.status}`)
    }

    // Étape 7: Vérification finale
    console.log('\n📋 VÉRIFICATION FINALE:')
    console.log('='.repeat(50))

    const finalChecks = [
      { table: 'currencies', name: 'Currencies' },
      { table: 'categories', name: 'Categories' },
      { table: 'loft_owners', name: 'Propriétaires' },
      { table: 'profiles', name: 'Profils' },
      { table: 'lofts', name: 'Lofts' }
    ]

    for (const check of finalChecks) {
      try {
        const response = await fetch(`${devUrl}/rest/v1/${check.table}?select=count`, {
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const count = await response.json()
          console.log(`✅ ${check.name}: ${count}`)
        } else {
          console.warn(`⚠️ Erreur vérification ${check.table}: HTTP ${response.status}`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur vérification ${check.table}:`, error)
      }
    }

    // Afficher quelques exemples de lofts copiés
    console.log('\n📋 EXEMPLES DE LOFTS COPIÉS:')
    try {
      const sampleResponse = await fetch(`${devUrl}/rest/v1/lofts?select=id,name,price_per_month,address&limit=5`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (sampleResponse.ok) {
        const sampleLofts = await sampleResponse.json() as any[]
        sampleLofts.forEach((loft, index) => {
          console.log(`${index + 1}. ${loft.name}`)
          console.log(`   Prix: ${loft.price_per_month || 'N/A'} DA/mois`)
          console.log(`   Adresse: ${loft.address}`)
          console.log('---')
        })
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération exemples:', error)
    }

    console.log('\n🎉 CLONAGE RÉEL TERMINÉ!')
    console.log('💡 Vérifiez votre application DEV maintenant')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

realClone()