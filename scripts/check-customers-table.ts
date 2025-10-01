/**
 * VÉRIFICATION DE LA TABLE CUSTOMERS
 * =================================
 *
 * Script pour vérifier spécifiquement la table customers dans PROD et DEV
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

async function checkCustomersTable() {
  try {
    console.log('🔍 VÉRIFICATION SPÉCIFIQUE DE LA TABLE CUSTOMERS')
    console.log('Recherche de la table customers dans PROD et DEV')

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

    // Vérifier la table customers dans PROD
    console.log('\n📋 VÉRIFICATION CUSTOMERS DANS PRODUCTION')
    console.log('='.repeat(50))

    try {
      const prodResponse = await fetch(`${prodUrl}/rest/v1/customers?select=*&limit=5`, {
        headers: {
          'Authorization': `Bearer ${prodKey}`,
          'apikey': prodKey,
          'Content-Type': 'application/json'
        }
      })

      if (prodResponse.ok) {
        const prodCustomers = await prodResponse.json() as any[]
        console.log(`✅ CUSTOMERS PROD: ${prodCustomers.length} clients trouvés`)

        if (prodCustomers.length > 0) {
          console.log('📋 Exemples de clients PROD:')
          prodCustomers.forEach((customer, index) => {
            console.log(`   ${index + 1}. ${customer.name || customer.email || customer.id}`)
          })
        }
      } else if (prodResponse.status === 404) {
        console.log('ℹ️  Table customers n\'existe pas dans PROD')
      } else {
        console.log(`❌ Erreur PROD: HTTP ${prodResponse.status}`)
      }
    } catch (error) {
      console.log('❌ Erreur lecture customers PROD')
    }

    // Vérifier la table customers dans DEV
    console.log('\n🎯 VÉRIFICATION CUSTOMERS DANS DEVELOPMENT')
    console.log('='.repeat(50))

    try {
      const devResponse = await fetch(`${devUrl}/rest/v1/customers?select=*&limit=5`, {
        headers: {
          'Authorization': `Bearer ${devKey}`,
          'apikey': devKey,
          'Content-Type': 'application/json'
        }
      })

      if (devResponse.ok) {
        const devCustomers = await devResponse.json() as any[]
        console.log(`✅ CUSTOMERS DEV: ${devCustomers.length} clients trouvés`)

        if (devCustomers.length > 0) {
          console.log('📋 Exemples de clients DEV:')
          devCustomers.forEach((customer, index) => {
            console.log(`   ${index + 1}. ${customer.name || customer.email || customer.id}`)
          })
        }
      } else if (devResponse.status === 404) {
        console.log('ℹ️  Table customers n\'existe pas dans DEV')
      } else {
        console.log(`❌ Erreur DEV: HTTP ${devResponse.status}`)
      }
    } catch (error) {
      console.log('❌ Erreur lecture customers DEV')
    }

    // Vérifier d'autres tables importantes
    console.log('\n📋 VÉRIFICATION D\'AUTRES TABLES IMPORTANTES')
    console.log('='.repeat(50))

    const importantTables = [
      'customers', 'invoices', 'payments', 'expenses', 'revenues',
      'reports', 'bills', 'transactions', 'notifications'
    ]

    for (const tableName of importantTables) {
      try {
        const [prodResponse, devResponse] = await Promise.all([
          fetch(`${prodUrl}/rest/v1/${tableName}?select=count`, {
            headers: {
              'Authorization': `Bearer ${prodKey}`,
              'apikey': prodKey,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${devUrl}/rest/v1/${tableName}?select=count`, {
            headers: {
              'Authorization': `Bearer ${devKey}`,
              'apikey': devKey,
              'Content-Type': 'application/json'
            }
          })
        ])

        let prodCount = 0
        let devCount = 0

        if (prodResponse.ok) {
          prodCount = await prodResponse.json() as number
        }

        if (devResponse.ok) {
          devCount = await devResponse.json() as number
        }

        const status = prodCount === devCount ? '✅ IDENTIQUE' : '❌ DIFFÉRENT'
        console.log(`${status} ${tableName}: PROD=${prodCount}, DEV=${devCount}`)

      } catch (error) {
        console.log(`❌ ${tableName}: erreur vérification`)
      }
    }

    // Afficher un résumé final
    console.log('\n📊 RÉSUMÉ FINAL')
    console.log('='.repeat(50))

    console.log('🔍 TABLES PRINCIPALES DANS DEV:')
    const mainTables = ['lofts', 'loft_owners', 'profiles', 'categories', 'currencies', 'customers']

    for (const tableName of mainTables) {
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
        } else {
          console.log(`❌ ${tableName}: table absente`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: erreur`)
      }
    }

    console.log('\n🎉 VÉRIFICATION CUSTOMERS TERMINÉE!')
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

checkCustomersTable()