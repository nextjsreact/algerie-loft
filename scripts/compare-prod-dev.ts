#!/usr/bin/env tsx
/**
 * Script de comparaison détaillée entre PROD et DEV
 * Identifie les différences de données et de schéma
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

interface EnvironmentConfig {
  name: string
  file: string
  client?: any
  url?: string
  serviceKey?: string
}

interface TableComparison {
  table: string
  prodCount: number
  devCount: number
  difference: number
  status: 'missing_in_dev' | 'missing_in_prod' | 'different_count' | 'equal'
  prodError?: string
  devError?: string
}

class ProdDevComparator {
  private prodConfig: EnvironmentConfig = { name: 'prod', file: 'env-backup/.env.prod' }
  private devConfig: EnvironmentConfig = { name: 'dev', file: 'env-backup/.env.development' }

  constructor() {
    this.loadEnvironments()
    this.initializeClients()
  }

  private loadEnvironments() {
    // Load PROD
    const prodRes = dotenv.config({ path: this.prodConfig.file })
    if (prodRes.error) {
      throw new Error(`Impossible de charger ${this.prodConfig.file}: ${prodRes.error.message}`)
    }

    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!prodUrl || !prodServiceKey) {
      throw new Error('Variables PROD manquantes')
    }

    this.prodConfig.url = prodUrl
    this.prodConfig.serviceKey = prodServiceKey

    // Load DEV
    const devRes = dotenv.config({ path: this.devConfig.file })
    if (devRes.error) {
      throw new Error(`Impossible de charger ${this.devConfig.file}: ${devRes.error.message}`)
    }

    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!devUrl || !devServiceKey) {
      throw new Error('Variables DEV manquantes')
    }

    this.devConfig.url = devUrl
    this.devConfig.serviceKey = devServiceKey
  }

  private initializeClients() {
    this.prodConfig.client = createClient(
      this.prodConfig.url!,
      this.prodConfig.serviceKey!,
      { auth: { persistSession: false } }
    )

    this.devConfig.client = createClient(
      this.devConfig.url!,
      this.devConfig.serviceKey!,
      { auth: { persistSession: false } }
    )
  }

  async getTableCount(client: any, table: string): Promise<{ count: number; error?: string }> {
    try {
      const { count, error } = await client
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        return { count: 0, error: error.message }
      }

      return { count: count || 0 }
    } catch (error: any) {
      return { count: 0, error: error.message }
    }
  }

  async compareTables(): Promise<TableComparison[]> {
    console.log('🔍 COMPARAISON PROD vs DEV')
    console.log('='.repeat(60))

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
      'messages',
      'user_sessions',
      'conversation_participants',
      'conversations',
      'loft_availability',
      'reservations',
      'customers',
      'guest_communications'
    ]

    const comparisons: TableComparison[] = []

    for (const table of tables) {
      console.log(`\n📋 Comparaison de la table: ${table}`)

      const prodResult = await this.getTableCount(this.prodConfig.client, table)
      const devResult = await this.getTableCount(this.devConfig.client, table)

      const prodCount = prodResult.count
      const devCount = devResult.count
      const difference = prodCount - devCount

      let status: TableComparison['status']
      if (prodResult.error && !devResult.error) {
        status = 'missing_in_prod'
      } else if (!prodResult.error && devResult.error) {
        status = 'missing_in_dev'
      } else if (difference === 0) {
        status = 'equal'
      } else {
        status = 'different_count'
      }

      const comparison: TableComparison = {
        table,
        prodCount,
        devCount,
        difference,
        status,
        prodError: prodResult.error,
        devError: devResult.error
      }

      comparisons.push(comparison)

      // Affichage détaillé
      if (prodResult.error) {
        console.log(`  ❌ PROD: Erreur - ${prodResult.error}`)
      } else {
        console.log(`  📊 PROD: ${prodCount} enregistrements`)
      }

      if (devResult.error) {
        console.log(`  ❌ DEV: Erreur - ${devResult.error}`)
      } else {
        console.log(`  📊 DEV: ${devCount} enregistrements`)
      }

      if (status === 'equal') {
        console.log(`  ✅ ÉGAL`)
      } else if (status === 'different_count') {
        console.log(`  ⚠️ DIFFÉRENCE: ${difference > 0 ? '+' : ''}${difference}`)
      } else if (status === 'missing_in_dev') {
        console.log(`  ❌ MANQUANT dans DEV`)
      } else if (status === 'missing_in_prod') {
        console.log(`  ❌ MANQUANT dans PROD`)
      }
    }

    return comparisons
  }

  async generateReport(comparisons: TableComparison[]) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 RAPPORT DE COMPARAISON')
    console.log('='.repeat(60))

    const equalTables = comparisons.filter(c => c.status === 'equal')
    const differentTables = comparisons.filter(c => c.status === 'different_count')
    const missingInDev = comparisons.filter(c => c.status === 'missing_in_dev')
    const missingInProd = comparisons.filter(c => c.status === 'missing_in_prod')
    const errors = comparisons.filter(c => c.prodError || c.devError)

    console.log(`✅ Tables identiques: ${equalTables.length}`)
    console.log(`⚠️ Tables avec différences: ${differentTables.length}`)
    console.log(`❌ Tables manquantes dans DEV: ${missingInDev.length}`)
    console.log(`❌ Tables manquantes dans PROD: ${missingInProd.length}`)
    console.log(`💥 Tables avec erreurs: ${errors.length}`)

    // Détail des différences
    if (differentTables.length > 0) {
      console.log('\n📋 TABLES AVEC DIFFÉRENCES:')
      differentTables.forEach(table => {
        const diff = table.difference > 0 ? `-${table.difference}` : `+${Math.abs(table.difference)}`
        console.log(`  ⚠️ ${table.table}: PROD=${table.prodCount}, DEV=${table.devCount} (${diff})`)
      })
    }

    if (missingInDev.length > 0) {
      console.log('\n📋 TABLES MANQUANTES DANS DEV:')
      missingInDev.forEach(table => {
        console.log(`  ❌ ${table.table}: PROD=${table.prodCount}, DEV=ERREUR`)
      })
    }

    if (errors.length > 0) {
      console.log('\n📋 TABLES AVEC ERREURS:')
      errors.forEach(table => {
        if (table.prodError) console.log(`  ❌ ${table.table} (PROD): ${table.prodError}`)
        if (table.devError) console.log(`  ❌ ${table.table} (DEV): ${table.devError}`)
      })
    }

    // Calcul du total
    const totalProd = comparisons.reduce((sum, c) => sum + (c.prodError ? 0 : c.prodCount), 0)
    const totalDev = comparisons.reduce((sum, c) => sum + (c.devError ? 0 : c.devCount), 0)

    console.log('\n📈 RÉSUMÉ GLOBAL:')
    console.log(`  📊 PROD: ${totalProd} enregistrements au total`)
    console.log(`  📊 DEV: ${totalDev} enregistrements au total`)
    console.log(`  📊 DIFFÉRENCE: ${totalProd - totalDev > 0 ? '+' : ''}${totalProd - totalDev}`)

    return {
      equalTables: equalTables.length,
      differentTables: differentTables.length,
      missingInDev: missingInDev.length,
      missingInProd: missingInProd.length,
      errors: errors.length,
      totalProd,
      totalDev
    }
  }

  async runComparison() {
    try {
      console.log('🔍 COMPARAISON DÉTAILLÉE PROD vs DEV')
      console.log('='.repeat(60))
      console.log(`📤 PROD: ${this.prodConfig.url}`)
      console.log(`🎯 DEV: ${this.devConfig.url}`)
      console.log('='.repeat(60))

      const comparisons = await this.compareTables()
      const report = await this.generateReport(comparisons)

      console.log('\n💡 RECOMMANDATIONS:')
      if (report.differentTables > 0 || report.missingInDev > 0) {
        console.log('1. 🚀 Re-exécuter le script de clonage avec l\'option --truncate')
        console.log('2. 🔍 Vérifier les différences de schéma entre PROD et DEV')
        console.log('3. 📋 Utiliser le script de clonage complet: clone-database-pg.ts')
      } else {
        console.log('✅ Les données sont synchronisées correctement!')
      }

      return report
    } catch (error: any) {
      console.error('❌ Erreur lors de la comparaison:', error.message)
      throw error
    }
  }
}

// Exécution
async function main() {
  const comparator = new ProdDevComparator()
  await comparator.runComparison()
}

main().catch(console.error)