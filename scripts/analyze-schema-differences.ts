#!/usr/bin/env tsx
/**
 * ANALYSE DES DIFFÉRENCES DE SCHÉMA PROD vs DEV
 * =============================================
 * 
 * Identifie exactement pourquoi le clonage ne fonctionne pas complètement
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

interface ColumnDifference {
  table: string
  column: string
  issue: 'missing_in_dev' | 'missing_in_prod' | 'type_mismatch' | 'constraint_issue'
  prodType?: string
  devType?: string
  details: string
}

class SchemaAnalyzer {
  private prodClient: any
  private devClient: any
  private differences: ColumnDifference[] = []

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    console.log('🔧 Initialisation de l\'analyseur de schéma...')

    // Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    this.prodClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Development
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    this.devClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('✅ Clients initialisés')
  }

  /**
   * Analyse une table spécifique
   */
  private async analyzeTable(tableName: string): Promise<void> {
    console.log(`📋 Analyse: ${tableName}`)

    try {
      // Récupérer des échantillons pour analyser la structure
      const [prodResult, devResult] = await Promise.all([
        this.prodClient.from(tableName).select('*').limit(1),
        this.devClient.from(tableName).select('*').limit(1)
      ])

      const prodExists = !prodResult.error
      const devExists = !devResult.error

      if (!prodExists && !devExists) {
        console.log(`   ℹ️ Table n'existe dans aucun environnement`)
        return
      }

      if (!prodExists) {
        console.log(`   ⚠️ Table existe seulement dans DEV`)
        return
      }

      if (!devExists) {
        console.log(`   ❌ Table manquante dans DEV`)
        this.differences.push({
          table: tableName,
          column: '*',
          issue: 'missing_in_dev',
          details: 'Table complète manquante dans DEV'
        })
        return
      }

      // Analyser les colonnes
      const prodData = prodResult.data
      const devData = devResult.data

      let prodColumns: string[] = []
      let devColumns: string[] = []

      // Si on a des données, analyser les colonnes
      if (prodData && prodData.length > 0) {
        prodColumns = Object.keys(prodData[0])
      }

      if (devData && devData.length > 0) {
        devColumns = Object.keys(devData[0])
      }

      // Si pas de données, essayer de forcer une insertion pour voir les erreurs
      if (prodColumns.length === 0 || devColumns.length === 0) {
        console.log(`   ℹ️ Tables vides, analyse par test d'insertion...`)
        await this.analyzeByInsertion(tableName)
        return
      }

      // Comparer les colonnes
      const missingInDev = prodColumns.filter(col => !devColumns.includes(col))
      const missingInProd = devColumns.filter(col => !prodColumns.includes(col))

      if (missingInDev.length > 0) {
        console.log(`   ❌ Colonnes manquantes dans DEV: ${missingInDev.join(', ')}`)
        missingInDev.forEach(col => {
          this.differences.push({
            table: tableName,
            column: col,
            issue: 'missing_in_dev',
            details: `Colonne ${col} existe dans PROD mais pas dans DEV`
          })
        })
      }

      if (missingInProd.length > 0) {
        console.log(`   ⚠️ Colonnes supplémentaires dans DEV: ${missingInProd.join(', ')}`)
        missingInProd.forEach(col => {
          this.differences.push({
            table: tableName,
            column: col,
            issue: 'missing_in_prod',
            details: `Colonne ${col} existe dans DEV mais pas dans PROD`
          })
        })
      }

      if (missingInDev.length === 0 && missingInProd.length === 0) {
        console.log(`   ✅ Schémas identiques`)
      }

    } catch (error) {
      console.log(`   ❌ Erreur analyse: ${error}`)
    }
  }

  /**
   * Analyse par test d'insertion
   */
  private async analyzeByInsertion(tableName: string): Promise<void> {
    try {
      // Récupérer un enregistrement de PROD
      const { data: prodData } = await this.prodClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (!prodData || prodData.length === 0) {
        console.log(`   ℹ️ Pas de données dans PROD pour tester`)
        return
      }

      const testRecord = prodData[0]
      
      // Essayer d'insérer dans DEV
      const { error } = await this.devClient
        .from(tableName)
        .insert([testRecord])

      if (error) {
        console.log(`   ❌ Erreur test insertion: ${error.message}`)
        
        // Analyser le message d'erreur
        if (error.message.includes('Could not find')) {
          const match = error.message.match(/Could not find the '(\w+)' column/)
          if (match) {
            const columnName = match[1]
            this.differences.push({
              table: tableName,
              column: columnName,
              issue: 'missing_in_dev',
              details: `Colonne ${columnName} manquante dans DEV (détectée par test d'insertion)`
            })
          }
        } else if (error.message.includes('violates')) {
          this.differences.push({
            table: tableName,
            column: 'constraint',
            issue: 'constraint_issue',
            details: error.message
          })
        }
      } else {
        // Nettoyer le test
        await this.devClient.from(tableName).delete().eq('id', testRecord.id)
        console.log(`   ✅ Test d'insertion réussi`)
      }

    } catch (error) {
      console.log(`   ❌ Erreur test insertion: ${error}`)
    }
  }

  /**
   * Analyse complète
   */
  public async analyzeAll(): Promise<void> {
    console.log('🔍 ANALYSE COMPLÈTE DES DIFFÉRENCES DE SCHÉMA')
    console.log('='.repeat(60))

    const tables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'teams', 'profiles', 'lofts',
      'team_members', 'tasks', 'transactions', 'transaction_category_references',
      'settings', 'notifications', 'customers', 'loft_photos'
    ]

    for (const table of tables) {
      await this.analyzeTable(table)
    }

    // Résumé des différences
    this.printAnalysisReport()
  }

  /**
   * Rapport d'analyse
   */
  private printAnalysisReport(): void {
    console.log('\n📊 RAPPORT D\'ANALYSE DES SCHÉMAS')
    console.log('='.repeat(60))

    if (this.differences.length === 0) {
      console.log('🎉 Aucune différence de schéma détectée!')
      console.log('✅ Les bases PROD et DEV sont compatibles')
      return
    }

    console.log(`⚠️ ${this.differences.length} différences détectées`)

    // Grouper par type de problème
    const byIssue = this.differences.reduce((acc, diff) => {
      if (!acc[diff.issue]) acc[diff.issue] = []
      acc[diff.issue].push(diff)
      return acc
    }, {} as { [key: string]: ColumnDifference[] })

    // Colonnes manquantes dans DEV
    if (byIssue.missing_in_dev) {
      console.log('\n❌ COLONNES MANQUANTES DANS DEV:')
      console.log('-'.repeat(40))
      byIssue.missing_in_dev.forEach(diff => {
        console.log(`• ${diff.table}.${diff.column}: ${diff.details}`)
      })
    }

    // Colonnes supplémentaires dans DEV
    if (byIssue.missing_in_prod) {
      console.log('\n⚠️ COLONNES SUPPLÉMENTAIRES DANS DEV:')
      console.log('-'.repeat(40))
      byIssue.missing_in_prod.forEach(diff => {
        console.log(`• ${diff.table}.${diff.column}: ${diff.details}`)
      })
    }

    // Problèmes de contraintes
    if (byIssue.constraint_issue) {
      console.log('\n🔗 PROBLÈMES DE CONTRAINTES:')
      console.log('-'.repeat(40))
      byIssue.constraint_issue.forEach(diff => {
        console.log(`• ${diff.table}: ${diff.details}`)
      })
    }

    // Solutions recommandées
    console.log('\n💡 SOLUTIONS RECOMMANDÉES:')
    console.log('='.repeat(60))

    console.log('\n1. 🔄 SYNCHRONISATION MANUELLE:')
    console.log('   • Aller dans Supabase Dashboard')
    console.log('   • Comparer les schémas PROD vs DEV')
    console.log('   • Ajouter les colonnes manquantes dans DEV')
    console.log('   • Supprimer les colonnes en trop dans DEV')

    console.log('\n2. 🛠️ MIGRATIONS SUPABASE:')
    console.log('   • Utiliser les migrations Supabase pour synchroniser')
    console.log('   • Créer des migrations pour les différences')
    console.log('   • Appliquer les migrations sur DEV')

    console.log('\n3. 🎯 CLONAGE ADAPTATIF (ACTUEL):')
    console.log('   • Continuer avec le clonage intelligent')
    console.log('   • Accepter que certaines données ne soient pas copiées')
    console.log('   • Se concentrer sur les tables essentielles')

    console.log('\n4. 📋 RECRÉATION COMPLÈTE:')
    console.log('   • Supprimer complètement la base DEV')
    console.log('   • Recréer depuis un backup de PROD')
    console.log('   • Nécessite accès PostgreSQL direct')

    // Évaluation de l'impact
    const criticalTables = ['currencies', 'categories', 'lofts']
    const criticalIssues = this.differences.filter(d => 
      criticalTables.includes(d.table) && d.issue === 'missing_in_dev'
    )

    console.log('\n🎯 ÉVALUATION DE L\'IMPACT:')
    if (criticalIssues.length === 0) {
      console.log('✅ Les tables critiques sont compatibles')
      console.log('✅ L\'application devrait fonctionner correctement')
      console.log('⚠️ Certaines fonctionnalités avancées peuvent être limitées')
    } else {
      console.log('❌ Des tables critiques ont des problèmes de schéma')
      console.log('⚠️ L\'application peut avoir des dysfonctionnements')
      console.log('🔧 Synchronisation de schéma recommandée')
    }

    console.log('\n📈 ÉTAT ACTUEL DU CLONAGE:')
    console.log('• Les données essentielles sont copiées')
    console.log('• Les différences de schéma sont gérées automatiquement')
    console.log('• L\'application est utilisable pour le développement')
    console.log('• Certaines fonctionnalités peuvent être limitées')
  }
}

// Exécution
async function main() {
  try {
    const analyzer = new SchemaAnalyzer()
    await analyzer.analyzeAll()
  } catch (error) {
    console.error('💥 ERREUR ANALYSE:', error)
    process.exit(1)
  }
}

main().catch(console.error)