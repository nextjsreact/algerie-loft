import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// --- Configuration ---
const PROD_ENV_FILE = path.join(rootDir, '.env.prod');
const DEV_ENV_FILE = path.join(rootDir, '.env.development');
const BACKUP_FILE = path.join(rootDir, 'temp', 'public_data_backup.sql');

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
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('`') && value.endsWith('`'))) {
          value = value.substring(1, value.length - 1);
        }
        envConfig[key] = value;
      }
    }
  });
  return envConfig;
}

// --- Helper: Get DB URL ---
function getDbUrl(envConfig) {
  if (envConfig.DATABASE_URL) {
    return envConfig.DATABASE_URL;
  }
  throw new Error("DATABASE_URL non trouvée dans le fichier .env");
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
  console.log("--- Début du clonage des DONNÉES du schéma 'public' ---");

  // 1. Create temp directory if it doesn't exist
  const tempDir = path.dirname(BACKUP_FILE);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // 2. Get DB URLs
  console.log("\n🔑 Lecture des variables d'environnement...");
  const prodDbUrl = getDbUrl(parseEnvFile(PROD_ENV_FILE));
  const devDbUrl = getDbUrl(parseEnvFile(DEV_ENV_FILE));
  console.log("✅ URL de base de données Prod et Dev obtenues.");

  // 3. Truncate all tables in the public schema of the destination
  console.log("\n🧹 Vidage des tables du schéma 'public' de destination...");
  const truncateSqlFile = path.join(rootDir, 'temp', 'truncate.sql');
  const truncateBlock = "DO $truncate$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE;' ; END LOOP; END; $truncate$";
  fs.writeFileSync(truncateSqlFile, truncateBlock);
  const cleanCommand = `psql "${devDbUrl}" -f "${truncateSqlFile}"`;
  runCommand(cleanCommand);
  fs.unlinkSync(truncateSqlFile);
  console.log("✅ Tables du schéma 'public' vidées.");

  // 4. Data-only dump from Production
  console.log("\n📦 Sauvegarde des données du schéma 'public' de production...");
  const dumpCommand = `pg_dump "${prodDbUrl}" --data-only --schema=public -f "${BACKUP_FILE}"`;
  runCommand(dumpCommand);
  console.log(`✅ Sauvegarde des données terminée : ${BACKUP_FILE}`);

  // 5. Restore data to Development
  console.log("\n🔄 Restauration des données en développement...");
  const restoreCommand = `psql "${devDbUrl}" -f "${BACKUP_FILE}"`;
  runCommand(restoreCommand);
  console.log("✅ Données restaurées.");
  
  // 6. Clean up backup file
  fs.unlinkSync(BACKUP_FILE);
  console.log("✅ Fichier de sauvegarde supprimé.");

  console.log("\n--- 🎉 Script de clonage de DONNÉES terminé avec succès ! ---");
}

main();