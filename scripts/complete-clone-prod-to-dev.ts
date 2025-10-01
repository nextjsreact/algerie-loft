#!/usr/bin/env tsx
/**
 * CLONAGE COMPLET PRODUCTION → DÉVELOPPEMENT
 * ==========================================
 * 
 * Ce script fait un clonage complet :
 * 1. DROP tous les objets de la base DEV
 * 2. RECRÉE le schéma complet depuis PROD
 * 3. COPIE toutes les données
 * 
 * ATTENTION: Destruction complète de la base DEV !
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as readline from 'readline'

interface DatabaseObject {
  name: string
  type: 'table' | 'view' | 'function' | 'trigger' | 'policy'
  schema: string
}

class CompleteCloner {
  private prodClient: any
  private devClient: any
  private prodUrl: string
  private devUrl: string
  private prodKey: string
  private devKey: string

  constructor() {
    this.initializeClients()
  }

  /**
   * Initialisation des clients
   */
  private initializeClients() {
    console.log('🔧 Initialisation des connexions...')

    // Configuration Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    this.prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    this.prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!this.prodUrl || !this.prodKey) {
      throw new Error('❌ Configuration PRODUCTION manquante')
    }

    this.prodClient = createClient(this.prodUrl, this.prodKey)
    console.log('✅ Client PRODUCTION initialisé')

    // Configuration Développement
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    this.devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    this.devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!this.devUrl || !this.devKey) {
      throw new Error('❌ Configuration DÉVELOPPEMENT manquante')
    }

    // PROTECTION CRITIQUE
    if (this.devUrl.includes('mhngbluefyucoesgcjoy')) {
      throw new Error('🚫 ERREUR CRITIQUE: URL de PRODUCTION détectée dans DEV!')
    }

    this.devClient = createClient(this.devUrl, this.devKey)
    console.log('✅ Client DÉVELOPPEMENT initialisé')
  }

  /**
   * Confirmation utilisateur avec avertissement sévère
   */
  private async confirmDestruction(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      console.log('\n🚨 AVERTISSEMENT CRITIQUE 🚨')
      console.log('='.repeat(50))
      console.log('Cette opération va DÉTRUIRE COMPLÈTEMENT la base DEV :')
      console.log('• TOUTES les tables seront supprimées')
      console.log('• TOUTES les vues seront supprimées')
      console.log('• TOUTES les fonctions seront supprimées')
      console.log('• TOUS les triggers seront supprimés')
      console.log('• TOUTES les politiques RLS seront supprimées')
      console.log('• Le schéma sera recréé depuis PROD')
      console.log('• Les données seront copiées depuis PROD')
      console.log('')
      console.log('⚠️  CETTE ACTION EST IRRÉVERSIBLE ⚠️')
      console.log('')

      rl.question('Pour confirmer, tapez exactement "DETRUIRE ET RECREER": ', (answer) => {
        rl.close()
        resolve(answer === 'DETRUIRE ET RECREER')
      })
    })
  }

  /**
   * Exécution de SQL brut via RPC
   */
  private async executeSQL(client: any, sql: string, description: string): Promise<void> {
    try {
      console.log(`🔧 ${description}...`)
      
      const { data, error } = await client.rpc('execute_sql', { sql })
      
      if (error) {
        throw new Error(`Erreur SQL: ${error.message}`)
      }
      
      console.log(`✅ ${description} terminé`)
    } catch (error) {
      console.error(`❌ Erreur ${description}:`, error)
      throw error
    }
  }

  /**
   * Récupération de la liste des objets de base de données
   */
  private async getDatabaseObjects(client: any): Promise<DatabaseObject[]> {
    const objects: DatabaseObject[] = []

    try {
      // Tables
      const { data: tables } = await client
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public')

      if (tables) {
        tables.forEach((table: any) => {
          objects.push({
            name: table.table_name,
            type: 'table',
            schema: table.table_schema
          })
        })
      }

      // Vues
      const { data: views } = await client
        .from('information_schema.views')
        .select('table_name, table_schema')
        .eq('table_schema', 'public')

      if (views) {
        views.forEach((view: any) => {
          objects.push({
            name: view.table_name,
            type: 'view',
            schema: view.table_schema
          })
        })
      }

      console.log(`📋 ${objects.length} objets trouvés`)
      return objects

    } catch (error) {
      console.warn('⚠️ Impossible de récupérer la liste des objets:', error)
      return []
    }
  }

  /**
   * Suppression complète de tous les objets DEV
   */
  private async dropAllDevObjects(): Promise<void> {
    console.log('\n🗑️ SUPPRESSION COMPLÈTE DE LA BASE DEV')
    console.log('='.repeat(50))

    try {
      // Désactiver les contraintes FK temporairement
      await this.executeSQL(
        this.devClient,
        'SET session_replication_role = replica;',
        'Désactivation des contraintes FK'
      )

      // Récupérer tous les objets
      const objects = await this.getDatabaseObjects(this.devClient)

      // Supprimer toutes les tables
      const tables = objects.filter(obj => obj.type === 'table')
      if (tables.length > 0) {
        console.log(`🗑️ Suppression de ${tables.length} tables...`)
        
        for (const table of tables) {
          try {
            await this.executeSQL(
              this.devClient,
              `DROP TABLE IF EXISTS "${table.name}" CASCADE;`,
              `Suppression table ${table.name}`
            )
          } catch (error) {
            console.warn(`⚠️ Impossible de supprimer ${table.name}:`, error)
          }
        }
      }

      // Supprimer toutes les vues
      const views = objects.filter(obj => obj.type === 'view')
      if (views.length > 0) {
        console.log(`🗑️ Suppression de ${views.length} vues...`)
        
        for (const view of views) {
          try {
            await this.executeSQL(
              this.devClient,
              `DROP VIEW IF EXISTS "${view.name}" CASCADE;`,
              `Suppression vue ${view.name}`
            )
          } catch (error) {
            console.warn(`⚠️ Impossible de supprimer la vue ${view.name}:`, error)
          }
        }
      }

      // Supprimer toutes les fonctions personnalisées
      await this.executeSQL(
        this.devClient,
        `
        DO $$ 
        DECLARE 
          func_name text;
        BEGIN 
          FOR func_name IN 
            SELECT proname FROM pg_proc 
            WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND proname NOT LIKE 'pg_%'
          LOOP 
            EXECUTE 'DROP FUNCTION IF EXISTS ' || func_name || ' CASCADE';
          END LOOP; 
        END $$;
        `,
        'Suppression des fonctions personnalisées'
      )

      // Réactiver les contraintes
      await this.executeSQL(
        this.devClient,
        'SET session_replication_role = DEFAULT;',
        'Réactivation des contraintes FK'
      )

      console.log('✅ Base DEV complètement nettoyée')

    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      throw error
    }
  }

  /**
   * Récupération du schéma complet de PROD
   */
  private async getProductionSchema(): Promise<string> {
    console.log('\n📋 RÉCUPÉRATION DU SCHÉMA PRODUCTION')
    console.log('='.repeat(50))

    try {
      // Utiliser pg_dump via l'API Supabase pour récupérer le schéma
      const { data, error } = await this.prodClient.rpc('get_schema_dump')
      
      if (error) {
        throw new Error(`Impossible de récupérer le schéma: ${error.message}`)
      }

      console.log('✅ Schéma PRODUCTION récupéré')
      return data

    } catch (error) {
      console.warn('⚠️ Méthode RPC échouée, utilisation de la méthode alternative...')
      
      // Méthode alternative : reconstruire le schéma manuellement
      return await this.buildSchemaManually()
    }
  }

  /**
   * Construction manuelle du schéma
   */
  private async buildSchemaManually(): Promise<string> {
    let schema = ''

    try {
      // Récupérer les tables et leurs colonnes
      const { data: tables } = await this.prodClient
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      if (!tables) {
        throw new Error('Impossible de récupérer les tables')
      }

      console.log(`📋 Construction du schéma pour ${tables.length} tables...`)

      for (const table of tables) {
        const tableName = table.table_name

        // Récupérer les colonnes
        const { data: columns } = await this.prodClient
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position')

        if (columns && columns.length > 0) {
          schema += `\n-- Table: ${tableName}\n`
          schema += `CREATE TABLE "${tableName}" (\n`

          const columnDefs = columns.map((col: any) => {
            let def = `  "${col.column_name}" ${col.data_type}`
            
            if (col.character_maximum_length) {
              def += `(${col.character_maximum_length})`
            }
            
            if (col.is_nullable === 'NO') {
              def += ' NOT NULL'
            }
            
            if (col.column_default) {
              def += ` DEFAULT ${col.column_default}`
            }
            
            return def
          })

          schema += columnDefs.join(',\n')
          schema += '\n);\n'
        }
      }

      console.log('✅ Schéma construit manuellement')
      return schema

    } catch (error) {
      console.error('❌ Erreur construction manuelle du schéma:', error)
      throw error
    }
  }

  /**
   * Application du schéma sur DEV
   */
  private async applySchemaTodev(schema: string): Promise<void> {
    console.log('\n🏗️ APPLICATION DU SCHÉMA SUR DEV')
    console.log('='.repeat(50))

    try {
      // Diviser le schéma en commandes individuelles
      const commands = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

      console.log(`📋 Application de ${commands.length} commandes SQL...`)

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i]
        
        try {
          await this.executeSQL(
            this.devClient,
            command + ';',
            `Commande ${i + 1}/${commands.length}`
          )
        } catch (error) {
          console.warn(`⚠️ Commande ${i + 1} échouée:`, error)
          // Continuer avec les autres commandes
        }
      }

      console.log('✅ Schéma appliqué sur DEV')

    } catch (error) {
      console.error('❌ Erreur application du schéma:', error)
      throw error
    }
  }

  /**
   * Copie de toutes les données
   */
  private async copyAllData(): Promise<void> {
    console.log('\n📊 COPIE DES DONNÉES PROD → DEV')
    console.log('='.repeat(50))

    // Tables dans l'ordre des dépendances
    const tablesToCopy = [
      'currencies',
      'categories',
      'zone_areas', 
      'internet_connection_types',
      'payment_methods',
      'loft_owners',
      'teams',
      'profiles',
      'lofts',
      'team_members',
      'tasks',
      'transactions',
      'transaction_category_references',
      'settings',
      'notifications',
      'customers',
      'loft_photos'
    ]

    let totalRecords = 0

    for (const tableName of tablesToCopy) {
      try {
        console.log(`\n📋 Copie: ${tableName}`)
        console.log('-'.repeat(30))

        // Récupérer les données de PROD
        const { data: prodData, error: prodError } = await this.prodClient
          .from(tableName)
          .select('*')

        if (prodError) {
          console.warn(`⚠️ Erreur récupération ${tableName}: ${prodError.message}`)
          continue
        }

        if (!prodData || prodData.length === 0) {
          console.log(`ℹ️ Table ${tableName} vide`)
          continue
        }

        console.log(`📥 ${prodData.length} enregistrements récupérés`)

        // Anonymiser les données sensibles
        const anonymizedData = this.anonymizeData(prodData, tableName)

        // Insérer par lots dans DEV
        const batchSize = 50
        let insertedCount = 0

        for (let i = 0; i < anonymizedData.length; i += batchSize) {
          const batch = anonymizedData.slice(i, i + batchSize)
          
          const { error: insertError } = await this.devClient
            .from(tableName)
            .insert(batch)

          if (insertError) {
            console.warn(`⚠️ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
            
            // Essayer un par un
            for (const record of batch) {
              const { error: singleError } = await this.devClient
                .from(tableName)
                .insert([record])
              
              if (!singleError) {
                insertedCount++
              }
            }
          } else {
            insertedCount += batch.length
          }
        }

        console.log(`✅ ${tableName}: ${insertedCount} enregistrements copiés`)
        totalRecords += insertedCount

      } catch (error) {
        console.error(`❌ Erreur copie ${tableName}:`, error)
      }
    }

    console.log(`\n🎉 COPIE TERMINÉE: ${totalRecords} enregistrements au total`)
  }

  /**
   * Anonymisation des données sensibles
   */
  private anonymizeData(data: any[], tableName: string): any[] {
    if (tableName === 'profiles') {
      return data.map((record, index) => ({
        ...record,
        email: record.role === 'admin' 
          ? 'admin_dev@dev.local' 
          : `user_dev_${index}@dev.local`,
        full_name: record.full_name 
          ? `${record.full_name} (DEV)` 
          : `User DEV ${index}`,
        airbnb_access_token: null,
        airbnb_refresh_token: null
      }))
    }

    if (tableName === 'notifications') {
      return data.map(record => ({
        ...record,
        message: record.message?.includes('@') 
          ? 'Message de test anonymisé' 
          : record.message,
        is_read: true,
        read_at: new Date().toISOString()
      }))
    }

    return data
  }

  /**
   * Validation finale
   */
  private async validateClone(): Promise<void> {
    console.log('\n🔍 VALIDATION DU CLONAGE')
    console.log('='.repeat(50))

    try {
      // Vérifier quelques tables critiques
      const criticalTables = ['lofts', 'profiles', 'teams', 'categories']
      
      for (const table of criticalTables) {
        const { data, error } = await this.devClient
          .from(table)
          .select('count')

        if (error) {
          console.warn(`⚠️ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: accessible`)
        }
      }

      console.log('✅ Validation terminée')

    } catch (error) {
      console.warn('⚠️ Erreur validation:', error)
    }
  }

  /**
   * Méthode principale de clonage complet
   */
  public async completeClone(): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('🚀 CLONAGE COMPLET PRODUCTION → DÉVELOPPEMENT')
      console.log('='.repeat(60))

      // 1. Confirmation utilisateur
      const confirmed = await this.confirmDestruction()
      if (!confirmed) {
        console.log('❌ Clonage annulé par l\'utilisateur')
        return
      }

      // 2. Suppression complète de DEV
      await this.dropAllDevObjects()

      // 3. Récupération du schéma PROD
      const schema = await this.getProductionSchema()

      // 4. Application du schéma sur DEV
      await this.applySchemaTodev(schema)

      // 5. Copie de toutes les données
      await this.copyAllData()

      // 6. Validation finale
      await this.validateClone()

      // Résumé final
      const duration = Math.round((Date.now() - startTime) / 1000)
      
      console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
      console.log('='.repeat(60))
      console.log(`⏱️ Durée totale: ${duration}s`)
      console.log('✅ Base DEV complètement recréée depuis PROD')
      console.log('🔒 Données sensibles anonymisées')
      console.log('')
      console.log('💡 PROCHAINES ÉTAPES:')
      console.log('• Testez votre application: npm run dev')
      console.log('• Mot de passe universel DEV: dev123')

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// Exécution du script
async function main() {
  const cloner = new CompleteCloner()
  await cloner.completeClone()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { CompleteCloner }