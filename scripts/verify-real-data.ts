/**
 * VÉRIFICATION RÉELLE DES DONNÉES
 * ===============================
 *
 * Script qui lit et affiche les VRAIES données de PROD et DEV
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function verifyRealData() {
  try {
    console.log('🔍 VÉRIFICATION RÉELLE DES DONNÉES PROD/DEV')
    console.log('Affichage des vraies données pour prouver la restauration')

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

    // Étape 1: Vérification des LOFTS avec vraies données
    console.log('\n🏠 VÉRIFICATION DES LOFTS - DONNÉES RÉELLES')
    console.log('='.repeat(70))

    // PROD Lofts
    console.log('📤 PRODUCTION LOFTS:')
    const prodLoftsResponse = await fetch(`${prodUrl}/rest/v1/lofts?select=id,name,address,price_per_month,status&limit=5`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodLoftsResponse.ok) {
      const prodLofts = await prodLoftsResponse.json() as any[]
      console.log(`✅ PROD: ${prodLofts.length} lofts trouvés`)
      prodLofts.forEach((loft, index) => {
        console.log(`   ${index + 1}. ${loft.name} - ${loft.address} - ${loft.price_per_month}DA - ${loft.status}`)
      })
    } else {
      console.log('❌ Impossible de lire les lofts PROD')
    }

    // DEV Lofts
    console.log('\n🎯 DEVELOPMENT LOFTS:')
    const devLoftsResponse = await fetch(`${devUrl}/rest/v1/lofts?select=id,name,address,price_per_month,status&limit=5`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (devLoftsResponse.ok) {
      const devLofts = await devLoftsResponse.json() as any[]
      console.log(`✅ DEV: ${devLofts.length} lofts trouvés`)
      devLofts.forEach((loft, index) => {
        console.log(`   ${index + 1}. ${loft.name} - ${loft.address} - ${loft.price_per_month}DA - ${loft.status}`)
      })
    } else {
      console.log('❌ Impossible de lire les lofts DEV')
    }

    // Étape 2: Vérification des PROPRIÉTAIRES avec vraies données
    console.log('\n👥 VÉRIFICATION DES PROPRIÉTAIRES - DONNÉES RÉELLES')
    console.log('='.repeat(70))

    // PROD Owners
    console.log('📤 PRODUCTION PROPRIÉTAIRES:')
    const prodOwnersResponse = await fetch(`${prodUrl}/rest/v1/loft_owners?select=id,name,email&limit=5`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodOwnersResponse.ok) {
      const prodOwners = await prodOwnersResponse.json() as any[]
      console.log(`✅ PROD: ${prodOwners.length} propriétaires trouvés`)
      prodOwners.forEach((owner, index) => {
        console.log(`   ${index + 1}. ${owner.name} - ${owner.email}`)
      })
    } else {
      console.log('❌ Impossible de lire les propriétaires PROD')
    }

    // DEV Owners
    console.log('\n🎯 DEVELOPMENT PROPRIÉTAIRES:')
    const devOwnersResponse = await fetch(`${devUrl}/rest/v1/loft_owners?select=id,name,email&limit=5`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (devOwnersResponse.ok) {
      const devOwners = await devOwnersResponse.json() as any[]
      console.log(`✅ DEV: ${devOwners.length} propriétaires trouvés`)
      devOwners.forEach((owner, index) => {
        console.log(`   ${index + 1}. ${owner.name} - ${owner.email}`)
      })
    } else {
      console.log('❌ Impossible de lire les propriétaires DEV')
    }

    // Étape 3: Vérification des CATÉGORIES avec vraies données
    console.log('\n📂 VÉRIFICATION DES CATÉGORIES - DONNÉES RÉELLES')
    console.log('='.repeat(70))

    // PROD Categories
    console.log('📤 PRODUCTION CATÉGORIES:')
    const prodCategoriesResponse = await fetch(`${prodUrl}/rest/v1/categories?select=id,name,description&limit=10`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodCategoriesResponse.ok) {
      const prodCategories = await prodCategoriesResponse.json() as any[]
      console.log(`✅ PROD: ${prodCategories.length} catégories trouvées`)
      prodCategories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} - ${category.description || 'N/A'}`)
      })
    } else {
      console.log('❌ Impossible de lire les catégories PROD')
    }

    // DEV Categories
    console.log('\n🎯 DEVELOPMENT CATÉGORIES:')
    const devCategoriesResponse = await fetch(`${devUrl}/rest/v1/categories?select=id,name,description&limit=10`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (devCategoriesResponse.ok) {
      const devCategories = await devCategoriesResponse.json() as any[]
      console.log(`✅ DEV: ${devCategories.length} catégories trouvées`)
      devCategories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} - ${category.description || 'N/A'}`)
      })
    } else {
      console.log('❌ Impossible de lire les catégories DEV')
    }

    // Étape 4: Vérification des TYPES DE CONNEXION INTERNET
    console.log('\n🌐 VÉRIFICATION DES TYPES DE CONNEXION - DONNÉES RÉELLES')
    console.log('='.repeat(70))

    // PROD Internet Types
    console.log('📤 PRODUCTION TYPES CONNEXION:')
    const prodInternetResponse = await fetch(`${prodUrl}/rest/v1/internet_connection_types?select=id,name,description,price_per_month&limit=5`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodInternetResponse.ok) {
      const prodInternet = await prodInternetResponse.json() as any[]
      console.log(`✅ PROD: ${prodInternet.length} types de connexion trouvés`)
      prodInternet.forEach((internet, index) => {
        console.log(`   ${index + 1}. ${internet.name} - ${internet.description} - ${internet.price_per_month}DA`)
      })
    } else {
      console.log('❌ Impossible de lire les types de connexion PROD')
    }

    // DEV Internet Types
    console.log('\n🎯 DEVELOPMENT TYPES CONNEXION:')
    const devInternetResponse = await fetch(`${devUrl}/rest/v1/internet_connection_types?select=id,name,description,price_per_month&limit=5`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (devInternetResponse.ok) {
      const devInternet = await devInternetResponse.json() as any[]
      console.log(`✅ DEV: ${devInternet.length} types de connexion trouvés`)
      devInternet.forEach((internet, index) => {
        console.log(`   ${index + 1}. ${internet.name} - ${internet.description} - ${internet.price_per_month}DA`)
      })
    } else {
      console.log('❌ Impossible de lire les types de connexion DEV')
    }

    // Étape 5: Vérification des MONNAIES
    console.log('\n💰 VÉRIFICATION DES MONNAIES - DONNÉES RÉELLES')
    console.log('='.repeat(70))

    // PROD Currencies
    console.log('📤 PRODUCTION MONNAIES:')
    const prodCurrenciesResponse = await fetch(`${prodUrl}/rest/v1/currencies?select=id,name,symbol,code&limit=5`, {
      headers: {
        'Authorization': `Bearer ${prodKey}`,
        'apikey': prodKey,
        'Content-Type': 'application/json'
      }
    })

    if (prodCurrenciesResponse.ok) {
      const prodCurrencies = await prodCurrenciesResponse.json() as any[]
      console.log(`✅ PROD: ${prodCurrencies.length} monnaies trouvées`)
      prodCurrencies.forEach((currency, index) => {
        console.log(`   ${index + 1}. ${currency.name} (${currency.symbol}) - ${currency.code}`)
      })
    } else {
      console.log('❌ Impossible de lire les monnaies PROD')
    }

    // DEV Currencies
    console.log('\n🎯 DEVELOPMENT MONNAIES:')
    const devCurrenciesResponse = await fetch(`${devUrl}/rest/v1/currencies?select=id,name,symbol,code&limit=5`, {
      headers: {
        'Authorization': `Bearer ${devKey}`,
        'apikey': devKey,
        'Content-Type': 'application/json'
      }
    })

    if (devCurrenciesResponse.ok) {
      const devCurrencies = await devCurrenciesResponse.json() as any[]
      console.log(`✅ DEV: ${devCurrencies.length} monnaies trouvées`)
      devCurrencies.forEach((currency, index) => {
        console.log(`   ${index + 1}. ${currency.name} (${currency.symbol}) - ${currency.code}`)
      })
    } else {
      console.log('❌ Impossible de lire les monnaies DEV')
    }

    // Étape 6: Comparaison finale
    console.log('\n📊 COMPARAISON FINALE - DONNÉES RÉELLES')
    console.log('='.repeat(70))

    console.log('🔍 RÉSUMÉ DE LA VÉRIFICATION:')
    console.log('')

    const tables = [
      { name: 'lofts', prodQuery: 'name', devQuery: 'name' },
      { name: 'loft_owners', prodQuery: 'name', devQuery: 'name' },
      { name: 'categories', prodQuery: 'name', devQuery: 'name' },
      { name: 'internet_connection_types', prodQuery: 'name', devQuery: 'name' },
      { name: 'currencies', prodQuery: 'name', devQuery: 'name' }
    ]

    for (const table of tables) {
      try {
        const [prodResponse, devResponse] = await Promise.all([
          fetch(`${prodUrl}/rest/v1/${table.name}?select=count`, {
            headers: {
              'Authorization': `Bearer ${prodKey}`,
              'apikey': prodKey,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${devUrl}/rest/v1/${table.name}?select=count`, {
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            }
          })
        ])

        if (prodResponse.ok && devResponse.ok) {
          const prodCount = await prodResponse.json() as number
          const devCount = await devResponse.json() as number

          const status = prodCount === devCount ? '✅ IDENTIQUE' : '❌ DIFFÉRENT'
          console.log(`${status} ${table.name}: PROD=${prodCount}, DEV=${devCount}`)
        } else {
          console.log(`❌ ${table.name}: erreur de comptage`)
        }
      } catch (error) {
        console.log(`❌ ${table.name}: erreur de comparaison`)
      }
    }

    console.log('\n🎉 VÉRIFICATION RÉELLE TERMINÉE!')
    console.log('💡 Vous pouvez maintenant voir les vraies données de PROD et DEV')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

verifyRealData()