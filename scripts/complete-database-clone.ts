import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Charger les variables d'environnement
dotenv.config({ path: '.env.production' })

const environments = {
  prod: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\r?\n/g, '') || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r?\n/g, '') || ''
  },
  test: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_TEST?.replace(/\r?\n/g, '') || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY_TEST?.replace(/\r?\n/g, '') || ''
  },
  dev: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV?.replace(/\r?\n/g, '') || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV?.replace(/\r?\n/g, '') || ''
  }
}

// TOUTES LES TABLES DÉCOUVERTES (30 tables)
const ALL_TABLES = [
  'bills',
  'categories', 
  'conversation_participants',
  'conversations',
  'critical_alerts',
  'currencies',
  'executive_metrics',
  'executive_permissions',
  'guest_communications',
  'internet_connection_types',
  'loft_availability',
  'loft_owners',
  'loft_photos',
  'lofts',
  'messages',
  'notifications',
  'payment_methods',
  'pricing_rules',
  'profiles',
  'reservation_payments',
  'reservation_reviews',
  'reservations',
  'settings',
  'task_category_references',
  'tasks',
  'team_members',
  'teams',
  'transaction_category_references',
  'transactions',
  'zone_areas'
]

// Tables avec des dépendances (ordre important pour l'insertion)
const TABLE_DEPENDENCIES = {
  // Tables de base (pas de dépendances)
  base: [
    'currencies',
    'zone_areas',
    'categories',
    'internet_connection_types',
    'payment_methods',
    'settings'
  ],
  
  // Tables utilisateurs et équipes
  users: [
    'profiles',
    'teams',
    'team_members'
  ],
  
  // Tables lofts et propriétaires
  lofts: [
    'loft_owners',
    'lofts',
    'loft_photos',
    'loft_availability',
    'pricing_rules'
  ],
  
  // Tables réservations
  reservations: [
    'reservations',
    'reservation_payments',
    'reservation_reviews',
    'guest_communications'
  ],
  
  // Tables transactions et tâches
  operations: [
    'transactions',
    'transaction_category_references',
    'tasks',
    'task_category_references',
    'bills'
  ],
  
  // Tables communications
  communications: [
    'conversations',
    'conversation_participants',
    'messages',
    'notifications'
  ],
  
  // Tables executive et alertes
  executive: [
    'executive_permissions',
    'executive_metrics',
    'critical_alerts'
  ]
}

// Tables sensibles à anonymiser
const SENSITIVE_TABLES = {
  'profiles': ['email', 'full_name', 'password_hash', 'reset_token'],
  'guest_communications': ['guest_email', 'guest_phone', 'guest_name'],
  'reservations': ['guest_email', 'guest_phone', 'guest_name'],
  'messages': ['content'],
  'notifications': ['message']
}

interface CloneOptions {
  sourceEnv: 'prod' | 'test' | 'dev'
  targetEnv: 'prod' | 'test' | 'dev'
  anonymize?: boolean
  excludeTables?: string[]
  includeTables?: string[]
  dryRun?: boolean
  batchSize?: number
}

class CompleteDatabaseClone {
  private sourceClient: any
  private targetClient: any
  private options: CloneOptions
  private stats = {
    tablesProcessed: 0,
    recordsCloned: 0,
    errors: 0,
    startTime: Date.now()
  }

  constructor(options: CloneOptions) {
    this.options = {
      batchSize: 1000,
      ...options
    }
    
    this.sourceClient = createClient(
      environments[options.sourceEnv].url,
      environments[options.sourceEnv].key
    )
    
    this.targetClient = createClient(
      environments[options.targetEnv].url,
      environments[options.targetEnv].key
    )
  }

