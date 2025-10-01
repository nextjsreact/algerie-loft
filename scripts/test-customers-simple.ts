import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.prod' });
config({ path: 'env-backup/.env.development' });

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROD_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testCustomers() {
  console.log('🧪 TEST SIMPLE DES CLIENTS');
  console.log('===========================');

  // Test PROD
  console.log('\n📋 TEST PROD:');
  const prodResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/customers?select=*`, {
    headers: {
      'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
      'apikey': PROD_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (prodResponse.ok) {
    const prodCustomers = await prodResponse.json() as any[];
    console.log(`✅ PROD: ${prodCustomers.length} clients trouvés`);
    if (prodCustomers.length > 0) {
      console.log('📧 Emails PROD:');
      prodCustomers.forEach((c: any, i: number) => {
        console.log(`   ${i + 1}. ${c.email}`);
      });
    }
  } else {
    console.log(`❌ PROD Error: ${prodResponse.status}`);
  }

  // Test DEV
  console.log('\n🎯 TEST DEV:');
  const devResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?select=*`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (devResponse.ok) {
    const devCustomers = await devResponse.json() as any[];
    console.log(`✅ DEV: ${devCustomers.length} clients trouvés`);
    if (devCustomers.length > 0) {
      console.log('📧 Emails DEV:');
      devCustomers.forEach((c: any, i: number) => {
        console.log(`   ${i + 1}. ${c.email}`);
      });
    }
  } else if (devResponse.status === 404) {
    console.log('ℹ️  Table customers n\'existe pas dans DEV');
  } else {
    console.log(`❌ DEV Error: ${devResponse.status}`);
    console.log('Détails:', await devResponse.text());
  }

  console.log('\n🎉 TEST TERMINÉ!');
}

testCustomers();