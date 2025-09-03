const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifySchema() {
  const client = await pool.connect();
  try {
    // Check for internet_connection_types table
    const res1 = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'internet_connection_types'
      );
    `);
    console.log('internet_connection_types table exists:', res1.rows[0].exists);

    // Check for internet_connection_type_id column in lofts table
    const res2 = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'lofts' AND column_name = 'internet_connection_type_id'
      );
    `);
    console.log('internet_connection_type_id column in lofts table exists:', res2.rows[0].exists);

    // Check for settings table
    const res3 = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'settings'
      );
    `);
    console.log('settings table exists:', res3.rows[0].exists);

  } finally {
    client.release();
    pool.end();
  }
}

verifySchema().catch(err => console.error(err));
