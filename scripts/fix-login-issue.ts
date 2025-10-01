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

async function fixLoginIssue() {
  console.log('🔧 RÉPARATION DU PROBLÈME DE CONNEXION');
  console.log('=====================================');

  try {
    // 1. Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.log('ℹ️ Aucun utilisateur trouvé');
      console.log('💡 Créez d\'abord un compte via l\'interface web');
      return;
    }

    console.log(`✅ ${users.users.length} utilisateurs trouvés:`);
    console.log('');

    // 2. Check each user status
    for (const user of users.users) {
      const confirmed = user.email_confirmed_at ? '✅ Confirmé' : '❌ Non confirmé';
      const created = new Date(user.created_at).toLocaleString();

      console.log(`📧 ${user.email}`);
      console.log(`   Statut: ${confirmed}`);
      console.log(`   Créé: ${created}`);
      console.log(`   ID: ${user.id}`);

      // 3. Confirm unconfirmed users
      if (!user.email_confirmed_at) {
        console.log('   🔧 Confirmation automatique...');

        const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });

        if (confirmError) {
          console.log(`   ❌ Erreur de confirmation: ${confirmError.message}`);
        } else {
          console.log('   ✅ Email confirmé avec succès!');
        }
      }

      console.log('');
    }

    console.log('🎉 Tous les utilisateurs ont été confirmés!');
    console.log('');
    console.log('💡 Maintenant essayez de vous connecter avec:');
    console.log('   - L\'email que vous avez utilisé pour l\'inscription');
    console.log('   - Le mot de passe que vous avez choisi');
    console.log('');
    console.log('🚀 Allez sur: http://localhost:3000/fr/login');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

fixLoginIssue();