  async clone() {
    console.log('🚀 CLONAGE COMPLET DE LA BASE DE DONNÉES')
    console.log('=========================================')
    console.log(`📤 Source: ${this.options.sourceEnv.toUpperCase()}`)
    console.log(`📥 Cible: ${this.options.targetEnv.toUpperCase()}`)
    console.log(`🔒 Anonymisation: ${this.options.anonymize ? 'OUI' : 'NON'}`)
    console.log(`🧪 Mode test: ${this.options.dryRun ? 'OUI' : 'NON'}`)
    console.log('')

    // Vérifier les connexions
    await this.verifyConnections()

    // Obtenir la liste des tables à cloner
    const tablesToClone = this.getTablesList()
    console.log(`📋 Tables à cloner: ${tablesToClone.length}`)
    
    if (this.options.dryRun) {
      console.log('🧪 MODE TEST - Aucune donnée ne sera modifiée')
      tablesToClone.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`)
      })
      return
    }

    // Cloner dans l'ordre des dépendances
    const orderedTables = this.getOrderedTables(tablesToClone)
    
    for (const table of orderedTables) {
      await this.cloneTable(table)
    }

    this.printSummary()
  }

  private async verifyConnections() {
    console.log('🔍 Vérification des connexions...')
    
    try {
      const { data: sourceTest } = await this.sourceClient.from('profiles').select('count').limit(1)
      console.log('✅ Connexion source OK')
    } catch (error) {
      throw new Error(`❌ Erreur connexion source: ${error}`)
    }

    try {
      const { data: targetTest } = await this.targetClient.from('profiles').select('count').limit(1)
      console.log('✅ Connexion cible OK')
    } catch (error) {
      throw new Error(`❌ Erreur connexion cible: ${error}`)
    }
  }

  private getTablesList(): string[] {
    let tables = [...ALL_TABLES]
    
    if (this.options.includeTables?.length) {
      tables = tables.filter(t => this.options.includeTables!.includes(t))
    }
    
    if (this.options.excludeTables?.length) {
      tables = tables.filter(t => !this.options.excludeTables!.includes(t))
    }
    
    return tables
  }

  private getOrderedTables(tables: string[]): string[] {
    const ordered: string[] = []
    
    // Ajouter les tables dans l'ordre des dépendances
    Object.values(TABLE_DEPENDENCIES).forEach(group => {
      group.forEach(table => {
        if (tables.includes(table) && !ordered.includes(table)) {
          ordered.push(table)
        }
      })
    })
    
    // Ajouter les tables restantes
    tables.forEach(table => {
      if (!ordered.includes(table)) {
        ordered.push(table)
      }
    })
    
    return ordered
  }

  private async cloneTable(tableName: string) {
    console.log(`\n📋 Clonage de ${tableName}...`)
    
    try {
      // Compter les enregistrements source
      const { count: sourceCount, error: countError } = await this.sourceClient
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.log(`❌ ${tableName}: Erreur de comptage - ${countError.message}`)
        this.stats.errors++
        return
      }

      if (!sourceCount || sourceCount === 0) {
        console.log(`⏭️ ${tableName}: Table vide, ignorée`)
        return
      }

      console.log(`📊 ${tableName}: ${sourceCount} enregistrements à cloner`)

      // Vider la table cible si elle existe
      if (!this.options.dryRun) {
        await this.clearTargetTable(tableName)
      }

      // Cloner par lots
      let offset = 0
      let totalCloned = 0

      while (offset < sourceCount) {
        const { data: batch, error: fetchError } = await this.sourceClient
          .from(tableName)
          .select('*')
          .range(offset, offset + this.options.batchSize! - 1)

        if (fetchError) {
          console.log(`❌ ${tableName}: Erreur de lecture - ${fetchError.message}`)
          this.stats.errors++
          break
        }

        if (!batch || batch.length === 0) break

        // Anonymiser si nécessaire
        const processedBatch = this.options.anonymize ? 
          this.anonymizeData(tableName, batch) : batch

        // Insérer dans la cible
        if (!this.options.dryRun) {
          const { error: insertError } = await this.targetClient
            .from(tableName)
            .insert(processedBatch)

          if (insertError) {
            console.log(`❌ ${tableName}: Erreur d'insertion - ${insertError.message}`)
            this.stats.errors++
            break
          }
        }

