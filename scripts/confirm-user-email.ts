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

async function confirmUserEmail(email: string) {
  console.log('🔓 CONFIRMATION D\'EMAIL UTILISATEUR');
  console.log('===================================');

  try {
    // 1. Find the user by email
    console.log(`📧 Recherche de l'utilisateur: ${email}`);
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur lors de la recherche:', usersError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${email}`);
      return;
    }

    console.log('✅ Utilisateur trouvé:', user.email);

    // 2. Confirm the user's email
    console.log('📧 Confirmation de l\'email...');
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (error) {
      console.error('❌ Erreur lors de la confirmation:', error);
    } else {
      console.log('✅ Email confirmé avec succès!');
      console.log('   L\'utilisateur peut maintenant se connecter');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: npx tsx scripts/confirm-user-email.ts <email>');
  console.log('Exemple: npx tsx scripts/confirm-user-email.ts test@example.com');
  process.exit(1);
}

confirmUserEmail(email);