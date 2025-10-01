#!/usr/bin/env tsx
/**
 * Script de Clonage Complet PostgreSQL - DROP & RECREATE
 * Utilise pg_dump et pg_restore pour un clonage complet
 *
 * Usage:
 * npx tsx scripts/clone-database-pg.ts --source prod --target dev
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

interface PostgresConnection {
  host: string
  port: number
  database: string
  username: string
  password: string
  projectId: string
}

interface CloneOptions {
  source: 'prod' | 'test' | 'dev' | 'learning'
  target: 'prod' | 'test' | 'dev' | 'learning'
  dryRun?: boolean
  verbose?: boolean
}

export class PostgresCloner {
  private sourceConn!: PostgresConnection
  private targetConn!: PostgresConnection
  private tempDir: string

  constructor(private options: CloneOptions) {
    this.tempDir = join(process.cwd(), 'temp', 'db-clone')
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true })
    }
  }

  private resolveEnvFile(env: 'prod'|'test'|'dev'|'learning') {
    return `env-backup/.env.${env === 'dev' ? 'development' : env}`
  }

  private loadEnvironment(env: 'prod'|'test'|'dev'|'learning') {
    const path = this.resolveEnvFile(env)
    const res = dotenv.config({ path })
    if (res.error) {
      throw new Error(`Fichier d'environnement introuvable: ${path}`)
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error(`Variables manquantes dans ${path}`)
    }
    return { url, serviceKey }
  }

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

  private initializeConnections() {
    const sourceEnv = this.loadEnvironment(this.options.source)
    const targetEnv = this.loadEnvironment(this.options.target)

    this.sourceConn = this.extractPostgresConnection(sourceEnv.url, sourceEnv.serviceKey)
    this.targetConn = this.extractPostgresConnection(targetEnv.url, targetEnv.serviceKey)
  }

  private log(message: string) {
    if (this.options.verbose) {
      console.log(`📋 ${message}`)
    }
  }

  private execCommand(command: string, silent: boolean = false): void {
    this.log(`Exécutant: ${command}`)
    if (this.options.dryRun) {
      console.log(`🧪 [DRY RUN] Aurait exécuté: ${command}`)
      return
    }

    try {
      if (silent) {
        execSync(command, { stdio: 'pipe' })
      } else {
        execSync(command, { stdio: 'inherit' })
      }
    } catch (error: any) {
      throw new Error(`Erreur lors de l'exécution de: ${command}\n${error.message}`)
    }
  }

  async cloneDatabase() {
    console.log(`🔄 CLONAGE POSTGRESQL COMPLET: ${this.options.source.toUpperCase()} → ${this.options.target.toUpperCase()}`)
    console.log('='.repeat(80))

    if (this.options.dryRun) {
      console.log('🧪 MODE TEST - Aucune modification ne sera effectuée')
    }

    this.initializeConnections()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const dumpFile = join(this.tempDir, `dump-${this.options.source}-${timestamp}.sql`)

    try {
      // Étape 1: Export de la structure et données depuis la source
      console.log('\n📤 Étape 1: Export depuis la source...')
      const sourceConnString = this.buildConnectionString(this.sourceConn)

      this.execCommand(
        `pg_dump "${sourceConnString}" ` +
        `--no-owner --no-privileges --clean --if-exists ` +
        `--schema=public --no-tablespaces --format=custom ` +
        `--verbose --file="${dumpFile}"`
      )

      // Étape 2: Import vers la cible
      console.log('\n📥 Étape 2: Import vers la cible...')
      const targetConnString = this.buildConnectionString(this.targetConn)

      // Drop et recréation complète
      this.execCommand(
        `pg_restore "${dumpFile}" ` +
        `--no-owner --no-privileges --clean --if-exists ` +
        `--schema=public --no-tablespaces ` +
        `--dbname="${targetConnString}" --verbose`
      )

      console.log('\n✅ CLONAGE POSTGRESQL COMPLET RÉUSSI !')
      console.log(`📊 Fichier temporaire: ${dumpFile}`)
      console.log(`🔗 Source: ${this.sourceConn.projectId}`)
      console.log(`🎯 Cible: ${this.targetConn.projectId}`)

    } catch (error: any) {
      console.error('\n❌ ERREUR LORS DU CLONAGE:', error.message)
      throw error
    } finally {
      // Nettoyage du fichier temporaire
      if (existsSync(dumpFile) && !this.options.dryRun) {
        try {
          execSync(`rm "${dumpFile}"`)
          this.log(`🗑️ Fichier temporaire supprimé: ${dumpFile}`)
        } catch (e) {
          this.log(`⚠️ Impossible de supprimer le fichier temporaire: ${dumpFile}`)
        }
      }
    }
  }

  // Vérification de la connectivité
  async testConnections() {
    console.log('\n🔍 Test de connectivité...')

    this.initializeConnections()

    const testConnection = (conn: PostgresConnection, label: string) => {
      const connString = this.buildConnectionString(conn)
      try {
        execSync(`psql "${connString}" -c "SELECT 1"`, { stdio: 'pipe' })
        console.log(`✅ ${label}: OK`)
        return true
      } catch (error) {
        console.log(`❌ ${label}: ÉCHEC - ${error}`)
        return false
      }
    }

    const sourceOk = testConnection(this.sourceConn, 'Source')
    const targetOk = testConnection(this.targetConn, 'Cible')

    if (!sourceOk || !targetOk) {
      throw new Error('Impossible de se connecter aux bases de données')
    }
  }
}

// CLI Interface
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    source: { type: 'string' },
    target: { type: 'string' },
    'dry-run': { type: 'boolean' },
    verbose: { type: 'boolean' },
    help: { type: 'boolean' }
  },
  allowPositionals: true
})

async function main() {
  if (values.help) {
    console.log(`
🚀 CLONAGE POSTGRESQL COMPLET - DROP & RECREATE

Usage:
  npx tsx scripts/clone-database-pg.ts --source <env> --target <env> [options]

Environnements:
  prod, dev, test, learning

Options:
  --source <env>          Environnement source (prod, dev, test, learning)
  --target <env>          Environnement cible (prod, dev, test, learning, all)
  --dry-run              Mode test (aucune modification)
  --verbose              Mode verbeux (affiche les commandes)
  --help                 Afficher cette aide

Exemples:
  npx tsx scripts/clone-database-pg.ts --source prod --target dev
  npx tsx scripts/clone-database-pg.ts --source prod --target test --dry-run
  npx tsx scripts/clone-database-pg.ts --source prod --target learning --verbose

⚠️ ATTENTION: Cette méthode supprime complètement la structure de la base cible !
    `)
    return
  }

  const { source, target, 'dry-run': dryRun, verbose } = values

  if (!source || !target) {
    console.error('❌ Erreur: --source et --target sont requis')
    console.log('Utilisez --help pour voir les options disponibles')
    process.exit(1)
  }

  const validEnvs = ['prod', 'dev', 'test', 'learning']
  if (!validEnvs.includes(source) || !validEnvs.includes(target)) {
    console.error(`❌ Erreur: Environnements invalides. Utilisez: ${validEnvs.join(', ')}`)
    process.exit(1)
  }

  const cloner = new PostgresCloner({
    source: source as any,
    target: target as any,
    dryRun: dryRun ?? false,
    verbose: verbose ?? false
  })

  try {
    // Test de connectivité d'abord
    await cloner.testConnections()

    // Clonage complet
    await cloner.cloneDatabase()

  } catch (error: any) {
    console.error('\n💥 ERREUR FATALE:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)