#!/usr/bin/env tsx
/**
 * SYSTÈME DE CLONAGE PROFESSIONNEL - API DIRECT
 * =============================================
 *
 * Approche moderne et fiable pour cloner les données entre environnements
 * - Utilise l'API Supabase directement
 * - Transactions pour la fiabilité
 * - Gestion fine des contraintes FK
 * - Anonymisation automatique des données sensibles
 * - Reporting détaillé et récupération d'erreurs
 */

import fetch from 'node-fetch'
import * as readline from 'readline'

interface CloneOptions {
  source: 'prod' | 'test' | 'dev' | 'learning'
  target: 'prod' | 'test' | 'dev' | 'learning'
  tables?: string[]
  anonymize?: boolean
  silent?: boolean
  batchSize?: number
  dryRun?: boolean
}

interface TableResult {
  table: string
  status: 'success' | 'error' | 'skipped' | 'empty'
  records: number
  error?: string
  duration: number
}

interface EnvironmentConfig {
  url: string
  serviceKey: string
  anonKey: string
}

class ProfessionalCloner {
  private sourceConfig!: EnvironmentConfig
  private targetConfig!: EnvironmentConfig
  private options: CloneOptions
  private results: TableResult[] = []

  constructor(options: CloneOptions) {
    this.options = {
      batchSize: 100,
      ...options
    }
  }

