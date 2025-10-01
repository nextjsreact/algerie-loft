
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// --- Helper: Parse .env file ---
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Le fichier d'environnement n'existe pas : ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const envConfig = {};
  content.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'" ) && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        envConfig[key] = value;
      }
    }
  });
  return envConfig;
}

// --- Helper: Run Command ---
function runCommand(command) {
  console.log(`\n▶️  Exécution : ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Erreur lors de l'exécution de la commande. Arrêt.`);
    process.exit(1);
  }
}

// --- Main Script ---
function main() {
  console.log('--- Début du script de clonage officiel (Supabase CLI) ---');

  // 1. Get DB URLs from .env files
  console.log('\n🔑 Lecture des variables d\'environnement...');
  const prodEnv = parseEnvFile(path.join(rootDir, '.env.prod'));
  const devEnv = parseEnvFile(path.join(rootDir, '.env.development'));

  const prodDbUrl = prodEnv.DATABASE_URL;
  const devDbUrl = devEnv.DATABASE_URL;

  if (!prodDbUrl || !devDbUrl) {
    console.error('❌ DATABASE_URL manquante dans .env.prod ou .env.development');
    process.exit(1);
  }
  console.log('✅ URL de base de données Prod et Dev obtenues.');

  const backupFile = path.join(rootDir, 'temp', 'prod_dump_official.sql');
  const tempDir = path.dirname(backupFile);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // 2. Dump Production Database using Supabase CLI
  console.log('\n📦 Sauvegarde de la base de données de production...');
  const dumpCommand = `supabase db dump --db-url "${prodDbUrl}" -f "${backupFile}"`;
  runCommand(dumpCommand);
  console.log(`✅ Sauvegarde de la production terminée : ${backupFile}`);

  // 3. Restore to Development Database using psql
  console.log('\n🔄 Restauration de la base de données de développement...');
  const restoreCommand = `psql "${devDbUrl}" -f "${backupFile}"`;
  runCommand(restoreCommand);
  console.log('✅ Restauration en développement terminée.');

  // 4. Clean up backup file
  console.log(`\n🧹 Nettoyage du fichier de sauvegarde...`);
  fs.unlinkSync(backupFile);
  console.log('✅ Fichier de sauvegarde supprimé.');

  console.log('\n--- 🎉 Script de clonage officiel terminé avec succès ! ---');
}

main();
