import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.prod' });
config({ path: 'env-backup/.env.development' });

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROD_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixCustomersTable() {
  console.log('🔧 RÉPARATION DE LA TABLE CUSTOMERS');
  console.log('===================================');

  // Step 1: Check if customers table exists in PROD
  console.log('📋 Vérification PROD...');
  const prodResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
      'apikey': PROD_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!prodResponse.ok) {
    console.error('❌ Impossible d\'accéder à PROD:', prodResponse.status);
    return;
  }

  const prodCustomers = await prodResponse.json() as any[];
  console.log(`✅ PROD: ${prodCustomers.length} clients trouvés`);

  // Step 2: Check if customers table exists in DEV
  console.log('📋 Vérification DEV...');
  const devResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (devResponse.status === 404) {
    console.log('❌ Table customers n\'existe pas dans DEV - création nécessaire');
    console.log('💡 SQL à exécuter dans Supabase Dashboard DEV:');
    console.log(`
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON public.customers
    FOR ALL USING (auth.role() = 'authenticated');
    `);
  } else if (devResponse.ok) {
    const devCustomers = await devResponse.json() as any[];
    console.log(`✅ DEV: ${devCustomers.length} clients trouvés`);

    // Get all customers from PROD
    const allProdCustomers = await fetch(`${PROD_SUPABASE_URL}/rest/v1/customers?select=*`, {
      headers: {
        'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
        'apikey': PROD_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (allProdCustomers.ok) {
      const allCustomers = await allProdCustomers.json() as any[];
      console.log(`📊 ${allCustomers.length} clients à synchroniser`);

      // Insert customers one by one
      let successCount = 0;
      for (const customer of allCustomers) {
        const insertResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
            'apikey': DEV_SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(customer)
        });

        if (insertResponse.ok) {
          successCount++;
        } else if (insertResponse.status === 409) {
          // Duplicate key - customer already exists
          successCount++;
        } else {
          console.log(`❌ Erreur pour ${customer.email}:`, insertResponse.status);
        }
      }

      console.log(`✅ Synchronisation terminée: ${successCount}/${allCustomers.length} clients`);
    }
  } else {
    console.log('❌ Erreur DEV:', devResponse.status);
  }

  console.log('🎉 RÉPARATION TERMINÉE!');
}

fixCustomersTable();