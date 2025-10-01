import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.development' });

const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkDevTables() {
  console.log('🔍 VÉRIFICATION DES TABLES DANS DEV');
  console.log('=====================================');

  // Get all tables in DEV
  const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('❌ Erreur de connexion:', response.status);
    console.error('Détails:', await response.text());
    return;
  }

  // Try to get table information
  const tablesResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/information_schema.tables?schema=public`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (tablesResponse.ok) {
    const tables = await tablesResponse.json() as any[];
    console.log(`📋 Tables trouvées dans DEV: ${tables.length}`);

    const tableNames = tables.map(t => t.table_name);
    console.log('📝 Liste des tables:');
    tableNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    if (tableNames.includes('customers')) {
      console.log('✅ Table customers existe dans DEV');
    } else {
      console.log('❌ Table customers N\'EXISTE PAS dans DEV');
    }
  } else {
    console.error('❌ Erreur lors de la récupération des tables:', tablesResponse.status);
    console.error('Détails:', await tablesResponse.text());
  }

  // Try to query customers table directly
  console.log('\n🔍 Test de requête directe sur customers:');
  const customersResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (customersResponse.ok) {
    const customers = await customersResponse.json() as any[];
    console.log('✅ Table customers accessible via API');
    console.log(`📊 Nombre de clients: ${customers.length}`);
  } else if (customersResponse.status === 404) {
    console.log('❌ Table customers n\'est pas accessible via API (404)');
  } else {
    console.log(`❌ Erreur API: ${customersResponse.status}`);
    console.log('Détails:', await customersResponse.text());
  }

  console.log('\n🎉 VÉRIFICATION TERMINÉE!');
}

checkDevTables();