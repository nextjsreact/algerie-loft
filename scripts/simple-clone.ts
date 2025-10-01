#!/usr/bin/env tsx
/**
 * CLONAGE SIMPLE - APPROCHE DIRECTE
 * =================================
 *
 * Copie directe des données avec nettoyage automatique
 * - Ignore les erreurs de contraintes
 * - Nettoie les données problématiques
 * - Copie table par table dans l'ordre des dépendances
 */

import fetch from 'node-fetch'

interface CloneOptions {
  source: 'prod' | 'test' | 'dev' | 'learning'
  target: 'prod' | 'test' | 'dev' | 'learning'
  silent?: boolean
  dryRun?: boolean
}

interface EnvironmentConfig {
  url: string
  serviceKey: string
  anonKey: string
}

class SimpleCloner {
  private sourceConfig!: EnvironmentConfig
  private targetConfig!: EnvironmentConfig
  private options: CloneOptions

  constructor(options: CloneOptions) {
    this.options = options
  }

  /**
   * Configuration des environnements
   */
  private loadEnvironment(env: string): EnvironmentConfig {
    const envFiles = {
      prod: 'env-backup/.env.prod',
      dev: 'env-backup/.env.development',
      test: 'env-backup/.env.test',
      learning: 'env-backup/.env.learning'
    }

    require('dotenv').config({ path: envFiles[env as keyof typeof envFiles] })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !serviceKey || !anonKey) {
      throw new Error(`Configuration manquante pour ${env}`)
    }

    return { url, serviceKey, anonKey }
  }

  /**
   * Initialisation
   */
  private async initialize(): Promise<void> {
    console.log('🚀 INITIALISATION DU CLONAGE SIMPLE')
    console.log(`📁 Source: ${this.options.source} → Cible: ${this.options.target}`)

    this.sourceConfig = this.loadEnvironment(this.options.source)
    this.targetConfig = this.loadEnvironment(this.options.target)

    // Protection contre la production
    if (this.options.target === 'prod') {
      throw new Error('🚫 Impossible de modifier la PRODUCTION!')
    }

    if (this.options.dryRun) {
      console.log('🧪 MODE TEST - Aucune modification ne sera effectuée')
    }
  }

  /**
   * Nettoie les données problématiques
   */
  private cleanData(data: any[], table: string): any[] {
    return data.map(record => {
      const cleaned = { ...record }

      // Nettoyer les lofts
      if (table === 'lofts') {
        // Définir des valeurs par défaut pour les champs requis
        if (!cleaned.price_per_month) cleaned.price_per_month = 50000
        if (!cleaned.status) cleaned.status = 'available'
        if (!cleaned.company_percentage) cleaned.company_percentage = 50
        if (!cleaned.owner_percentage) cleaned.owner_percentage = 50
        if (!cleaned.name) cleaned.name = 'Loft sans nom'
        if (!cleaned.address) cleaned.address = 'Adresse non spécifiée'
      }

      // Nettoyer les types de connexion internet
      if (table === 'internet_connection_types') {
        if (!cleaned.name) cleaned.name = 'Default'
      }

      // Nettoyer les propriétaires
      if (table === 'loft_owners') {
        if (!cleaned.name) cleaned.name = 'Propriétaire inconnu'
        if (!cleaned.email) cleaned.email = 'owner@unknown.com'
      }

      // Nettoyer les profils
      if (table === 'profiles') {
        if (!cleaned.email) cleaned.email = `user_${Math.random().toString(36).substr(2, 9)}@localhost`
        if (!cleaned.full_name) cleaned.full_name = 'Utilisateur anonyme'
      }

      return cleaned
    })
  }

  /**
   * Récupère les données d'une table
   */
  private async fetchTableData(table: string, config: EnvironmentConfig): Promise<any[]> {
    try {
      console.log(`📥 Récupération ${table}...`)

      const response = await fetch(`${config.url}/rest/v1/${table}?select=*`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`⚠️ Erreur récupération ${table}: HTTP ${response.status}`)
        return []
      }

      const data = await response.json() as any[]
      console.log(`✅ ${table}: ${data.length} enregistrements`)
      return data

    } catch (error) {
      console.warn(`⚠️ Erreur récupération ${table}:`, error)
      return []
    }
  }

  /**
   * Insère les données dans la table cible
   */
  private async insertTableData(table: string, data: any[]): Promise<void> {
    if (data.length === 0) {
      console.log(`ℹ️ ${table} vide - ignoré`)
      return
    }

    if (this.options.dryRun) {
      console.log(`🧪 [TEST] ${table}: ${data.length} enregistrements`)
      return
    }

    try {
      console.log(`📤 Insertion ${table} (${data.length} enregistrements)...`)

      const response = await fetch(`${this.targetConfig.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
          'apikey': this.targetConfig.anonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        console.log(`✅ ${table}: ${data.length} enregistrements insérés`)
      } else {
        const errorText = await response.text()
        console.warn(`⚠️ Erreur insertion ${table}: HTTP ${response.status} - ${errorText}`)

        // Essayer d'insérer enregistrement par enregistrement
        console.log(`🔄 Tentative d'insertion individuelle pour ${table}...`)
        let successCount = 0

        for (const record of data) {
          try {
            const singleResponse = await fetch(`${this.targetConfig.url}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
                'apikey': this.targetConfig.anonKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(record)
            })

            if (singleResponse.ok) {
              successCount++
            }
          } catch (error) {
            // Ignorer les erreurs individuelles
          }
        }

        if (successCount > 0) {
          console.log(`✅ ${table}: ${successCount}/${data.length} enregistrements insérés`)
        }
      }

    } catch (error) {
      console.warn(`⚠️ Erreur insertion ${table}:`, error)
    }
  }

  /**
   * Clonage principal
   */
  public async clone(): Promise<void> {
    try {
      await this.initialize()

      // Ordre de clonage respectant les contraintes FK
      const tablesToClone = [
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
        'messages',
        'customers',
        'loft_photos'
      ]

      console.log(`\n🔄 CLONAGE DE ${tablesToClone.length} TABLES`)
      console.log('='.repeat(50))

      let totalRecords = 0

      for (const table of tablesToClone) {
        try {
          console.log(`\n📋 TABLE: ${table}`)
          console.log('-'.repeat(30))

          // Récupération des données source
          const sourceData = await this.fetchTableData(table, this.sourceConfig)

          if (sourceData.length === 0) {
            console.log(`ℹ️ ${table} vide dans la source`)
            continue
          }

          // Nettoyage des données
          const cleanedData = this.cleanData(sourceData, table)

          // Insertion dans la cible
          await this.insertTableData(table, cleanedData)
          totalRecords += cleanedData.length

        } catch (error) {
          console.error(`💥 Erreur clonage ${table}:`, error)
        }
      }

      console.log(`\n🎉 CLONAGE TERMINÉ: ${totalRecords} enregistrements copiés`)

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2)
  const options: CloneOptions = {
    source: 'prod',
    target: 'dev',
    silent: false,
    dryRun: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--source':
        options.source = args[++i] as any
        break
      case '--target':
        options.target = args[++i] as any
        break
      case '--silent':
        options.silent = true
        break
      case '--dry-run':
        options.dryRun = true
        break
    }
  }

  const cloner = new SimpleCloner(options)
  await cloner.clone()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { SimpleCloner }