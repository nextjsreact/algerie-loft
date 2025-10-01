#!/usr/bin/env tsx
/**
 * TEST DE CLONAGE - APPROCHE MINIMALISTE
 * =====================================
 *
 * Test simple pour identifier le problème
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function testClone() {
  try {
    console.log('🚀 TEST DE CLONAGE MINIMAL')

    // Charger la configuration DEV
    config({ path: 'env-backup/.env.development' })

    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!devUrl || !devKey) {
      throw new Error('Configuration DEV manquante')
    }

    console.log('✅ Configuration DEV chargée')

    // Tester l'accès à DEV
    const testResponse = await fetch(`${devUrl}/rest/v1/lofts?select=count`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (!testResponse.ok) {
      throw new Error(`Accès DEV impossible: HTTP ${testResponse.status}`)
    }

    console.log('✅ Accès DEV OK')

    // Vider la table lofts en DEV
    console.log('🗑️ Suppression des lofts existants...')
    const deleteResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (!deleteResponse.ok) {
      console.warn(`⚠️ Erreur suppression: HTTP ${deleteResponse.status}`)
    } else {
      console.log('✅ Lofts supprimés')
    }

    // Insérer un loft de test
    console.log('📝 Insertion d\'un loft de test...')
    const testLoft = {
      name: 'Loft de test',
      address: '123 Test Street',
      price_per_month: 50000,
      status: 'available',
      company_percentage: 50,
      owner_percentage: 50
    }

    const insertResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLoft)
    })

    if (insertResponse.ok) {
      try {
        const insertedLoft = await insertResponse.json() as any[]
        console.log('✅ Loft de test inséré:', insertedLoft[0])
      } catch (jsonError) {
        console.log('✅ Loft de test inséré (réponse vide)')
      }
    } else {
      const errorText = await insertResponse.text()
      console.error(`❌ Erreur insertion: HTTP ${insertResponse.status} - ${errorText}`)
    }

    // Vérifier le résultat
    const verifyResponse = await fetch(`${devUrl}/rest/v1/lofts?select=count`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (verifyResponse.ok) {
      const count = await verifyResponse.json()
      console.log(`✅ Vérification: ${count} lofts dans DEV`)
    }

    console.log('🎉 TEST TERMINÉ')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

testClone()