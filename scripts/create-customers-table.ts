import fetch from 'node-fetch';
import { config } from 'dotenv';
import * as fs from 'fs';

// Load environment variables
config({ path: 'env-backup/.env.development' });

const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createCustomersTable() {
  console.log('🏗️  CRÉATION DE LA TABLE CUSTOMERS DANS DEV');
  console.log('============================================');

  // Read the SQL file
  const sqlContent = fs.readFileSync('scripts/create-customers-table-dev.sql', 'utf8');

  // Execute the SQL via RPC
  const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql: sqlContent
    })
  });

  if (response.ok) {
    console.log('✅ Table customers créée avec succès dans DEV');
  } else {
    console.error('❌ Erreur lors de la création de la table:', response.status);
    console.error('Détails:', await response.text());
    return;
  }

  // Verify the table was created
  console.log('🔍 Vérification de la création...');
  const verifyResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (verifyResponse.ok) {
    console.log('✅ Table customers accessible et fonctionnelle');
  } else {
    console.error('❌ Problème avec la table customers:', verifyResponse.status);
  }

  console.log('🎉 CRÉATION TERMINÉE!');
}

createCustomersTable();