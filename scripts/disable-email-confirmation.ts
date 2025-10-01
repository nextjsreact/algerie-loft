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

async function disableEmailConfirmation() {
  console.log('⚙️ DÉSACTIVATION DE LA CONFIRMATION EMAIL');
  console.log('=========================================');

  try {
    console.log('💡 Pour désactiver la confirmation email en développement:');
    console.log('');
    console.log('1. Allez dans votre Supabase Dashboard');
    console.log('2. Authentication > Settings');
    console.log('3. Décochez "Enable email confirmations"');
    console.log('4. Sauvegardez les paramètres');
    console.log('');
    console.log('📧 Alternative: Configurez SMTP pour recevoir les emails');
    console.log('   Authentication > Settings > SMTP Settings');
    console.log('   - Utilisez Gmail, SendGrid, ou Mailtrap pour les tests');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

disableEmailConfirmation();