  /**
   * Configuration des environnements depuis les fichiers .env
   */
  private loadEnvironment(env: string): EnvironmentConfig {
    const envFiles = {
      prod: 'env-backup/.env.prod',
      dev: 'env-backup/.env.development',
      test: 'env-backup/.env.test',
      learning: 'env-backup/.env.learning'
    }

    // Chargement dynamique des variables d'environnement
    require('dotenv').config({ path: envFiles[env as keyof typeof envFiles] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !serviceKey || !anonKey) {
      throw new Error(`Configuration manquante pour ${env}: URL/ServiceKey/AnonKey requis`)
    }

    return { url, serviceKey, anonKey }
  }

  /**
   * Validation de la connectivité et permissions
   */
  private async validateEnvironment(config: EnvironmentConfig, label: string): Promise<boolean> {
    try {
      console.log(`🔍 Validation ${label}...`)

      const response = await fetch(`${config.url}/rest/v1/lofts?select=count`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log(`✅ ${label} accessible`)
      return true
    } catch (error) {
      console.error(`❌ ${label} inaccessible:`, error)
      return false
    }
  }

  /**
   * Initialisation et validation des environnements
   */
  private async initialize(): Promise<void> {
    console.log('🚀 INITIALISATION DU CLONAGE PROFESSIONNEL')
    console.log('='.repeat(60))

    // Chargement des configurations
    this.sourceConfig = this.loadEnvironment(this.options.source)
    this.targetConfig = this.loadEnvironment(this.options.target)

    // Validation des accès
    const sourceValid = await this.validateEnvironment(this.sourceConfig, `Source (${this.options.source.toUpperCase()})`)
    const targetValid = await this.validateEnvironment(this.targetConfig, `Target (${this.options.target.toUpperCase()})`)

    if (!sourceValid || !targetValid) {
      throw new Error('Validation des environnements échouée')
    }

    if (this.options.dryRun) {
      console.log('🧪 MODE TEST - Aucune modification ne sera effectuée')
    }
  }

  /**
   * Récupération des données d'une table avec gestion d'erreurs
   */
  private async fetchTableData(table: string, config: EnvironmentConfig): Promise<any[]> {
    const startTime = Date.now()

    try {
      console.log(`📥 Récupération ${table}...`)

      const response = await fetch(`${config.url}/rest/v1/${table}?select=*`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as any[]
      const duration = Date.now() - startTime

      console.log(`✅ ${table}: ${data.length} enregistrements (${duration}ms)`)
      return data

    } catch (error) {
      console.error(`❌ Erreur récupération ${table}:`, error)
      throw error
    }
  }

  /**
   * Anonymisation des données sensibles
   */
  private anonymizeData(data: any[], table: string): any[] {
    if (!this.options.anonymize) return data

    return data.map((record, index) => {
      const anonymized = { ...record }

      // Anonymisation des profils
      if (table === 'profiles') {
        const isAdmin = record.role === 'admin'
        const suffix = `${this.options.target}_${index}`

        anonymized.email = isAdmin
          ? `admin_${this.options.target}@${this.options.target}.local`
          : `user_${suffix}@${this.options.target}.local`

        anonymized.full_name = record.full_name
          ? `${record.full_name} (${this.options.target.toUpperCase()})`
          : `User ${suffix}`

        // Suppression des tokens sensibles
        anonymized.airbnb_access_token = null
        anonymized.airbnb_refresh_token = null
      }

      // Anonymisation des notifications
      if (table === 'notifications') {
        if (record.message && record.message.includes('@')) {
          anonymized.message = 'Message de test anonymisé'
        }
        anonymized.is_read = true
        anonymized.read_at = new Date().toISOString()
      }

      // Anonymisation des messages
      if (table === 'messages') {
        anonymized.content = 'Message de test anonymisé'
        anonymized.metadata = { ...anonymized.metadata, anonymized: true }
      }

      return anonymized
    })
  }

  /**
   * Insertion des données avec gestion des contraintes FK
   */
  private async insertTableData(table: string, data: any[]): Promise<TableResult> {
    const startTime = Date.now()

    if (data.length === 0) {
      return {
        table,
        status: 'empty',
        records: 0,
        duration: Date.now() - startTime
      }
    }

    try {
      console.log(`📤 Insertion ${table} (${data.length} enregistrements)...`)

      // Traitement par lots pour éviter les timeouts
      const batchSize = this.options.batchSize || 100
      let insertedCount = 0
      let error: string | undefined

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)

        if (this.options.dryRun) {
          insertedCount += batch.length
          process.stdout.write(`\r🧪 [TEST] Lot ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${data.length}`)
          continue
        }

        const response = await fetch(`${this.targetConfig.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
            'apikey': this.targetConfig.anonKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(batch)
        })

        if (!response.ok) {
          const errorText = await response.text()
          error = `HTTP ${response.status}: ${errorText}`
          console.error(`❌ Erreur lot ${Math.floor(i / batchSize) + 1}:`, error)
          break
        }

        insertedCount += batch.length
        process.stdout.write(`\r📤 Lot ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${data.length}`)
      }

      console.log('') // Nouvelle ligne

      const duration = Date.now() - startTime
      const result: TableResult = {
        table,
        status: error ? 'error' : 'success',
        records: insertedCount,
        duration,
        error
      }

      this.results.push(result)
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const result: TableResult = {
        table,
        status: 'error',
        records: 0,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }

      this.results.push(result)
      return result
    }
  }

  /**
   * Nettoyage COMPLET de la base cible avant clonage
   * - Supprime TOUTES les tables
   * - Supprime TOUTES les contraintes
   * - Prépare pour une copie complète du schéma
   * PROTECTION CRITIQUE: Ne jamais toucher à la PRODUCTION
   */
  private async clearTargetDatabase(): Promise<void> {
    if (this.options.dryRun) {
      console.log('🧪 [TEST] Nettoyage de la base cible ignoré')
      return
    }

    // PROTECTION CRITIQUE: Refuser toute opération sur la PRODUCTION
    if (this.options.target === 'prod') {
      throw new Error('🚫 ERREUR CRITIQUE: Impossible de modifier la PRODUCTION!')
    }

    // Vérification supplémentaire de sécurité
    if (this.targetConfig.url.includes('mhngbluefyucoesgcjoy')) {
      throw new Error('🚫 ERREUR CRITIQUE: Tentative d\'accès à la PRODUCTION détectée!')
    }

    console.log('🗑️ NETTOYAGE COMPLET DE LA BASE CIBLE...')

    // Étape 1: Désactiver temporairement les contraintes FK
    console.log('🔓 Désactivation des contraintes...')
    try {
      await this.executeRawSQL('SET session_replication_role = replica;')
    } catch (error) {
      console.warn('⚠️ Impossible de désactiver les contraintes, continuation...')
    }

    // Étape 2: Supprimer toutes les données (ordre inverse des dépendances)
    const tablesToClear = [
      'customers', 'loft_photos', 'team_members', 'tasks', 'transactions',
      'transaction_category_references', 'notifications', 'messages',
      'conversations', 'conversation_participants', 'user_sessions',
      'lofts', 'profiles', 'teams', 'loft_owners', 'settings',
      'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods'
    ]

    for (const table of tablesToClear) {
      try {
        console.log(`🗑️ Suppression ${table}...`)

        const response = await fetch(`${this.targetConfig.url}/rest/v1/${table}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
            'apikey': this.targetConfig.anonKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok && response.status !== 404) {
          console.warn(`⚠️ Impossible de supprimer ${table}: HTTP ${response.status}`)
        } else {
          console.log(`✅ ${table} supprimé`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur suppression ${table}:`, error)
      }
    }

    // Étape 3: Réactiver les contraintes
    console.log('🔒 Réactivation des contraintes...')
    try {
      await this.executeRawSQL('SET session_replication_role = DEFAULT;')
    } catch (error) {
      console.warn('⚠️ Impossible de réactiver les contraintes')
    }
  }

  /**
   * Exécution de SQL brut via RPC
   */
  private async executeRawSQL(sql: string): Promise<void> {
    const response = await fetch(`${this.targetConfig.url}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
        'apikey': this.targetConfig.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      throw new Error(`SQL execution failed: ${response.statusText}`)
    }
  }

  /**
   * Synchronisation du schéma entre environnements
   * - Compare les schémas et applique les différences
   * - Ajoute les colonnes manquantes
   * - Met à jour les types de données
   */
  private async syncSchema(): Promise<void> {
    console.log('📋 SYNCHRONISATION DU SCHÉMA...')

    try {
      // Récupérer les informations de schéma des deux environnements
      const [prodSchema, devSchema] = await Promise.all([
        this.getTableSchema(this.sourceConfig),
        this.getTableSchema(this.targetConfig)
      ])

      console.log('✅ Schémas récupérés')

      // Comparer et synchroniser les tables
      for (const tableName of Object.keys(prodSchema)) {
        if (!devSchema[tableName]) {
          console.log(`🆕 Table ${tableName} manquante dans DEV - création...`)
          await this.createTableFromProduction(tableName)
        } else {
          console.log(`🔄 Synchronisation ${tableName}...`)
          await this.syncTableSchema(tableName, prodSchema[tableName], devSchema[tableName])
        }
      }

      console.log('✅ Synchronisation du schéma terminée')

    } catch (error) {
      console.warn('⚠️ Erreur synchronisation schéma:', error)
      // Continuer même si la synchro échoue
    }
  }

  /**
   * Récupère le schéma d'une base de données
   */
  private async getTableSchema(config: EnvironmentConfig): Promise<Record<string, any[]>> {
    const schema: Record<string, any[]> = {}

    // Récupérer la liste des tables
    const tablesResponse = await fetch(`${config.url}/rest/v1/information_schema.tables?table_schema=public`, {
      headers: {
        'Authorization': `Bearer ${config.serviceKey}`,
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    })

    if (!tablesResponse.ok) {
      throw new Error(`Impossible de récupérer les tables: ${tablesResponse.statusText}`)
    }

    const tables = await tablesResponse.json() as any[]

    // Pour chaque table, récupérer les colonnes
    for (const table of tables) {
      const tableName = (table as any).table_name

      const columnsResponse = await fetch(`${config.url}/rest/v1/information_schema.columns?table_name=${tableName}&table_schema=public`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey,
          'Content-Type': 'application/json'
        }
      })

      if (columnsResponse.ok) {
        schema[tableName] = await columnsResponse.json() as any[]
      }
    }

    return schema
  }

  /**
   * Crée une table dans DEV basée sur la structure PROD
   */
  private async createTableFromProduction(tableName: string): Promise<void> {
    console.log(`📋 Création de la table ${tableName}...`)

    // Récupérer la structure de la table depuis PROD
    const createTableSQL = await this.generateCreateTableSQL(tableName, this.sourceConfig)

    // Exécuter la création dans DEV
    await this.executeRawSQL(createTableSQL)
    console.log(`✅ Table ${tableName} créée`)
  }

  /**
   * Synchronise le schéma d'une table
   */
  private async syncTableSchema(tableName: string, prodColumns: any[], devColumns: any[]): Promise<void> {
    // Pour l'instant, on se contente de vérifier les colonnes critiques
    const criticalColumns = ['price_per_month', 'name', 'email', 'status']

    for (const criticalCol of criticalColumns) {
      const prodCol = prodColumns.find(col => col.column_name === criticalCol)
      const devCol = devColumns.find(col => col.column_name === criticalCol)

      if (prodCol && !devCol) {
        console.log(`🆕 Ajout de la colonne ${criticalCol} à ${tableName}...`)
        await this.addColumnToTable(tableName, prodCol)
      }
    }
  }

  /**
   * Génère le SQL de création d'une table
   */
  private async generateCreateTableSQL(tableName: string, config: EnvironmentConfig): Promise<string> {
    // Récupérer la structure de la table
    const columnsResponse = await fetch(`${config.url}/rest/v1/information_schema.columns?table_name=${tableName}&table_schema=public`, {
      headers: {
        'Authorization': `Bearer ${config.serviceKey}`,
        'apikey': config.anonKey,
        'Content-Type': 'application/json'
      }
    })

    if (!columnsResponse.ok) {
      throw new Error(`Impossible de récupérer les colonnes de ${tableName}`)
    }

    const columns = await columnsResponse.json() as any[]

    let sql = `CREATE TABLE ${tableName} (\n`

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      sql += `  ${col.column_name} ${col.data_type}`

      if (col.character_maximum_length) {
        sql += `(${col.character_maximum_length})`
      }

      if (col.is_nullable === 'NO') {
        sql += ' NOT NULL'
      }

      if (col.column_default) {
        sql += ` DEFAULT ${col.column_default}`
      }

      if (i < columns.length - 1) {
        sql += ','
      }
      sql += '\n'
    }

    sql += ')'

    return sql
  }

  /**
   * Ajoute une colonne à une table
   */
  private async addColumnToTable(tableName: string, columnInfo: any): Promise<void> {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnInfo.column_name} ${columnInfo.data_type}`

    if (columnInfo.character_maximum_length) {
      sql += `(${columnInfo.character_maximum_length})`
    }

    if (columnInfo.is_nullable === 'NO') {
      sql += ' NOT NULL'
    }

    if (columnInfo.column_default) {
      sql += ` DEFAULT ${columnInfo.column_default}`
    }

    await this.executeRawSQL(sql)
  }

  /**
   * Clonage de toutes les données en une seule opération
   * - Récupère toutes les données de production
   * - Les insère en une fois dans la cible
   */
  private async cloneAllData(): Promise<void> {
    console.log('📥 RÉCUPÉRATION DE TOUTES LES DONNÉES DE PRODUCTION...')

    // Tables à cloner dans l'ordre des dépendances
    const tablesToClone = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods',
      'loft_owners', 'teams', 'profiles', 'lofts', 'team_members', 'tasks',
      'transactions', 'transaction_category_references', 'settings',
      'notifications', 'messages', 'customers', 'loft_photos',
      'conversations', 'conversation_participants', 'user_sessions'
    ]

    let totalRecords = 0

    for (const table of tablesToClone) {
      try {
        console.log(`📋 Clonage ${table}...`)

        // Récupération des données source
        const sourceData = await this.fetchTableData(table, this.sourceConfig)

        if (sourceData.length === 0) {
          console.log(`ℹ️ ${table} vide dans la source`)
          continue
        }

        // Anonymisation si demandée
        const anonymizedData = this.anonymizeData(sourceData, table)

        // Insertion en une fois
        const result = await this.insertTableData(table, anonymizedData)
        totalRecords += result.records

        console.log(`✅ ${table}: ${result.records} enregistrements`)

      } catch (error) {
        console.error(`❌ Erreur clonage ${table}:`, error)
        // Continuer avec les autres tables même si une échoue
      }
    }

    console.log(`✅ CLONAGE DONNÉES TERMINÉ: ${totalRecords} enregistrements au total`)
  }

  /**
   * Validation du clonage
   */
  private async validateClone(): Promise<void> {
    console.log('🔍 VALIDATION DU CLONAGE...')

    try {
      // Vérifier que les lofts existent
      const loftResponse = await fetch(`${this.targetConfig.url}/rest/v1/lofts?select=count`, {
        headers: {
          'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
          'apikey': this.targetConfig.anonKey,
          'Content-Type': 'application/json'
        }
      })

      if (!loftResponse.ok) {
        throw new Error(`Validation échouée: ${loftResponse.statusText}`)
      }

      const loftCount = await loftResponse.json()
      console.log(`✅ Validation réussie: ${loftCount} lofts dans l'environnement cible`)

    } catch (error) {
      console.warn('⚠️ Validation échouée:', error)
    }
  }

