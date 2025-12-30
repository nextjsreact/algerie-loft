require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is required in .env file');
  console.log('Current environment variables:', Object.keys(process.env));
  throw new Error('Database configuration error');
}

console.log('Database configuration loaded');
const connectionString = process.env.DATABASE_URL;
console.log('Attempting to connect with:', connectionString); // Added for debugging
module.exports = {
  dbConfig: {
    connectionString: connectionString,
    maxConnections: 5,
    idleTimeoutMillis: 30000
  }
};
