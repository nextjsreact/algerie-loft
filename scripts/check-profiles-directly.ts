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

async function checkProfilesDirectly() {
  console.log('📋 VÉRIFICATION DIRECTE DE LA TABLE PROFILES');
  console.log('============================================');

  try {
    // Check profiles table directly
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Erreur avec la table profiles:', profilesError);
      console.log('   Cela peut indiquer un problème de permissions ou de schéma');
      return;
    }

    console.log(`✅ ${profiles.length} profils trouvés dans la table profiles:`);
    console.log('');

    if (profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.full_name || 'Sans nom'}`);
        console.log(`   Email ID: ${profile.id}`);
        console.log(`   Rôle: ${profile.role}`);
        console.log(`   Créé: ${new Date(profile.created_at).toLocaleString()}`);
        console.log('');
      });

      console.log('💡 Ces profils existent mais les utilisateurs auth correspondants peuvent être manquants');
      console.log('   Cela indique que l\'inscription a créé le profil mais échoué sur l\'auth');
    } else {
      console.log('ℹ️ Aucun profil trouvé - l\'inscription n\'a pas encore fonctionné');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

checkProfilesDirectly();