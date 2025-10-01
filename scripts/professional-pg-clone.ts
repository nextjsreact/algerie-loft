#!/usr/bin/env tsx
/**
 * CLONAGE PROFESSIONNEL AVEC PG_DUMP/PSQL
 * ========================================
 *
 * Approche professionnelle utilisant les outils PostgreSQL natifs
 * - pg_dump pour l'export complet (schéma + données)
 * - psql pour l'import propre
 * - Gestion des erreurs et logging
 * - Nettoyage automatique des backups
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: 'env-backup/.env.prod' });
config({ path: 'env-backup/.env.development' });

const SOURCE_DB_URL = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
const TARGET_DB_URL = process.env.DATABASE_URL;

const BACKUP_DIR = './supabase_backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_FILE = `${BACKUP_DIR}/backup_${TIMESTAMP}.sql`;
const LOG_FILE = `${BACKUP_DIR}/logs/clone_${TIMESTAMP}.log`;

interface CloneOptions {
  source: 'prod' | 'dev' | 'test' | 'learning';
  target: 'prod' | 'dev' | 'test' | 'learning';
  cleanBackup?: boolean;
  keepDays?: number;
}

class ProfessionalPgCloner {
  private options: CloneOptions;

  constructor(options: CloneOptions) {
    this.options = {
      cleanBackup: true,
      keepDays: 7,
      ...options
    };
  }

  private log(message: string): void {
    const logMessage = `${new Date().toISOString()} - ${message}`;
    console.log(logMessage);

    // Ensure log directory exists
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  }

  private async ensureDirectories(): Promise<void> {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    if (!fs.existsSync(path.dirname(LOG_FILE))) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    }
  }

  private async validateEnvironment(): Promise<boolean> {
    this.log('🔍 Validation des environnements...');

    if (!SOURCE_DB_URL) {
      this.log('❌ SOURCE_DB_URL manquant');
      return false;
    }

    if (!TARGET_DB_URL) {
      this.log('❌ TARGET_DB_URL manquant');
      return false;
    }

    // Protection contre la production
    if (this.options.target === 'prod') {
      this.log('🚫 ERREUR CRITIQUE: Impossible de modifier la PRODUCTION!');
      return false;
    }

    this.log('✅ Environnements validés');
    return true;
  }

  private async exportDatabase(): Promise<boolean> {
    this.log('📤 Export de la base source...');

    try {
      if (!SOURCE_DB_URL) {
        this.log('❌ SOURCE_DB_URL manquant');
        return false;
      }

      // Ensure backup directory exists
      await this.ensureDirectories();

      // pg_dump command
      const pgDumpCmd = `pg_dump "${SOURCE_DB_URL}" --clean --no-owner --no-acl --if-exists --schema=public --file="${BACKUP_FILE}"`;

      this.log(`Exécution: pg_dump (schéma public uniquement)`);

      execSync(pgDumpCmd, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: this.extractPassword(SOURCE_DB_URL) }
      });

      // Verify backup file was created
      if (fs.existsSync(BACKUP_FILE)) {
        const stats = fs.statSync(BACKUP_FILE);
        this.log(`✅ Export réussi: ${BACKUP_FILE} (${Math.round(stats.size / 1024)} KB)`);
        return true;
      } else {
        this.log('❌ Fichier de backup non créé');
        return false;
      }

    } catch (error) {
      this.log(`❌ Erreur export: ${error}`);
      return false;
    }
  }

  private async cleanTargetDatabase(): Promise<boolean> {
    this.log('🗑️ Nettoyage de la base cible...');

    try {
      if (!TARGET_DB_URL) {
        this.log('❌ TARGET_DB_URL manquant');
        return false;
      }

      const cleanSQL = `
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
      `;

      const psqlCmd = `psql "${TARGET_DB_URL}" -c "${cleanSQL.replace(/\n/g, ' ')}"`;

      execSync(psqlCmd, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: this.extractPassword(TARGET_DB_URL) }
      });

      this.log('✅ Nettoyage réussi');
      return true;

    } catch (error) {
      this.log(`❌ Erreur nettoyage: ${error}`);
      return false;
    }
  }

  private extractPassword(dbUrl: string | undefined): string | undefined {
    if (!dbUrl) return undefined;
    const match = dbUrl.match(/:([^:@]+)@/);
    return match ? match[1] : undefined;
  }

  private async importDatabase(): Promise<boolean> {
    this.log('📥 Import dans la base cible...');

    try {
      if (!TARGET_DB_URL) {
        this.log('❌ TARGET_DB_URL manquant');
        return false;
      }

      const psqlCmd = `psql "${TARGET_DB_URL}" -f "${BACKUP_FILE}"`;

      execSync(psqlCmd, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: this.extractPassword(TARGET_DB_URL) }
      });

      this.log('✅ Import réussi');
      return true;

    } catch (error) {
      this.log(`❌ Erreur import: ${error}`);
      return false;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    this.log('🧹 Nettoyage des anciens backups...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (this.options.keepDays || 7));

      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
        .map(file => ({
          name: file,
          path: path.join(BACKUP_DIR, file),
          date: fs.statSync(path.join(BACKUP_DIR, file)).mtime
        }))
        .filter(file => file.date < cutoffDate);

      files.forEach(file => {
        fs.unlinkSync(file.path);
        this.log(`🗑️ Supprimé: ${file.name}`);
      });

      this.log(`✅ ${files.length} anciens backups supprimés`);

    } catch (error) {
      this.log(`⚠️ Erreur nettoyage: ${error}`);
    }
  }

  public async clone(): Promise<boolean> {
    const startTime = Date.now();

    try {
      this.log('🚀 DÉBUT DU CLONAGE PROFESSIONNEL PostgreSQL');
      this.log(`📁 Source: ${this.options.source.toUpperCase()} → Cible: ${this.options.target.toUpperCase()}`);
      this.log('='.repeat(60));

      // Validation
      if (!await this.validateEnvironment()) {
        return false;
      }

      // Étape 1: Export
      this.log('\n📋 ÉTAPE 1: EXPORT');
      this.log('-'.repeat(30));
      if (!await this.exportDatabase()) {
        return false;
      }

      // Étape 2: Nettoyage
      this.log('\n📋 ÉTAPE 2: NETTOYAGE');
      this.log('-'.repeat(30));
      if (!await this.cleanTargetDatabase()) {
        return false;
      }

      // Étape 3: Import
      this.log('\n📋 ÉTAPE 3: IMPORT');
      this.log('-'.repeat(30));
      if (!await this.importDatabase()) {
        return false;
      }

      // Étape 4: Nettoyage
      this.log('\n📋 ÉTAPE 4: NETTOYAGE');
      this.log('-'.repeat(30));
      await this.cleanupOldBackups();

      // Résumé
      const duration = Math.round((Date.now() - startTime) / 1000);
      this.log('\n🎉 CLONAGE PROFESSIONNEL TERMINÉ');
      this.log(`⏱️ Durée totale: ${duration}s`);
      this.log('✅ Base de données clonée avec succès!');

      return true;

    } catch (error) {
      this.log(`💥 ERREUR FATALE: ${error}`);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options: CloneOptions = {
    source: 'prod',
    target: 'dev',
    cleanBackup: true,
    keepDays: 7
  };

  // Parsing des arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--source':
        options.source = args[++i] as any;
        break;
      case '--target':
        options.target = args[++i] as any;
        break;
      case '--keep-days':
        options.keepDays = parseInt(args[++i]);
        break;
    }
  }

  const cloner = new ProfessionalPgCloner(options);
  const success = await cloner.clone();

  if (!success) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProfessionalPgCloner };
export type { CloneOptions };