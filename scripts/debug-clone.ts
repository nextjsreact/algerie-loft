#!/usr/bin/env tsx
/**
 * DEBUG CLONE - COPIE TABLE PAR TABLE AVEC LOGS DÉTAILLÉS
 * =======================================================
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function debugClone() {
  try {
    console.log('🚀 DEBUG CLONE - TABLE PAR TABLE')

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

    // Étape 1: Vider les tables en DEV
    console.log('\n📋 ÉTAPE 1: NETTOYAGE DEV')
    const tablesToClear = ['lofts', 'loft_owners', 'profiles', 'currencies', 'categories']

    for (const table of tablesToClear) {
      try {
        console.log(`🗑️ Suppression ${table}...`)
        const response = await fetch(`${devUrl}/rest/v1/${table}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          }
        })
        console.log(`✅ ${table}: HTTP ${response.status}`)
      } catch (error) {
        console.warn(`⚠️ Erreur suppression ${table}:`, error)
      }
    }

    // Étape 2: Copier les données de référence
    console.log('\n📋 ÉTAPE 2: DONNÉES DE RÉFÉRENCE')

    // Currencies
    console.log('💰 Copie des currencies...')
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
        console.log(`✅ Currencies: HTTP ${insertResponse.status}`)
      }
    }

    // Categories
    console.log('📂 Copie des categories...')
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
        console.log(`✅ Categories: HTTP ${insertResponse.status}`)
      }
    }

    // Étape 3: Copier les propriétaires
    console.log('\n📋 ÉTAPE 3: PROPRIÉTAIRES')

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
        console.log(`✅ Propriétaires: HTTP ${insertResponse.status}`)
      }
    }

    // Étape 4: Copier les lofts
    console.log('\n📋 ÉTAPE 4: LOFTS')

    const loftsResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (loftsResponse.ok) {
      const lofts = await loftsResponse.json() as any[]
      console.log(`✅ ${lofts.length} lofts trouvés`)

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

        const insertResponse = await fetch(`${devUrl}/rest/v1/lofts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devKey}`,
            'apikey': devKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cleanedLofts)
        })
        console.log(`✅ Lofts: HTTP ${insertResponse.status}`)

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text()
          console.error(`❌ Erreur détaillée: ${errorText}`)
        }
      }
    }

    // Vérification finale
    console.log('\n📋 VÉRIFICATION FINALE')

    const finalCheck = await fetch(`${devUrl}/rest/v1/lofts?select=count`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (finalCheck.ok) {
      const count = await finalCheck.json()
      console.log(`✅ Lofts en DEV: ${count}`)
    }

    console.log('🎉 DEBUG CLONE TERMINÉ')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

debugClone()