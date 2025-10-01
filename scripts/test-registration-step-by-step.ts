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

async function testRegistrationStepByStep() {
  console.log('🔍 TEST ÉTAPE PAR ÉTAPE DE L\'INSCRIPTION');
  console.log('========================================');

  try {
    const testEmail = 'testuser' + Date.now() + '@example.com';
    const testPassword = 'TestPassword123!';
    const testFullName = 'Test User';

    console.log(`📧 Test avec: ${testEmail}`);
    console.log('');

    // Step 1: Test basic connection
    console.log('📝 Étape 1: Test de connexion de base...');
    const { data: { user: currentUser }, error: currentUserError } = await supabase.auth.getUser();

    if (currentUserError && currentUserError.message !== 'Auth session missing!') {
      console.error('❌ Problème de connexion:', currentUserError.message);
      return;
    }
    console.log('✅ Connexion de base OK');

    // Step 2: Try registration
    console.log('📝 Étape 2: Tentative d\'inscription...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName,
          role: 'member'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erreur d\'inscription:', signupError);
      console.log('   Code:', signupError.status);
      console.log('   Message:', signupError.message);

      if (signupError.message.includes('signup is disabled')) {
        console.log('');
        console.log('💡 SOLUTION: L\'inscription est désactivée dans Supabase');
        console.log('   Activez-la dans: Authentication > Settings > Enable email confirmations');
      }

      return;
    }

    console.log('✅ Inscription réussie!');
    console.log('   User ID:', signupData.user?.id);
    console.log('   Email confirmé:', signupData.user?.email_confirmed_at ? 'Oui' : 'Non');

    // Step 3: Check if user exists in auth.users
    console.log('📝 Étape 3: Vérification dans auth.users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur lors de la vérification des utilisateurs:', usersError);
    } else {
      const newUser = users.users.find(u => u.email === testEmail);
      if (newUser) {
        console.log('✅ Utilisateur trouvé dans auth.users');
      } else {
        console.log('❌ Utilisateur non trouvé dans auth.users');
      }
    }

    // Step 4: Check profiles table
    console.log('📝 Étape 4: Vérification de la table profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Erreur avec la table profiles:', profilesError);
    } else {
      console.log(`✅ ${profiles.length} profils trouvés`);
      const newProfile = profiles.find(p => p.id === signupData.user?.id);
      if (newProfile) {
        console.log('✅ Profil trouvé');
      } else {
        console.log('❌ Profil non trouvé');
      }
    }

    // Step 5: Test login
    console.log('📝 Étape 5: Test de connexion...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Erreur de connexion:', loginError.message);

      if (loginError.message.includes('Email not confirmed')) {
        console.log('');
        console.log('💡 SOLUTION: Email non confirmé');
        console.log('   Pour corriger cela:');
        console.log('   1. Désactivez la confirmation email dans Supabase Dashboard');
        console.log('   2. Ou confirmez l\'email manuellement');
      }
    } else {
      console.log('✅ Connexion réussie!');
    }

    // Cleanup
    if (signupData.user?.id) {
      await supabase.auth.admin.deleteUser(signupData.user.id);
      console.log('🗑️ Utilisateur de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

testRegistrationStepByStep();