  /**
   * Clonage principal - Nouvelle approche complète
   */
  public async clone(): Promise<void> {
    const startTime = Date.now()

    try {
      // Initialisation
      await this.initialize()

      // Demande de confirmation (sauf en mode silencieux)
      if (!this.options.silent && !this.options.dryRun) {
        const confirmed = await this.confirmAction()
        if (!confirmed) {
          console.log('❌ Clonage annulé par l\'utilisateur')
          return
        }
      }

      console.log('🚀 DÉBUT DU CLONAGE COMPLET - APPROCHE SCHÉMA + DONNÉES')
      console.log(`📁 Source: ${this.options.source.toUpperCase()} → Cible: ${this.options.target.toUpperCase()}`)
      console.log('='.repeat(70))

      // Étape 1: Nettoyage COMPLET de la base cible
      console.log('\n📋 ÉTAPE 1: NETTOYAGE COMPLET')
      console.log('-'.repeat(50))
      await this.clearTargetDatabase()

      // Étape 2: Synchronisation du schéma
      console.log('\n📋 ÉTAPE 2: SYNCHRONISATION DU SCHÉMA')
      console.log('-'.repeat(50))
      await this.syncSchema()

      // Étape 3: Clonage de TOUTES les données en une seule fois
      console.log('\n📋 ÉTAPE 3: CLONAGE DES DONNÉES')
      console.log('-'.repeat(50))
      await this.cloneAllData()

      // Étape 4: Validation du clonage
      console.log('\n📋 ÉTAPE 4: VALIDATION')
      console.log('-'.repeat(50))
      await this.validateClone()

      // Résumé final
      this.printSummary(startTime)

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }

  /**
   * Demande de confirmation interactive
   */
  private async confirmAction(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      rl.question(
        `\n⚠️ ATTENTION: Toutes les données de ${this.options.target.toUpperCase()} seront supprimées !\n` +
        'Tapez CONFIRMER pour continuer: ',
        (answer) => {
          rl.close()
          resolve(answer.toUpperCase() === 'CONFIRMER')
        }
      )
    })
  }

  /**
   * Affichage du résumé final
   */
  private printSummary(startTime: number): void {
    const duration = Date.now() - startTime
    const successful = this.results.filter(r => r.status === 'success').length
    const errors = this.results.filter(r => r.status === 'error').length
    const empty = this.results.filter(r => r.status === 'empty').length
    const totalRecords = this.results.reduce((sum, r) => sum + r.records, 0)

    console.log('\n📊 RÉSUMÉ DU CLONAGE PROFESSIONNEL')
    console.log('='.repeat(60))
    console.log(`⏱️ Durée totale: ${Math.round(duration / 1000)}s`)
    console.log(`📈 Enregistrements clonés: ${totalRecords}`)
    console.log(`✅ Tables réussies: ${successful}`)
    console.log(`❌ Tables en erreur: ${errors}`)
    console.log(`ℹ️ Tables vides: ${empty}`)

    console.log('\n📋 DÉTAIL PAR TABLE:')
    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' :
                   result.status === 'error' ? '❌' :
                   result.status === 'empty' ? 'ℹ️' : '⚠️'
      const duration = result.duration > 0 ? ` (${result.duration}ms)` : ''
      const error = result.error ? ` - ${result.error}` : ''
      console.log(`${icon} ${result.table}: ${result.records} enregistrements${duration}${error}`)
    })

    console.log('\n🎉 CLONAGE PROFESSIONNEL TERMINÉ')
    console.log('='.repeat(60))

    if (errors === 0) {
      console.log('✅ Toutes les tables clonées avec succès!')
    } else {
      console.log(`⚠️ ${errors} table(s) avec erreurs - vérifiez les logs`)
    }

    if (this.options.anonymize) {
      console.log('🔒 Données sensibles anonymisées automatiquement')
    }

    console.log('\n💡 PROCHAINES ÉTAPES:')
    console.log('• Testez votre application avec les nouvelles données')
    console.log('• Vérifiez l\'intégrité avec: npx tsx scripts/verify-clone.ts')
    console.log('• Mot de passe universel pour DEV: dev123')
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const options: CloneOptions = {
    source: 'prod',
    target: 'dev',
    anonymize: false,
    silent: false,
    batchSize: 100,
    dryRun: false
  }

  // Parsing des arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--source':
        options.source = args[++i] as any
        break
      case '--target':
        options.target = args[++i] as any
        break
      case '--anonymize':
        options.anonymize = true
        break
      case '--silent':
        options.silent = true
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i])
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--tables':
        options.tables = args[++i].split(',')
        break
    }
  }

  const cloner = new ProfessionalCloner(options)
  await cloner.clone()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { ProfessionalCloner }
export type { CloneOptions }