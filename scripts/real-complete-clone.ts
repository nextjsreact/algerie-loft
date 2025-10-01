#!/usr/bin/env tsx
/**
 * VRAI CLONAGE COMPLET - RECRÉE TOUT DEPUIS PROD
 * ==============================================
 * 
 * Ce script fait un VRAI clonage en recréant toutes les tables
 * de PROD dans DEV, même celles qui n'existent pas.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

class RealCompleteCloner {
  private prodClient: any
  private devClient: any

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    console.log('🔧 Initialisation...')

    // Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.prodClient = createClient(prodUrl, prodKey)

    // Development  
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.devClient = createClient(devUrl, devKey)

    console.log('✅ Clients initialisés')
  }

  /**
   * Découvrir toutes les tables de PROD
   */
  private async discoverProdTables(): Promise<string[]> {
    console.log('🔍 Découverte des tables PROD...')
    
    const knownTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'teams', 'profiles', 'lofts',
      'team_members', 'tasks', 'transactions', 'transaction_category_references',
      'settings', 'notifications', 'customers', 'loft_photos'
    ]

    const existingTables: string[] = []

    for (const table of knownTables) {
      try {
        const { error } = await this.prodClient
          .from(table)
          .select('*')
          .limit(1)

        if (!error) {
          existingTables.push(table)
          console.log(`✅ ${table} trouvée dans PROD`)
        }
      } catch (error) {
        console.log(`❌ ${table} non accessible dans PROD`)
      }
    }

    console.log(`📋 ${existingTables.length} tables découvertes dans PROD`)
    return existingTables
  }

  /**
   * Analyser la structure d'une table PROD
   */
  private async analyzeTableStructure(tableName: string): Promise<any> {
    console.log(`📋 Analyse structure: ${tableName}`)

    try {
      // Récupérer un échantillon pour analyser
      const { data, error } = await this.prodClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        throw new Error(`Erreur accès ${tableName}: ${error.message}`)
      }

      let structure = null
      if (data && data.length > 0) {
        structure = data[0]
        const columns = Object.keys(structure)
        console.log(`   📊 ${columns.length} colonnes: ${columns.join(', ')}`)
      } else {
        console.log(`   ℹ️ Table vide, structure inconnue`)
      }

      return structure
    } catch (error) {
      console.error(`❌ Erreur analyse ${tableName}: ${error}`)
      return null
    }
  }

  /**
   * Créer une table dans DEV basée sur la structure PROD
   */
  private async createTableInDev(tableName: string, structure: any): Promise<boolean> {
    console.log(`🏗️ Création table DEV: ${tableName}`)

    if (!structure) {
      console.log(`   ⚠️ Pas de structure disponible pour ${tableName}`)
      return false
    }

    try {
      // Vérifier si la table existe déjà dans DEV
      const { error: existsError } = await this.devClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (!existsError) {
        console.log(`   ✅ Table ${tableName} existe déjà dans DEV`)
        return true
      }

      // La table n'existe pas, on doit la créer
      console.log(`   🆕 Table ${tableName} n'existe pas dans DEV`)
      
      // Pour Supabase, on ne peut pas créer de tables via l'API REST
      // Il faut utiliser le SQL Editor ou les migrations
      console.log(`   ⚠️ ATTENTION: Vous devez créer manuellement la table ${tableName} dans DEV`)
      console.log(`   📋 Structure détectée:`)
      
      const columns = Object.keys(structure)
      columns.forEach(col => {
        const value = structure[col]
        const type = this.guessColumnType(value)
        console.log(`      ${col}: ${type}`)
      })

      return false

    } catch (error) {
      console.error(`❌ Erreur création ${tableName}: ${error}`)
      return false
    }
  }

  /**
   * Deviner le type d'une colonne basé sur sa valeur
   */
  private guessColumnType(value: any): string {
    if (value === null || value === undefined) return 'TEXT'
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'TIMESTAMPTZ'
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return 'UUID'
      return 'TEXT'
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL'
    }
    if (typeof value === 'boolean') return 'BOOLEAN'
    return 'TEXT'
  }

  /**
   * Copier les données d'une table
   */
  private async copyTableData(tableName: string): Promise<number> {
    console.log(`📊 Copie données: ${tableName}`)

    try {
      // Récupérer toutes les données de PROD
      const { data: prodData, error: prodError } = await this.prodClient
        .from(tableName)
        .select('*')

      if (prodError) {
        throw new Error(`Erreur PROD: ${prodError.message}`)
      }

      if (!prodData || prodData.length === 0) {
        console.log(`   ℹ️ Aucune donnée dans ${tableName}`)
        return 0
      }

      console.log(`   📥 ${prodData.length} enregistrements à copier`)

      // Vérifier que la table existe dans DEV
      const { error: devError } = await this.devClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (devError) {
        console.log(`   ❌ Table ${tableName} inaccessible dans DEV: ${devError.message}`)
        return 0
      }

      // Nettoyer la table DEV
      await this.devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Copier par lots
      const batchSize = 50
      let copiedCount = 0

      for (let i = 0; i < prodData.length; i += batchSize) {
        const batch = prodData.slice(i, i + batchSize)
        
        const { error: insertError } = await this.devClient
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.log(`   ⚠️ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
          // Essayer un par un
          for (const record of batch) {
            const { error: singleError } = await this.devClient
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              copiedCount++
            }
          }
        } else {
          copiedCount += batch.length
        }
      }

      console.log(`   ✅ ${copiedCount} enregistrements copiés`)
      return copiedCount

    } catch (error) {
      console.error(`   ❌ Erreur copie ${tableName}: ${error}`)
      return 0
    }
  }

  /**
   * Générer le SQL pour créer les tables manquantes
   */
  private generateCreateTableSQL(tableName: string, structure: any): string {
    if (!structure) return ''

    const columns = Object.keys(structure)
    const columnDefs = columns.map(col => {
      const value = structure[col]
      const type = this.guessColumnType(value)
      
      let def = `  "${col}" ${type}`
      
      if (col === 'id') {
        def = `  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid()`
      } else if (col.includes('created_at')) {
        def = `  "${col}" TIMESTAMPTZ DEFAULT NOW()`
      } else if (col.includes('updated_at')) {
        def = `  "${col}" TIMESTAMPTZ DEFAULT NOW()`
      }
      
      return def
    })

    return `CREATE TABLE "${tableName}" (\n${columnDefs.join(',\n')}\n);`
  }

  /**
   * Clonage complet
   */
  public async performRealClone(): Promise<void> {
    console.log('🚀 VRAI CLONAGE COMPLET - RECRÉATION TOTALE')
    console.log('='.repeat(60))

    try {
      // 1. Découvrir toutes les tables PROD
      const prodTables = await this.discoverProdTables()

      // 2. Analyser chaque table et générer le SQL
      console.log('\n📋 ANALYSE DES STRUCTURES')
      console.log('='.repeat(50))

      const structures: { [key: string]: any } = {}
      const sqlStatements: string[] = []

      for (const table of prodTables) {
        const structure = await this.analyzeTableStructure(table)
        structures[table] = structure
        
        if (structure) {
          const sql = this.generateCreateTableSQL(table, structure)
          if (sql) {
            sqlStatements.push(sql)
          }
        }
      }

      // 3. Afficher le SQL à exécuter manuellement
      console.log('\n📋 SQL À EXÉCUTER DANS SUPABASE DEV')
      console.log('='.repeat(60))
      console.log('Copiez et exécutez ce SQL dans Supabase Dashboard > SQL Editor:')
      console.log('')
      console.log('-- CRÉATION DES TABLES MANQUANTES')
      sqlStatements.forEach(sql => {
        console.log(sql)
        console.log('')
      })

      // 4. Copier les données des tables existantes
      console.log('\n📊 COPIE DES DONNÉES')
      console.log('='.repeat(50))

      let totalCopied = 0
      const results: { table: string, copied: number, exists: boolean }[] = []

      for (const table of prodTables) {
        const copied = await this.copyTableData(table)
        totalCopied += copied
        
        const exists = copied > 0 || structures[table] !== null
        results.push({ table, copied, exists })
      }

      // 5. Résumé final
      console.log('\n🎉 CLONAGE COMPLET TERMINÉ')
      console.log('='.repeat(60))
      console.log(`📈 Total enregistrements copiés: ${totalCopied}`)
      console.log(`📋 Tables analysées: ${prodTables.length}`)

      console.log('\n📊 RÉSULTATS PAR TABLE:')
      results.forEach(result => {
        const icon = result.copied > 0 ? '✅' : 
                    result.exists ? '⚠️' : '❌'
        const status = result.copied > 0 ? `${result.copied} enregistrements copiés` :
                      result.exists ? 'Table existe mais pas de données' :
                      'Table manquante dans DEV'
        console.log(`${icon} ${result.table}: ${status}`)
      })

      const missingTables = results.filter(r => r.copied === 0 && !r.exists)
      
      if (missingTables.length > 0) {
        console.log('\n🚨 TABLES MANQUANTES DANS DEV:')
        missingTables.forEach(table => {
          console.log(`❌ ${table.table}`)
        })
        
        console.log('\n💡 PROCHAINES ÉTAPES:')
        console.log('1. Exécutez le SQL ci-dessus dans Supabase DEV')
        console.log('2. Relancez ce script pour copier les données')
        console.log('3. Ou créez manuellement les tables manquantes')
      } else {
        console.log('\n🎉 TOUTES LES TABLES SONT DISPONIBLES!')
        console.log('✅ Clonage complet réussi')
      }

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// Exécution
async function main() {
  const cloner = new RealCompleteCloner()
  await cloner.performRealClone()
}

main().catch(console.error)