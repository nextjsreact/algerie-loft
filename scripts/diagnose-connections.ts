#!/usr/bin/env tsx
/**
 * Script de Diagnostic des Connexions Supabase
 * Teste la connectivité de tous les environnements
 */

import { execSync } from 'child_process'
import dotenv from 'dotenv'
import { join } from 'path'

interface PostgresConnection {
  host: string
  port: number
  database: string
  username: string
  password: string
  projectId: string
}

interface EnvironmentConfig {
  name: string
  file: string
  url?: string
  serviceKey?: string
}

class ConnectionDiagnostic {
  private environments: EnvironmentConfig[] = [
    { name: 'prod', file: 'env-backup/.env.prod' },
    { name: 'dev', file: 'env-backup/.env.development' },
    { name: 'test', file: 'env-backup/.env.test' },
    { name: 'learning', file: 'env-backup/.env.learning' }
  ]

  private extractPostgresConnection(url: string, serviceKey: string): PostgresConnection {
    try {
      const supabaseUrl = new URL(url)
      const projectId = supabaseUrl.hostname.split('.')[0]

      return {
        host: `db.${supabaseUrl.hostname}`,
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: serviceKey,
        projectId: projectId
      }
    } catch (error) {
      throw new Error(`Impossible d'extraire les informations de connexion PostgreSQL depuis ${url}`)
    }
  }

  private buildConnectionString(conn: PostgresConnection): string {
    return `postgresql://${conn.username}:${conn.password}@${conn.host}:${conn.port}/${conn.database}`
  }

  private loadEnvironment(env: EnvironmentConfig): boolean {
    try {
      const res = dotenv.config({ path: env.file })
      if (res.error) {
        console.log(`❌ ${env.name.toUpperCase()}: Fichier d'environnement introuvable`)
        return false
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!url || !serviceKey) {
        console.log(`❌ ${env.name.toUpperCase()}: Variables manquantes dans ${env.file}`)
        return false
      }

      env.url = url
      env.serviceKey = serviceKey
      return true
    } catch (error) {
      console.log(`❌ ${env.name.toUpperCase()}: Erreur de chargement - ${error}`)
      return false
    }
  }

  private testConnection(conn: PostgresConnection, label: string): boolean {
    const connString = this.buildConnectionString(conn)
    try {
      execSync(`psql "${connString}" -c "SELECT 1"`, { stdio: 'pipe', timeout: 10000 })
      console.log(`✅ ${label}: CONNECTÉ (${conn.projectId})`)
      return true
    } catch (error: any) {
      console.log(`❌ ${label}: NON ACCESSIBLE - ${error.message.split('\n')[0]}`)
      return false
    }
  }

  async runDiagnostics() {
    console.log('🔍 DIAGNOSTIC DES CONNEXIONS SUPABASE')
    console.log('='.repeat(50))

    let accessibleCount = 0
    const accessibleEnvs: string[] = []

    for (const env of this.environments) {
      console.log(`\n📋 Test de ${env.name.toUpperCase()}:`)

      if (!this.loadEnvironment(env)) {
        continue
      }

      if (!env.url || !env.serviceKey) {
        continue
      }

      try {
        const postgresConn = this.extractPostgresConnection(env.url, env.serviceKey)

        if (this.testConnection(postgresConn, env.name.toUpperCase())) {
          accessibleCount++
          accessibleEnvs.push(env.name)
        }
      } catch (error: any) {
        console.log(`❌ ${env.name.toUpperCase()}: Erreur d'extraction - ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 RÉSUMÉ DU DIAGNOSTIC')
    console.log('='.repeat(50))

    if (accessibleCount === 0) {
      console.log('❌ Aucun environnement accessible trouvé')
      console.log('\n💡 SOLUTIONS POSSIBLES:')
      console.log('1. Vérifiez votre connexion internet')
      console.log('2. Les bases Supabase peuvent être en pause/sommeil')
      console.log('3. Les configurations peuvent être obsolètes')
      console.log('4. Les projets Supabase peuvent avoir été supprimés')
    } else {
      console.log(`✅ ${accessibleCount} environnement(s) accessible(s): ${accessibleEnvs.join(', ')}`)

      if (accessibleEnvs.includes('prod')) {
        console.log('\n🚀 ENVIRONNEMENTS DISPONIBLES POUR LE CLONAGE:')
        const targets = this.environments
          .filter(e => e.name !== 'prod')
          .map(e => e.name)
          .filter(name => accessibleEnvs.includes(name))

        if (targets.length > 0) {
          console.log(`📤 prod → ${targets.join(', ')}`)
          console.log('\n💡 Commandes recommandées:')
          targets.forEach(target => {
            console.log(`npx tsx scripts/clone-database-pg.ts --source prod --target ${target} --dry-run`)
          })
        } else {
          console.log('⚠️ Aucun environnement cible accessible pour le clonage')
        }
      }
    }
  }
}

// Exécution du diagnostic
async function main() {
  const diagnostic = new ConnectionDiagnostic()
  await diagnostic.runDiagnostics()
}

main().catch(console.error)