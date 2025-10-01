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

async function checkRLSPolicies() {
  console.log('🔒 VÉRIFICATION DES POLICIES RLS');
  console.log('================================');

  try {
    // Check RLS policies on profiles table
    console.log('📋 Vérification des policies sur la table profiles...');

    // Use the REST API to get policies
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey || '',
        'Content-Type': 'application/json'
      } as HeadersInit
    });

    if (response.status === 403) {
      console.log('🚫 RLS est activé sur la table profiles');
      console.log('   Cela peut empêcher l\'inscription automatique');
    } else if (response.status === 200) {
      console.log('✅ RLS n\'empêche pas l\'accès à profiles');
    } else {
      console.log(`⚠️ Status inattendu: ${response.status}`);
    }

    // Check auth users table
    console.log('📋 Vérification des policies sur auth...');

    // Try to access auth.users (this should work with service key)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.log('ℹ️ Accès limité aux utilisateurs auth (normal):', usersError.message);
    } else {
      console.log(`✅ Accès aux utilisateurs auth: ${users.users.length} utilisateurs`);
    }

    console.log('');
    console.log('💡 SOLUTION RECOMMANDÉE:');
    console.log('========================');
    console.log('Si l\'inscription ne fonctionne pas, vérifiez dans votre dashboard Supabase:');
    console.log('1. Authentication > Settings > Enable email confirmations');
    console.log('2. Authentication > Settings > SMTP settings');
    console.log('3. Database > Tables > profiles > RLS policies');
    console.log('');
    console.log('Policy recommandée pour profiles:');
    console.log('```sql');
    console.log('CREATE POLICY "Users can view own profile" ON profiles');
    console.log('  FOR SELECT USING (auth.uid() = id);');
    console.log('');
    console.log('CREATE POLICY "Users can update own profile" ON profiles');
    console.log('  FOR UPDATE USING (auth.uid() = id);');
    console.log('');
    console.log('CREATE POLICY "Users can insert own profile" ON profiles');
    console.log('  FOR INSERT WITH CHECK (auth.uid() = id);');
    console.log('```');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkRLSPolicies();