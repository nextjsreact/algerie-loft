require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const fs = require('fs');
const { sql } = require('../lib/database.cjs');

const runMigration = async () => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a path to the SQL migration file.');
    process.exit(1);
  }

  try {
    console.log(`Starting migration for ${filePath}...`);
    const query = fs.readFileSync(filePath, 'utf-8');
    await sql.query(query);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

runMigration();
