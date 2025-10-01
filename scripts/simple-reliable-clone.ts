import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.prod' });
config({ path: 'env-backup/.env.development' });

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROD_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function simpleReliableClone() {
  console.log('🔄 CLONAGE SIMPLE ET FIABLE');
  console.log('============================');

  // List of tables to clone (in dependency order)
  const tablesToClone = [
    'currencies', 'categories', 'zone_areas', 'internet_connection_types', 'payment_methods',
    'loft_owners', 'profiles', 'lofts', 'team_members', 'tasks',
    'transactions', 'transaction_category_references', 'settings',
    'notifications', 'messages', 'customers', 'loft_photos',
    'conversations', 'conversation_participants', 'user_sessions'
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const tableName of tablesToClone) {
    try {
      console.log(`\n📋 Traitement de ${tableName}...`);

      // Step 1: Get data from PROD
      const prodResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
        headers: {
          'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
          'apikey': PROD_SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!prodResponse.ok) {
        console.log(`⚠️ Impossible de lire ${tableName} depuis PROD: ${prodResponse.status}`);
        errorCount++;
        continue;
      }

      const prodData = await prodResponse.json() as any[];

      if (prodData.length === 0) {
        console.log(`ℹ️ ${tableName} est vide dans PROD`);
        successCount++;
        continue;
      }

      console.log(`📊 ${prodData.length} enregistrements trouvés dans PROD`);

      // Step 2: Clear existing data in DEV (if table exists)
      try {
        const deleteResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/${tableName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
            'apikey': DEV_SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          console.log(`✅ Données existantes supprimées dans DEV`);
        } else {
          console.log(`⚠️ Impossible de supprimer les données existantes: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Erreur lors de la suppression: ${error}`);
      }

      // Step 3: Insert data into DEV
      const insertResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
          'apikey': DEV_SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(prodData)
      });

      if (insertResponse.ok) {
        console.log(`✅ ${tableName} cloné avec succès (${prodData.length} enregistrements)`);
        successCount++;
      } else if (insertResponse.status === 404) {
        console.log(`❌ Table ${tableName} n'existe pas dans DEV`);
        console.log(`💡 Vous devez créer cette table manuellement dans Supabase Dashboard`);
        errorCount++;
      } else {
        console.log(`❌ Erreur insertion ${tableName}: ${insertResponse.status}`);
        console.log('Détails:', await insertResponse.text());
        errorCount++;
      }

    } catch (error) {
      console.log(`❌ Erreur traitement ${tableName}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n🎉 CLONAGE TERMINÉ');
  console.log('===================');
  console.log(`✅ Tables réussies: ${successCount}`);
  console.log(`❌ Tables en erreur: ${errorCount}`);
  console.log(`📊 Total: ${successCount + errorCount}`);

  if (errorCount > 0) {
    console.log('\n⚠️ TABLES À CRÉER MANUELLEMENT:');
    console.log('Exécutez ce SQL dans Supabase Dashboard DEV:');
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
  } else {
    console.log('🎉 Tous les clonages ont réussi!');
  }
}

simpleReliableClone();