const { Pool } = require('pg');
const { dbConfig } = require('./db-config.cjs');

let sql = null;

if (typeof window === 'undefined') {
  try {
    sql = new Pool({
      connectionString: dbConfig.connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      // Force IPv4 to avoid potential issues with IPv6 resolution/connectivity
      family: 4, 
    });
    console.log('Database connection pool created using pg');
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
    throw error;
  }
}

module.exports = { sql };