        totalCloned += batch.length
        offset += this.options.batchSize!
        
        const progress = Math.round((totalCloned / sourceCount) * 100)
        process.stdout.write(`\r   📈 Progression: ${totalCloned}/${sourceCount} (${progress}%)`)
      }

      console.log(`\n✅ ${tableName}: ${totalCloned} enregistrements clonés`)
      this.stats.tablesProcessed++
      this.stats.recordsCloned += totalCloned

    } catch (error) {
      console.log(`❌ ${tableName}: Erreur générale - ${error}`)
      this.stats.errors++
    }
  }

  private async clearTargetTable(tableName: string) {
    try {
      const { error } = await this.targetClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error && !error.message.includes('No rows found')) {
        console.log(`⚠️ ${tableName}: Erreur de vidage - ${error.message}`)
      }
    } catch (error) {
      console.log(`⚠️ ${tableName}: Erreur lors du vidage`)
    }
  }

  private anonymizeData(tableName: string, data: any[]): any[] {
    const sensitiveFields = SENSITIVE_TABLES[tableName]
    if (!sensitiveFields) return data

    return data.map((record, index) => {
      const anonymized = { ...record }
      
      sensitiveFields.forEach(field => {
        if (anonymized[field]) {
          switch (field) {
            case 'email':
              anonymized[field] = `user${index + 1}@example.com`
              break
            case 'full_name':
              anonymized[field] = `Utilisateur ${index + 1}`
              break
            case 'guest_name':
              anonymized[field] = `Invité ${index + 1}`
              break
            case 'guest_email':
              anonymized[field] = `guest${index + 1}@example.com`
              break
            case 'guest_phone':
              anonymized[field] = `+33600000${String(index + 1).padStart(3, '0')}`
              break
            case 'password_hash':
            case 'reset_token':
              anonymized[field] = null
              break
            case 'content':
            case 'message':
              anonymized[field] = `Message anonymisé ${index + 1}`
              break
            default:
              anonymized[field] = `[ANONYMISÉ]`
          }
        }
      })
      
      return anonymized
    })
  }

  private printSummary() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000)
    
    console.log('\n🎉 CLONAGE TERMINÉ')
    console.log('==================')
    console.log(`📊 Tables traitées: ${this.stats.tablesProcessed}`)
    console.log(`📈 Enregistrements clonés: ${this.stats.recordsCloned}`)
    console.log(`❌ Erreurs: ${this.stats.errors}`)
    console.log(`⏱️ Durée: ${duration}s`)
    
    if (this.stats.errors === 0) {
      console.log('✅ Clonage réussi sans erreur !')
    } else {
      console.log('⚠️ Clonage terminé avec des erreurs')
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: tsx complete-database-clone.ts <source> <target> [options]')
    console.log('Exemples:')
    console.log('  tsx complete-database-clone.ts prod test --anonymize')
    console.log('  tsx complete-database-clone.ts prod dev --dry-run')
    console.log('  tsx complete-database-clone.ts test dev --exclude profiles,messages')
    return
  }

  const [source, target] = args
  const options: CloneOptions = {
    sourceEnv: source as any,
    targetEnv: target as any,
    anonymize: args.includes('--anonymize'),
    dryRun: args.includes('--dry-run')
  }

  // Traiter les exclusions
  const excludeIndex = args.findIndex(arg => arg === '--exclude')
  if (excludeIndex !== -1 && args[excludeIndex + 1]) {
    options.excludeTables = args[excludeIndex + 1].split(',')
  }

  // Traiter les inclusions
  const includeIndex = args.findIndex(arg => arg === '--include')
  if (includeIndex !== -1 && args[includeIndex + 1]) {
    options.includeTables = args[includeIndex + 1].split(',')
  }

  const cloner = new CompleteDatabaseClone(options)
  await cloner.clone()
}

// Exporter pour utilisation dans d'autres scripts
export { CompleteDatabaseClone, ALL_TABLES, TABLE_DEPENDENCIES }

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}