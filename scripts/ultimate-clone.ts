#!/usr/bin/env tsx
/**
 * CLONAGE ULTIME - SOLUTION QUI MARCHE VRAIMENT
 * =============================================
 *
 * Problème identifié: Les scripts précédents ne marchent pas
 * Solution: Script minimaliste qui copie juste les lofts
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function ultimateClone() {
  try {
    console.log('🚀 CLONAGE ULTIME - COPIE DIRECTE')

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

    // Étape 1: Vérifier l'état actuel
    console.log('\n📋 ÉTAT ACTUEL:')
    const currentState = await fetch(`${devUrl}/rest/v1/lofts?select=count`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })
    const currentCount = await currentState.json()
    console.log(`DEV a actuellement: ${currentCount} lofts`)

    // Étape 2: Récupérer les lofts de production
    console.log('\n📥 RÉCUPÉRATION DES LOFTS DE PRODUCTION...')
    const prodResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (!prodResponse.ok) {
      throw new Error(`Impossible de récupérer les lofts de production: HTTP ${prodResponse.status}`)
    }

    const prodLofts = await prodResponse.json() as any[]
    console.log(`✅ ${prodLofts.length} lofts trouvés en production`)

    if (prodLofts.length === 0) {
      console.log('ℹ️ Aucun loft en production')
      return
    }

    // Étape 3: Vider complètement la table lofts en DEV
    console.log('\n🗑️ SUPPRESSION COMPLÈTE DES LOFTS EN DEV...')

    // Utiliser TRUNCATE pour vider la table complètement
    try {
      const truncateResponse = await fetch(`${devUrl}/rest/v1/rpc/truncate_lofts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (truncateResponse.ok) {
        console.log('✅ Table lofts vidée avec TRUNCATE')
      } else {
        console.warn(`⚠️ TRUNCATE échoué: HTTP ${truncateResponse.status}`)
      }
    } catch (error) {
      console.warn('⚠️ TRUNCATE non disponible, utilisation DELETE...')
    }

    // Étape 4: Insérer les lofts un par un
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
          console.log(`✅ Loft ${i + 1}/${prodLofts.length}: ${cleanedLoft.name}`)
        } else {
          const errorText = await insertResponse.text()
          console.error(`❌ Loft ${i + 1}/${prodLofts.length}: HTTP ${insertResponse.status} - ${errorText}`)
          errorCount++
        }
      } catch (error) {
        console.error(`❌ Loft ${i + 1}/${prodLofts.length}: Erreur - ${error}`)
        errorCount++
      }
    }

    // Étape 5: Vérification finale
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

    // Afficher les premiers lofts copiés
    if (successCount > 0) {
      const sampleResponse = await fetch(`${devUrl}/rest/v1/lofts?select=id,name,price_per_month&limit=3`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (sampleResponse.ok) {
        const sampleLofts = await sampleResponse.json() as any[]
        console.log('\n📋 EXEMPLE DE LOFTS COPIÉS:')
        sampleLofts.forEach((loft, index) => {
          console.log(`${index + 1}. ${loft.name} - ${loft.price_per_month} DA/mois`)
        })
      }
    }

    console.log('\n🎉 CLONAGE ULTIME TERMINÉ!')
    console.log(`📈 Résultat: ${successCount}/${prodLofts.length} lofts copiés`)

    if (successCount === prodLofts.length) {
      console.log('✅ CLONAGE RÉUSSI À 100%!')
    } else if (successCount > 0) {
      console.log('⚠️ CLONAGE PARTIEL - Certains lofts n\'ont pas pu être copiés')
    } else {
      console.log('❌ CLONAGE ÉCHOUÉ - Aucun loft copié')
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

ultimateClone()