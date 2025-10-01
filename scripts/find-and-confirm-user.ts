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

async function findAndConfirmUser() {
  console.log('🔍 RECHERCHE ET CONFIRMATION D\'UTILISATEUR');
  console.log('===========================================');

  try {
    // 1. Get all users
    console.log('📋 Récupération de tous les utilisateurs...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    console.log(`✅ ${users.users.length} utilisateurs trouvés:`);
    console.log('');

    // 2. Display all users with their status
    users.users.forEach((user, index) => {
      const confirmed = user.email_confirmed_at ? '✅ Confirmé' : '❌ Non confirmé';
      const created = new Date(user.created_at).toLocaleString();
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Statut: ${confirmed}`);
      console.log(`   Créé: ${created}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // 3. Ask which user to confirm
    console.log('💡 Pour confirmer un utilisateur, notez son numéro et exécutez:');
    console.log('   npx tsx scripts/confirm-user-by-index.ts <numéro>');
    console.log('');
    console.log('   Exemple: npx tsx scripts/confirm-user-by-index.ts 1');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

findAndConfirmUser();