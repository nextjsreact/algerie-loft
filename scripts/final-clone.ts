#!/usr/bin/env tsx
/**
 * CLONAGE FINAL - APPROCHE ÉTAPE PAR ÉTAPE
 * =========================================
 *
 * Stratégie:
 * 1. Copier d'abord les données de référence (sans contraintes)
 * 2. Puis les propriétaires (simples)
 * 3. Ensuite les profils (avec gestion des emails)
 * 4. Enfin les lofts (avec nettoyage des données)
 */

import fetch from 'node-fetch'
import { config } from 'dotenv'

interface EnvironmentConfig {
  url: string
  serviceKey: string
  anonKey: string
}

class FinalCloner {
  private sourceConfig!: EnvironmentConfig
  private targetConfig!: EnvironmentConfig

  constructor() {}

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

    config({ path: envFiles[env as keyof typeof envFiles] })

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
  private async initialize(source: string, target: string): Promise<void> {
    console.log('🚀 INITIALISATION DU CLONAGE FINAL')
    console.log(`📁 Source: ${source} → Cible: ${target}`)

    this.sourceConfig = this.loadEnvironment(source)
    this.targetConfig = this.loadEnvironment(target)

    // Protection contre la production
    if (target === 'prod') {
      throw new Error('🚫 Impossible de modifier la PRODUCTION!')
    }

    console.log('✅ Environnements configurés')
  }

  /**
   * Nettoie les données problématiques
   */
  private cleanData(data: any[], table: string): any[] {
    return data.map((record, index) => {
      const cleaned = { ...record }

      // Nettoyer les lofts
      if (table === 'lofts') {
        // Définir des valeurs par défaut pour les champs requis
        if (!cleaned.price_per_month) cleaned.price_per_month = 50000
        if (!cleaned.status) cleaned.status = 'available'
        if (!cleaned.company_percentage) cleaned.company_percentage = 50
        if (!cleaned.owner_percentage) cleaned.owner_percentage = 50
        if (!cleaned.name) cleaned.name = `Loft ${index + 1}`
        if (!cleaned.address) cleaned.address = `Adresse ${index + 1}`
      }

      // Nettoyer les propriétaires
      if (table === 'loft_owners') {
        if (!cleaned.name) cleaned.name = `Propriétaire ${index + 1}`
        if (!cleaned.email) cleaned.email = `owner${index + 1}@localhost`
      }

      // Nettoyer les profils
      if (table === 'profiles') {
        if (!cleaned.email) cleaned.email = `user${index + 1}@localhost`
        if (!cleaned.full_name) cleaned.full_name = `Utilisateur ${index + 1}`
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
   * Insère les données avec gestion d'erreurs robuste
   */
  private async insertTableData(table: string, data: any[]): Promise<number> {
    if (data.length === 0) {
      console.log(`ℹ️ ${table} vide - ignoré`)
      return 0
    }

    console.log(`📤 Insertion ${table} (${data.length} enregistrements)...`)

    // Essayer d'abord l'insertion en lot
    try {
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
        return data.length
      } else {
        console.warn(`⚠️ Insertion en lot échouée pour ${table}, tentative individuelle...`)
      }
    } catch (error) {
      console.warn(`⚠️ Erreur insertion en lot ${table}:`, error)
    }

    // Insertion individuelle avec gestion d'erreurs
    let successCount = 0
    for (let i = 0; i < data.length; i++) {
      const record = data[i]

      try {
        const response = await fetch(`${this.targetConfig.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.targetConfig.serviceKey}`,
            'apikey': this.targetConfig.anonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        })

        if (response.ok) {
          successCount++
        } else {
          // Log mais continue
          console.warn(`⚠️ Échec insertion ${i + 1}/${data.length} pour ${table}`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur insertion ${i + 1}/${data.length} pour ${table}:`, error)
      }
    }

    console.log(`✅ ${table}: ${successCount}/${data.length} enregistrements insérés`)
    return successCount
  }

  /**
   * Clonage par étapes
   */
  public async clone(source: string, target: string): Promise<void> {
    try {
      await this.initialize(source, target)

      // Étape 1: Données de référence (sans contraintes)
      console.log('\n📋 ÉTAPE 1: DONNÉES DE RÉFÉRENCE')
      console.log('='.repeat(50))

      const referenceTables = ['currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods']
      let totalRecords = 0

      for (const table of referenceTables) {
        const sourceData = await this.fetchTableData(table, this.sourceConfig)
        if (sourceData.length > 0) {
          const cleanedData = this.cleanData(sourceData, table)
          const inserted = await this.insertTableData(table, cleanedData)
          totalRecords += inserted
        }
      }

      // Étape 2: Propriétaires (dépendances simples)
      console.log('\n📋 ÉTAPE 2: PROPRIÉTAIRES')
      console.log('='.repeat(50))

      const ownerData = await this.fetchTableData('loft_owners', this.sourceConfig)
      if (ownerData.length > 0) {
        const cleanedOwners = this.cleanData(ownerData, 'loft_owners')
        const inserted = await this.insertTableData('loft_owners', cleanedOwners)
        totalRecords += inserted
      }

      // Étape 3: Profils (avec gestion des emails)
      console.log('\n📋 ÉTAPE 3: PROFILS')
      console.log('='.repeat(50))

      const profileData = await this.fetchTableData('profiles', this.sourceConfig)
      if (profileData.length > 0) {
        const cleanedProfiles = this.cleanData(profileData, 'profiles')
        const inserted = await this.insertTableData('profiles', cleanedProfiles)
        totalRecords += inserted
      }

      // Étape 4: Lofts (données principales)
      console.log('\n📋 ÉTAPE 4: LOFTS')
      console.log('='.repeat(50))

      const loftData = await this.fetchTableData('lofts', this.sourceConfig)
      if (loftData.length > 0) {
        const cleanedLofts = this.cleanData(loftData, 'lofts')
        const inserted = await this.insertTableData('lofts', cleanedLofts)
        totalRecords += inserted
      }

      // Étape 5: Autres tables
      console.log('\n📋 ÉTAPE 5: TABLES SUPPLÉMENTAIRES')
      console.log('='.repeat(50))

      const otherTables = ['teams', 'team_members', 'tasks', 'transactions', 'transaction_category_references', 'settings', 'notifications', 'messages']
      for (const table of otherTables) {
        const sourceData = await this.fetchTableData(table, this.sourceConfig)
        if (sourceData.length > 0) {
          const cleanedData = this.cleanData(sourceData, table)
          const inserted = await this.insertTableData(table, cleanedData)
          totalRecords += inserted
        }
      }

      console.log(`\n🎉 CLONAGE FINAL TERMINÉ: ${totalRecords} enregistrements copiés`)

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2)
  const source = args.find(arg => arg.startsWith('--source='))?.split('=')[1] || 'prod'
  const target = args.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'dev'

  const cloner = new FinalCloner()
  await cloner.clone(source, target)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { FinalCloner }