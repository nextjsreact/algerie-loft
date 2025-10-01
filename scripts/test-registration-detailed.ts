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

async function testRegistrationDetailed() {
  console.log('🔍 TEST DÉTAILLÉ D\'INSCRIPTION');
  console.log('==============================');

  try {
    // Test with a real email format
    const testEmail = 'testuser123@gmail.com';
    const testPassword = 'TestPassword123!';
    const testFullName = 'Test User';

    console.log(`📧 Test avec: ${testEmail}`);

    // 1. Try registration
    console.log('📝 Étape 1: Tentative d\'inscription...');
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
      console.error('❌ Erreur lors de l\'inscription:', signupError);
      console.log('   Code:', signupError.status);
      console.log('   Message:', signupError.message);
      console.log('   Détails:', signupError);

      // Check if it's an email validation issue
      if (signupError.message.includes('email')) {
        console.log('');
        console.log('💡 SOLUTION: Le problème est lié à la validation d\'email');
        console.log('   Vérifiez la configuration SMTP dans Supabase Dashboard');
        console.log('   Authentication > Settings > SMTP Settings');
      }

      return;
    }

    console.log('✅ Inscription réussie!');
    console.log('   User ID:', signupData.user?.id);
    console.log('   Email confirmé:', signupData.user?.email_confirmed_at ? 'Oui' : 'Non');
    console.log('   Nécessite confirmation:', signupData.user?.email_confirmed_at ? 'Non' : 'Oui');

    // 2. Check if user was created in auth.users
    console.log('📝 Étape 2: Vérification de l\'utilisateur dans auth...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur lors de la vérification des utilisateurs:', usersError);
    } else {
      const newUser = users.users.find(u => u.email === testEmail);
      if (newUser) {
        console.log('✅ Utilisateur trouvé dans auth.users');
        console.log('   Email:', newUser.email);
        console.log('   Créé le:', new Date(newUser.created_at).toLocaleString());
      } else {
        console.log('❌ Utilisateur non trouvé dans auth.users');
      }
    }

    // 3. Check if profile was created
    console.log('📝 Étape 3: Vérification du profil...');
    if (signupData.user?.id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single();

      if (profileError) {
        console.log('ℹ️ Profil non trouvé (normal si pas de trigger):', profileError.message);
      } else {
        console.log('✅ Profil trouvé:');
        console.log('   Nom:', profile.full_name);
        console.log('   Rôle:', profile.role);
      }
    }

    // 4. Test login with the new user
    console.log('📝 Étape 4: Test de connexion...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Erreur de connexion:', loginError.message);
    } else {
      console.log('✅ Connexion réussie!');
    }

    // 5. Clean up - delete test user
    console.log('📝 Étape 5: Nettoyage...');
    if (signupData.user?.id) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
      if (deleteError) {
        console.log('ℹ️ Erreur lors de la suppression (normal):', deleteError.message);
      } else {
        console.log('✅ Utilisateur de test supprimé');
      }
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

testRegistrationDetailed();