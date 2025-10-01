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

async function checkAuthSetup() {
  console.log('🔍 VÉRIFICATION DE LA CONFIGURATION D\'AUTHENTIFICATION');
  console.log('======================================================');

  try {
    // 1. Check if we can connect to Supabase
    console.log('📡 Test de connexion à Supabase...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return;
    }
    console.log('✅ Connexion à Supabase réussie');

    // 2. Check if profiles table exists and has proper structure
    console.log('📋 Vérification de la table profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Erreur avec la table profiles:', profilesError.message);
    } else {
      console.log('✅ Table profiles accessible');
    }

    // 3. Check auth settings
    console.log('⚙️ Vérification de la configuration d\'authentification...');

    // 4. Try to create a test user (this will show if registration is working)
    console.log('🧪 Test d\'inscription...');
    const testEmail = 'testuser@example.com';
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'member'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erreur lors du test d\'inscription:', signupError.message);
      console.log('   Code:', signupError.status);
      console.log('   Détails:', signupError);
    } else {
      console.log('✅ Inscription test réussie');
      console.log('   User ID:', signupData.user?.id);
      console.log('   Email confirmed:', signupData.user?.email_confirmed_at ? 'Oui' : 'Non');

      // Clean up test user
      if (signupData.user?.id) {
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('🗑️ Utilisateur de test supprimé');
      }
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

checkAuthSetup();