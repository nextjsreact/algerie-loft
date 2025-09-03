const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration(filePath) {
  try {
    const sqlQuery = fs.readFileSync(filePath, 'utf-8');
    console.log(`Executing migration: ${path.basename(filePath)}`);
    await client.query(sqlQuery);
    console.log(`Successfully applied migration: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Failed to apply migration ${path.basename(filePath)}:`, error);
    await client.end();
    process.exit(1);
  }
}

async function main() {
  await client.connect();
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      await runMigration(path.join(migrationsDir, file));
    }
  }

  console.log('All migrations applied successfully.');
  await client.end();
  process.exit(0);
}

main();
