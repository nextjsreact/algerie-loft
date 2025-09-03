#!/usr/bin/env tsx
/**
 * SCRIPT DE RESTAURATION DE BASE DE DONNÉES
 * =========================================
 * 
 * Restaure une base de données depuis un fichier de sauvegarde JSON
 * Utilisé en cas de problème lors du clonage
 * 
 * Usage: npm run tsx scripts/restore-database.ts <backup-file> [environment]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class DatabaseRestore {
  private env!: Environment
  private backupData: any

  constructor(private backupFile: string, private envName?: string) {}

  private loadEnvironment(envName: string): Environment {
    const envFile = envName === 'dev' ? '.env.development' : 
                   envName === 'prod' ? '.env.production' : 
                   `.env.${envName}`
    
    if (!existsSync(envFile)) {
      throw new Error(`❌ Fichier ${envFile} non trouvé`)
    }

    const envContent = readFileSync(envFile, 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })

    return {
      name: envName,
      url: envVars.NEXT_PUBLIC_SUPABASE_URL,
      key: envVars.SUPABASE_SERVICE_ROLE_KEY,
      client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
    }
  }

  private loadBackup(): void {
    if (!existsSync(this.backupFile)) {
      throw new Error(`❌ Fichier de sauvegarde non trouvé: ${this.backupFile}`)
    }

    try {
      const backupContent = readFileSync(this.backupFile, 'utf8')
      this.backupData = JSON.parse(backupContent)
      
      if (!this.backupData.data) {
        throw new Error('Format de sauvegarde invalide')
      }

      console.log(`✅ Sauvegarde chargée: ${this.backupFile}`)
      console.log(`📅 Date: ${this.backupData.timestamp}`)
      console.log(`🎯 Environnement: ${this.backupData.environment}`)
      
    } catch (error) {
      throw new Error(`❌ Erreur lecture sauvegarde: ${error}`)
    }
  }

  async executeRestore(): Promise<void> {
    console.log('🔄 RESTAURATION DE BASE DE DONNÉES')
    console.log('='.repeat(50))

    // Charger la sauvegarde
    this.loadBackup()

    // Déterminer l'environnement
    const targetEnv = this.envName || this.backupData.environment
    if (!targetEnv) {
      throw new Error('❌ Environnement cible non spécifié')
    }

    // Charger l'environnement
    this.env = this.loadEnvironment(targetEnv)
    console.log(`🎯 Restauration vers: ${targetEnv.toUpperCase()}`)

    // Restaurer chaque table
    const tables = Object.keys(this.backupData.data)
    console.log(`📋 ${tables.length} tables à restaurer`)

    for (const tableName of tables) {
      await this.restoreTable(tableName, this.backupData.data[tableName])
    }

    console.log('\n✅ RESTAURATION TERMINÉE!')
  }

  private async restoreTable(tableName: string, data: any[]): Promise<void> {
    console.log(`🔄 Restauration ${tableName}...`)

    try {
      if (!data || data.length === 0) {
        console.log(`   ℹ️ Aucune donnée à restaurer`)
        return
      }

      // Vider la table
      const { error: deleteError } = await this.env.client
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`   ⚠️ Nettoyage: ${deleteError.message}`)
      }

      // Restaurer par lots
      const batchSize = 100
      let restored = 0

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        const { error: insertError } = await this.env.client
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.log(`   ❌ Erreur lot: ${insertError.message}`)
        } else {
          restored += batch.length
        }
      }

      console.log(`   ✅ ${restored}/${data.length} enregistrements restaurés`)

    } catch (error) {
      console.log(`   ❌ Erreur: ${error}`)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.log('📋 RESTAURATION DE BASE DE DONNÉES')
    console.log('='.repeat(40))
    console.log('')
    console.log('Usage: npm run tsx scripts/restore-database.ts <backup-file> [environment]')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run tsx scripts/restore-database.ts backup_test_1234567890.json')
    console.log('• npm run tsx scripts/restore-database.ts backup_test_1234567890.json dev')
    return
  }

  const [backupFile, environment] = args
  
  try {
    const restore = new DatabaseRestore(backupFile, environment)
    await restore.executeRestore()
  } catch (error) {
    console.error('❌ Erreur de restauration:', error)
    process.exit(1)
  }
}

main().catch(console.error)