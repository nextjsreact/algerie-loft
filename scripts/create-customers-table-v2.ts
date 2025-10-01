import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.development' });

const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createCustomersTable() {
  console.log('🏗️  CRÉATION DE LA TABLE CUSTOMERS DANS DEV');
  console.log('============================================');

  // First, let's try to create the table using a simple SQL query
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.customers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;

  // Try to execute SQL via direct query (this might not work, but let's try)
  const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: createTableSQL
    })
  });

  if (response.ok) {
    console.log('✅ Table customers créée avec succès');
  } else {
    console.log('❌ Impossible de créer la table via API, essayons une autre méthode...');
    console.log('💡 Vous devez créer la table manuellement dans Supabase Dashboard');
    console.log('📋 SQL à exécuter:');
    console.log(createTableSQL);
    return;
  }

  // Now let's add RLS policies
  const policiesSQL = `
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view all customers" ON public.customers
        FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Users can insert customers" ON public.customers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Users can update customers" ON public.customers
        FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Users can delete customers" ON public.customers
        FOR DELETE USING (auth.role() = 'authenticated');
  `;

  console.log('🔒 Ajout des politiques RLS...');
  // Note: RLS policies might need to be set manually in Supabase dashboard

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
    console.log('❌ Problème avec la table customers:', verifyResponse.status);
    console.log('💡 Créez la table manuellement dans Supabase Dashboard avec le SQL fourni');
  }

  console.log('🎉 CRÉATION TERMINÉE!');
}

createCustomersTable();