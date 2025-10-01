import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.development' });

const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkDevDatabase() {
  console.log('🔍 VÉRIFICATION DIRECTE DE LA BASE DEV');
  console.log('=====================================');
  console.log(`URL: ${DEV_SUPABASE_URL}`);
  console.log(`Service Key: ${DEV_SUPABASE_SERVICE_KEY?.substring(0, 20)}...`);
  console.log('');

  // Test 1: Simple connection test
  console.log('📡 TEST 1: Connexion de base');
  try {
    const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);
    if (!response.ok) {
      console.log('❌ Impossible de se connecter à DEV');
      return;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error);
    return;
  }

  // Test 2: Check if customers table exists
  console.log('\n📋 TEST 2: Table customers');
  try {
    const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);

    if (response.status === 404) {
      console.log('❌ Table customers N\'EXISTE PAS dans DEV');
    } else if (response.ok) {
      const data = await response.json() as any[];
      console.log(`✅ Table customers existe avec ${data.length} enregistrements`);
    } else {
      console.log('❌ Erreur:', await response.text());
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
  }

  // Test 3: List all tables
  console.log('\n📋 TEST 3: Liste de toutes les tables');
  try {
    const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/information_schema.tables?table_schema=public`, {
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);

    if (response.ok) {
      const tables = await response.json() as any[];
      console.log(`📊 ${tables.length} tables trouvées:`);

      const tableNames = tables.map(t => t.table_name);
      tableNames.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
      });

      if (tableNames.includes('customers')) {
        console.log('✅ customers est dans la liste');
      } else {
        console.log('❌ customers N\'EST PAS dans la liste');
      }
    } else {
      console.log('❌ Erreur:', await response.text());
    }
  } catch (error) {
    console.log('❌ Erreur:', error);
  }

  console.log('\n🎉 VÉRIFICATION TERMINÉE');
}

checkDevDatabase();