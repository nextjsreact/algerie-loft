#!/usr/bin/env tsx
/**
 * Script de vérification des données dans l'environnement DEV
 * Utilise le client Supabase au lieu de la connexion PostgreSQL directe
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

interface TableInfo {
  name: string
  count: number
  hasData: boolean
}

class DevDataVerifier {
  private client: any

  constructor() {
    // Charger les variables d'environnement DEV
    const res = dotenv.config({ path: 'env-backup/.env.development' })
    if (res.error) {
      throw new Error(`Impossible de charger .env.development: ${res.error.message}`)
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      throw new Error('Variables d\'environnement manquantes: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
    }

    this.client = createClient(url, serviceKey, { auth: { persistSession: false } })
    console.log(`🔍 Vérification des données dans: ${url}`)
  }

  async verifyData() {
    console.log('📊 VÉRIFICATION DES DONNÉES DEV')
    console.log('='.repeat(50))

    const tables = [
      'currencies',
      'categories',
      'zone_areas',
      'internet_connection_types',
      'payment_methods',
      'loft_owners',
      'lofts',
      'teams',
      'team_members',
      'tasks',
      'transactions',
      'transaction_category_references',
      'settings',
      'profiles',
      'notifications',
      'messages'
    ]

    const results: TableInfo[] = []

    for (const table of tables) {
      try {
        console.log(`\n📋 Vérification de la table: ${table}`)

        // Utiliser une requête simple pour compter les enregistrements
        const { count, error } = await this.client
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ Erreur: ${error.message}`)
          results.push({ name: table, count: 0, hasData: false })
        } else {
          const recordCount = count || 0
          const hasData = recordCount > 0
          results.push({ name: table, count: recordCount, hasData })

          if (hasData) {
            console.log(`✅ ${recordCount} enregistrements trouvés`)
          } else {
            console.log(`ℹ️ Table vide`)
          }
        }
      } catch (error: any) {
        console.log(`❌ Erreur inattendue: ${error.message}`)
        results.push({ name: table, count: 0, hasData: false })
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(50))
    console.log('📊 RÉSUMÉ DE LA VÉRIFICATION')
    console.log('='.repeat(50))

    const tablesWithData = results.filter(t => t.hasData)
    const emptyTables = results.filter(t => !t.hasData)

    console.log(`✅ Tables avec données: ${tablesWithData.length}`)
    console.log(`ℹ️ Tables vides: ${emptyTables.length}`)

    if (tablesWithData.length > 0) {
      console.log('\n📋 Tables contenant des données:')
      tablesWithData.forEach(table => {
        console.log(`  ✅ ${table.name}: ${table.count} enregistrements`)
      })
    }

    if (emptyTables.length > 0) {
      console.log('\n📋 Tables vides:')
      emptyTables.forEach(table => {
        console.log(`  ℹ️ ${table.name}: 0 enregistrements`)
      })
    }

    // Calcul du total
    const totalRecords = results.reduce((sum, table) => sum + table.count, 0)
    console.log(`\n📈 TOTAL: ${totalRecords} enregistrements dans ${tablesWithData.length} tables`)

    return {
      totalRecords,
      tablesWithData: tablesWithData.length,
      emptyTables: emptyTables.length,
      results
    }
  }

  async testConnection() {
    try {
      console.log('\n🔗 Test de connexion Supabase...')

      // Test simple avec une table qui devrait exister
      const { data, error } = await this.client
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        console.log(`❌ Test de connexion échoué: ${error.message}`)
        return false
      } else {
        console.log(`✅ Connexion Supabase réussie`)
        return true
      }
    } catch (error: any) {
      console.log(`❌ Erreur de connexion: ${error.message}`)
      return false
    }
  }
}

// Exécution
async function main() {
  const verifier = new DevDataVerifier()

  // Test de connexion d'abord
  const isConnected = await verifier.testConnection()

  if (!isConnected) {
    console.log('\n💡 Impossible de se connecter à Supabase DEV')
    console.log('Solutions possibles:')
    console.log('1. Vérifiez que le projet Supabase DEV est actif')
    console.log('2. Vérifiez les variables d\'environnement dans env-backup/.env.development')
    console.log('3. Le projet peut être en pause (mode gratuit)')
    return
  }

  // Vérification des données
  await verifier.verifyData()
}

main().catch(console.error)