import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.development' });

const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createCustomersTableSimple() {
  console.log('🔧 CRÉATION SIMPLE DE LA TABLE CUSTOMERS');
  console.log('========================================');

  // First, let's try to get the structure from PROD
  config({ path: 'env-backup/.env.prod' });
  const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const PROD_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  console.log('📋 Récupération de la structure depuis PROD...');
  const structureResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
    headers: {
      'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
      'apikey': PROD_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (structureResponse.ok) {
    const sampleData = await structureResponse.json() as any[];
    console.log('✅ Structure récupérée depuis PROD');

    // Switch back to DEV config
    config({ path: 'env-backup/.env.development' });

    // Try to create the table by inserting data (this will fail if table doesn't exist)
    console.log('🏗️ Tentative de création via insertion...');
    const insertResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sampleData[0])
    });

    if (insertResponse.status === 404) {
      console.log('❌ Table n\'existe pas - voici le SQL à exécuter manuellement:');
      console.log('');
      console.log('💡 ALLEZ DANS VOTRE SUPABASE DASHBOARD DEV > SQL EDITOR');
      console.log('💡 ET EXÉCUTEZ CE SQL:');
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
      console.log('');
      console.log('📋 APRÈS AVOIR EXÉCUTÉ CE SQL:');
      console.log('1. La table customers apparaîtra dans Table Editor');
      console.log('2. Dites-moi quand c\'est fait');
      console.log('3. Je copierai les 8 clients depuis PROD');

    } else if (insertResponse.ok) {
      console.log('✅ Table créée et données insérées!');
    } else {
      console.log('❌ Erreur:', insertResponse.status);
      console.log('Détails:', await insertResponse.text());
    }

  } else {
    console.log('❌ Impossible de récupérer la structure PROD');
    console.log('💡 Utilisez le SQL ci-dessus pour créer la table manuellement');
  }

  console.log('🎉 FIN DE LA PROCÉDURE');
}

createCustomersTableSimple();