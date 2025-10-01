import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'env-backup/.env.development' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCustomersTable() {
  console.log('🏗️  CRÉATION DE LA TABLE CUSTOMERS DANS DEV');
  console.log('============================================');

  try {
    // First, let's try to create the table using SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.customers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.customers;
        CREATE POLICY "Allow all operations for authenticated users" ON public.customers
            FOR ALL USING (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.log('❌ Erreur avec RPC, tentative alternative...');
      console.log('Détails:', error.message);

      // Alternative: provide manual SQL instructions
      console.log('\n💡 SOLUTION MANUELLE:');
      console.log('====================');
      console.log('Exécutez ce SQL dans votre dashboard Supabase DEV:');
      console.log('');
      console.log('```sql');
      console.log('CREATE TABLE IF NOT EXISTS public.customers (');
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

      return;
    }

    console.log('✅ Table customers créée avec succès!');
    console.log('📝 Données:', data);

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

createCustomersTable();