import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.development' });

const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verifyCustomersExists() {
  console.log('🔍 VÉRIFICATION DÉFINITIVE DE LA TABLE CUSTOMERS DANS DEV');
  console.log('=========================================================');
  console.log(`URL: ${DEV_SUPABASE_URL}`);
  console.log(`Service Key: ${DEV_SUPABASE_SERVICE_KEY?.substring(0, 20)}...`);
  console.log('');

  // Test 1: Direct table access
  console.log('📋 TEST 1: Accès direct à la table customers');
  const directResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  console.log(`Status: ${directResponse.status}`);
  console.log(`OK: ${directResponse.ok}`);

  if (directResponse.status === 404) {
    console.log('❌ RÉSULTAT: Table customers N\'EXISTE PAS dans DEV');
    console.log('');
    console.log('💡 SOLUTION: Vous devez créer la table manuellement');
    console.log('💡 SQL à exécuter dans Supabase Dashboard DEV:');
    console.log('');
    console.log('```sql');
    console.log('CREATE TABLE public.customers (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    email TEXT UNIQUE NOT NULL,');
    console.log('    full_name TEXT,');
    console.log('    phone TEXT,');
    console.log('    address TEXT,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('CREATE POLICY "Allow all operations for authenticated users" ON public.customers');
    console.log('    FOR ALL USING (auth.role() = \'authenticated\');');
    console.log('```');
    return false;
  } else if (directResponse.ok) {
    const data = await directResponse.json() as any[];
    console.log(`✅ RÉSULTAT: Table customers EXISTE avec ${data.length} enregistrements`);

    // Test 2: Check if we can insert data
    console.log('\n📋 TEST 2: Test d\'insertion');
    const testInsert = {
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '123456789',
      address: 'Test Address'
    };

    const insertResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testInsert)
    });

    if (insertResponse.ok) {
      console.log('✅ Insertion possible - table fonctionnelle');

      // Clean up test data
      const cleanupResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers?email=eq.test@example.com`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
          'apikey': DEV_SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (cleanupResponse.ok) {
        console.log('✅ Données de test supprimées');
      }

    } else {
      console.log('⚠️ Insertion échoue - problème avec la table');
    }

    return true;
  } else {
    console.log('❌ Erreur inconnue:', directResponse.status);
    console.log('Détails:', await directResponse.text());
    return false;
  }
}

async function main() {
  const exists = await verifyCustomersExists();

  console.log('\n🎯 RÉSUMÉ FINAL:');
  console.log('================');
  if (exists) {
    console.log('✅ La table customers existe et fonctionne dans DEV');
    console.log('🚀 Vous pouvez maintenant utiliser l\'application');
  } else {
    console.log('❌ La table customers n\'existe pas dans DEV');
    console.log('📝 Suivez les instructions ci-dessus pour la créer');
  }
}

main();