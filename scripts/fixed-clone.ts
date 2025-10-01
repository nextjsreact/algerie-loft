/**
 * CLONAGE CORRIGÉ - VERSION QUI MARCHE
 * ===================================
 *
 * Le problème: Les scripts précédents ne récupèrent qu'1 loft au lieu de 18
 * Solution: Corriger la récupération des données de production
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function fixedClone() {
  try {
    console.log('🚀 CLONAGE CORRIGÉ - RÉCUPÉRATION DES 18 LOFTS')

    // Configuration séparée pour éviter les conflits
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

    // Étape 1: Vérifier les données en production
    console.log('\n📋 VÉRIFICATION DES DONNÉES EN PRODUCTION:')

    const prodLoftsResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=count`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodLoftsResponse.ok) {
      const prodCount = await prodLoftsResponse.json()
      console.log(`✅ Production a: ${prodCount} lofts`)
    } else {
      console.error(`❌ Erreur production: HTTP ${prodLoftsResponse.status}`)
    }

    // Récupérer tous les lofts de production
    console.log('\n📥 RÉCUPÉRATION DÉTAILLÉE DES LOFTS DE PRODUCTION...')

    const prodLoftsDetailResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodLoftsDetailResponse.ok) {
      const prodLofts = await prodLoftsDetailResponse.json() as any[]
      console.log(`✅ Récupéré ${prodLofts.length} lofts de production`)

      if (prodLofts.length > 0) {
        console.log('\n📝 PREMIERS LOFTS DE PRODUCTION:')
        prodLofts.slice(0, 3).forEach((loft, index) => {
          console.log(`${index + 1}. ${loft.name} (ID: ${loft.id})`)
        })
      }

      // Étape 2: Vider DEV complètement
      console.log('\n🗑️ SUPPRESSION COMPLÈTE DE DEV...')

      const deleteResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (deleteResponse.ok || deleteResponse.status === 404) {
        console.log('✅ Lofts supprimés de DEV')
      } else {
        console.warn(`⚠️ Erreur suppression: HTTP ${deleteResponse.status}`)
      }

      // Étape 3: Insérer les lofts un par un
      console.log('\n📝 INSERTION DES LOFTS UN PAR UN...')

      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < prodLofts.length; i++) {
        const loft = prodLofts[i]

        // Nettoyer les données
        const cleanedLoft = {
          ...loft,
          name: loft.name || `Loft ${i + 1}`,
          address: loft.address || `Adresse ${i + 1}`,
          price_per_month: loft.price_per_month || 50000,
          status: loft.status || 'available',
          company_percentage: loft.company_percentage || 50,
          owner_percentage: loft.owner_percentage || 50
        }

        try {
          const insertResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanedLoft)
          })

          if (insertResponse.ok) {
            successCount++
            console.log(`✅ ${i + 1}/${prodLofts.length}: ${cleanedLoft.name}`)
          } else {
            const errorText = await insertResponse.text()
            console.warn(`⚠️ ${i + 1}/${prodLofts.length}: HTTP ${insertResponse.status} - ${errorText}`)
            errorCount++
          }
        } catch (error) {
          console.warn(`⚠️ ${i + 1}/${prodLofts.length}: Erreur - ${error}`)
          errorCount++
        }
      }

      // Étape 4: Vérification finale
      console.log('\n📋 VÉRIFICATION FINALE:')
      console.log(`✅ Lofts copiés avec succès: ${successCount}`)
      console.log(`❌ Lofts en erreur: ${errorCount}`)

      const finalCheck = await fetch(`${devUrl}/rest/v1/lofts?select=count`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (finalCheck.ok) {
        const finalCount = await finalCheck.json()
        console.log(`📊 Total lofts en DEV: ${finalCount}`)
      }

      // Afficher les lofts copiés
      if (successCount > 0) {
        console.log('\n📋 LOFTS COPIÉS AVEC SUCCÈS:')
        try {
          const sampleResponse = await fetch(`${devUrl}/rest/v1/lofts?select=id,name,price_per_month&limit=5`, {
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            }
          })

          if (sampleResponse.ok) {
            const sampleLofts = await sampleResponse.json() as any[]
            sampleLofts.forEach((loft, index) => {
              console.log(`${index + 1}. ${loft.name} - ${loft.price_per_month} DA/mois`)
            })
          }
        } catch (error) {
          console.warn('⚠️ Erreur récupération exemples:', error)
        }
      }

      console.log('\n🎉 CLONAGE CORRIGÉ TERMINÉ!')
      console.log(`📈 Résultat: ${successCount}/${prodLofts.length} lofts copiés`)

      if (successCount === prodLofts.length) {
        console.log('✅ CLONAGE RÉUSSI À 100%!')
      } else if (successCount > 0) {
        console.log('⚠️ CLONAGE PARTIEL')
      } else {
        console.log('❌ CLONAGE ÉCHOUÉ')
      }

    } else {
      console.error(`❌ Impossible de récupérer les lofts de production: HTTP ${prodLoftsDetailResponse.status}`)
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

fixedClone()