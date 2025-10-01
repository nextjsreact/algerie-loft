#!/usr/bin/env tsx
/**
 * VÉRIFICATION DES DONNÉES DE PRODUCTION
 * =====================================
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function checkProdData() {
  try {
    console.log('🔍 VÉRIFICATION DES DONNÉES DE PRODUCTION')

    // Configuration PROD
    config({ path: 'env-backup/.env.prod' })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!prodUrl || !prodKey) {
      throw new Error('Configuration PROD manquante')
    }

    console.log('✅ Configuration PROD chargée')

    // Vérifier les lofts
    console.log('\n📋 LOFTS EN PRODUCTION:')
    const loftsResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (loftsResponse.ok) {
      const lofts = await loftsResponse.json() as any[]
      console.log(`📊 Nombre de lofts: ${lofts.length}`)

      if (lofts.length > 0) {
        console.log('\n📝 DÉTAILS DES LOFTS:')
        lofts.forEach((loft, index) => {
          console.log(`${index + 1}. ID: ${loft.id}`)
          console.log(`   Nom: ${loft.name}`)
          console.log(`   Prix: ${loft.price_per_month} DA/mois`)
          console.log(`   Statut: ${loft.status}`)
          console.log(`   Adresse: ${loft.address}`)
          console.log('---')
        })
      } else {
        console.log('ℹ️ Aucun loft en production')
      }
    } else {
      console.error(`❌ Erreur récupération lofts: HTTP ${loftsResponse.status}`)
    }

    // Vérifier les propriétaires
    console.log('\n📋 PROPRIÉTAIRES EN PRODUCTION:')
    const ownersResponse = await fetch(`${prodUrl}/rest/v1/loft_owners?select=*`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (ownersResponse.ok) {
      const owners = await ownersResponse.json() as any[]
      console.log(`📊 Nombre de propriétaires: ${owners.length}`)

      if (owners.length > 0) {
        console.log('\n📝 DÉTAILS DES PROPRIÉTAIRES:')
        owners.forEach((owner, index) => {
          console.log(`${index + 1}. ID: ${owner.id}`)
          console.log(`   Nom: ${owner.name}`)
          console.log(`   Email: ${owner.email}`)
          console.log('---')
        })
      }
    }

    // Vérifier les autres tables importantes
    const tables = ['currencies', 'categories', 'profiles', 'teams']
    for (const table of tables) {
      console.log(`\n📋 ${table.toUpperCase()} EN PRODUCTION:`)
      const response = await fetch(`${prodUrl}/rest/v1/${table}?select=count`, {
        headers: {
          'Authorization': `Bearer ${prodKey}`,
          'apikey': prodKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const count = await response.json()
        console.log(`📊 Nombre de ${table}: ${count}`)
      } else {
        console.error(`❌ Erreur ${table}: HTTP ${response.status}`)
      }
    }

    console.log('\n🎯 VÉRIFICATION TERMINÉE')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

checkProdData()