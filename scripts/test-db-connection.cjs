require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');

const testDbConnection = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is required in .env file');
    process.exit(1);
  }

  console.log('Attempting to connect with:', process.env.DATABASE_URL);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    family: 4,
  });

  try {
    const client = await pool.connect();
    console.log('Database connection successful!');
    await client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

testDbConnection();
