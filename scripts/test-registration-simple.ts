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

async function testRegistrationSimple() {
  console.log('🔍 TEST SIMPLE D\'INSCRIPTION');
  console.log('============================');

  try {
    // Test 1: Check if auth is enabled
    console.log('📋 Test 1: Vérification de la configuration auth...');

    // Try to get current user (should return null for anonymous)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError && userError.message !== 'Auth session missing!') {
      console.error('❌ Erreur inattendue:', userError.message);
    } else {
      console.log('✅ Auth system is accessible');
    }

    // Test 2: Check if we can access auth admin functions
    console.log('📋 Test 2: Vérification des fonctions admin...');

    try {
      // Try to list users (this will fail without proper permissions, but shows if endpoint works)
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.log('ℹ️ Accès admin limité (normal):', usersError.message);
      } else {
        console.log('✅ Accès admin disponible');
      }
    } catch (adminError) {
      console.log('ℹ️ Fonctions admin non disponibles (normal pour service key)');
    }

    // Test 3: Check database connectivity for profiles
    console.log('📋 Test 3: Vérification de la table profiles...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(3);

    if (profilesError) {
      console.error('❌ Erreur avec la table profiles:', profilesError.message);
    } else {
      console.log(`✅ Table profiles accessible (${profiles.length} profils trouvés)`);
    }

    console.log('');
    console.log('💡 DIAGNOSTIC:');
    console.log('==============');
    console.log('Si l\'inscription ne fonctionne pas, les causes possibles sont:');
    console.log('1. Configuration SMTP non configurée dans Supabase Dashboard');
    console.log('2. Policies RLS trop restrictives');
    console.log('3. Triggers de base de données qui échouent');
    console.log('4. Configuration d\'authentification désactivée');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

testRegistrationSimple();