#!/usr/bin/env tsx
/**
 * Script de Configuration Automatique des Bases Locales PostgreSQL
 * Crée et configure toutes les bases nécessaires pour le développement
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

interface DatabaseConfig {
  name: string
  envFile: string
  dbName: string
}

class LocalDatabaseSetup {
  private databases: DatabaseConfig[] = [
    { name: 'prod', envFile: 'env-backup/.env.prod', dbName: 'loft_prod' },
    { name: 'dev', envFile: 'env-backup/.env.development', dbName: 'loft_dev' },
    { name: 'test', envFile: 'env-backup/.env.test', dbName: 'loft_test' },
    { name: 'learning', envFile: 'env-backup/.env.learning', dbName: 'loft_learning' }
  ]

  private password: string = 'LoftAlgerie2025!'

  constructor() {
    this.checkPostgreSQL()
  }

  private checkPostgreSQL() {
    try {
      execSync('psql --version', { stdio: 'pipe' })
      console.log('✅ PostgreSQL est installé')
    } catch (error) {
      console.log('❌ PostgreSQL n\'est pas installé')
      console.log('\n📥 Installation requise :')
      console.log('Windows: https://www.postgresql.org/download/windows/')
      console.log('Linux: sudo apt install postgresql postgresql-contrib')
      console.log('Mac: brew install postgresql')
      process.exit(1)
    }
  }

  private createDatabase(dbName: string) {
    try {
      console.log(`📊 Création de la base ${dbName}...`)
      execSync(`createdb ${dbName}`, { stdio: 'pipe' })
      console.log(`✅ Base ${dbName} créée avec succès`)
      return true
    } catch (error: any) {
      console.log(`❌ Erreur lors de la création de ${dbName}: ${error.message}`)
      return false
    }
  }

  private updateEnvironmentFile(envFile: string, dbName: string) {
    try {
      const filePath = join(process.cwd(), envFile)

      // Configuration locale pour PostgreSQL
      const localConfig = `# ===========================================
# CONFIGURATION LOCALE POSTGRESQL
# ===========================================
# Modifié automatiquement par setup-local-databases.ts

# Base de données locale
DATABASE_URL="postgresql://postgres:${this.password}@localhost:5432/${dbName}"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2staG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NDU4NDY0NTYsImV4cCI6MjA2MTQyMjQ1Nn0.local-service-key-for-development

# Configuration locale
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
LOG_LEVEL=debug

# Base de données locale
NEXT_PUBLIC_HAS_DB=true
`

      writeFileSync(filePath, localConfig)
      console.log(`✅ Configuration mise à jour: ${envFile}`)
      return true
    } catch (error: any) {
      console.log(`❌ Erreur lors de la mise à jour de ${envFile}: ${error.message}`)
      return false
    }
  }

  private testConnection(dbName: string) {
    try {
      const connString = `postgresql://postgres:${this.password}@localhost:5432/${dbName}`
      execSync(`psql "${connString}" -c "SELECT 1"`, { stdio: 'pipe' })
      console.log(`✅ Connexion réussie à ${dbName}`)
      return true
    } catch (error: any) {
      console.log(`❌ Échec de connexion à ${dbName}: ${error.message}`)
      return false
    }
  }

  async setupAllDatabases() {
    console.log('🚀 CONFIGURATION DES BASES LOCALES POSTGRESQL')
    console.log('='.repeat(60))

    let successCount = 0

    for (const db of this.databases) {
      console.log(`\n📋 Configuration de ${db.name.toUpperCase()}:`)
      console.log('-'.repeat(40))

      // Créer la base
      if (this.createDatabase(db.dbName)) {
        // Mettre à jour le fichier d'environnement
        if (this.updateEnvironmentFile(db.envFile, db.dbName)) {
          // Tester la connexion
          if (this.testConnection(db.dbName)) {
            successCount++
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ DE LA CONFIGURATION')
    console.log('='.repeat(60))

    if (successCount === this.databases.length) {
      console.log(`✅ Toutes les bases (${successCount}/${this.databases.length}) configurées avec succès !`)
      console.log('\n🎯 PROCHAINES ÉTAPES :')
      console.log('1. Testez les connexions: diagnose-connections.bat')
      console.log('2. Clonez les données: clone-pg-to-dev.bat')
      console.log('3. Démarrez l\'application: npm run dev')
    } else {
      console.log(`⚠️ ${successCount}/${this.databases.length} bases configurées`)
      console.log('\n🔧 RÉSOLUTION :')
      console.log('1. Vérifiez que PostgreSQL est démarré')
      console.log('2. Vérifiez les permissions utilisateur')
      console.log('3. Redémarrez le service PostgreSQL')
    }
  }

  async createSchema() {
    console.log('\n📋 CRÉATION DU SCHÉMA DE BASE...')

    const schemaSQL = `
    -- Création des tables de base pour Loft Algerie
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Table des lofts
    CREATE TABLE IF NOT EXISTS lofts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      address TEXT,
      price_per_month DECIMAL(10,2),
      price_per_night DECIMAL(10,2),
      owner_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Table des réservations
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      loft_id UUID REFERENCES lofts(id),
      client_name VARCHAR(255),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Table des utilisateurs
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insertion de données de test
    INSERT INTO lofts (name, address, price_per_month, price_per_night) VALUES
    ('Loft Alger Centre', 'Centre Ville, Alger', 150000.00, 5000.00),
    ('Appartement Hydra', 'Hydra, Alger', 120000.00, 4000.00),
    ('Studio Didouche', 'Didouche Mourad, Alger', 80000.00, 3000.00)
    ON CONFLICT DO NOTHING;
    `

    try {
      for (const db of this.databases) {
        const connString = `postgresql://postgres:${this.password}@localhost:5432/${db.dbName}`
        execSync(`psql "${connString}" -c "${schemaSQL}"`, { stdio: 'pipe' })
        console.log(`✅ Schéma créé dans ${db.dbName}`)
      }
    } catch (error: any) {
      console.log(`⚠️ Erreur lors de la création du schéma: ${error.message}`)
    }
  }
}

// CLI Interface
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'with-schema': { type: 'boolean' },
    help: { type: 'boolean' }
  },
  allowPositionals: true
})

async function main() {
  if (values.help) {
    console.log(`
🚀 CONFIGURATION AUTOMATIQUE DES BASES LOCALES

Usage:
  npx tsx scripts/setup-local-databases.ts [options]

Options:
  --with-schema    Crée un schéma de base avec des données de test
  --help          Afficher cette aide

Description:
  Configure automatiquement toutes les bases PostgreSQL locales
  pour les environnements prod, dev, test et learning.

  Crée les bases de données et met à jour les fichiers .env
  avec les configurations locales appropriées.
    `)
    return
  }

  const setup = new LocalDatabaseSetup()

  console.log('🔧 Démarrage de la configuration...\n')

  await setup.setupAllDatabases()

  if (values['with-schema']) {
    await setup.createSchema()
  }

  console.log('\n🎉 Configuration terminée !')
  console.log('\n💡 Commandes suivantes recommandées:')
  console.log('1. npx tsx scripts/diagnose-connections.ts')
  console.log('2. npx tsx scripts/clone-database-pg.ts --source prod --target dev --dry-run')
}

main().catch(console.error)