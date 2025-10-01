import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'env-backup/.env.prod' });
dotenv.config({ path: 'env-backup/.env.development' });

const prodUrl = process.env.VITE_SUPABASE_URL;
const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prodServiceKey = process.env.SUPABASE_SERVICE_KEY;
const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!prodUrl || !devUrl || !prodServiceKey || !devServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const prodSupabase = createClient(prodUrl, prodServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const devSupabase = createClient(devUrl, devServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function cloneCustomersData() {
  console.log('📋 CLONAGE DES DONNÉES CUSTOMERS DE PROD VERS DEV');
  console.log('==================================================');

  try {
    // 1. Récupérer les données de PROD
    console.log('📥 Récupération des données depuis PROD...');
    const { data: prodData, error: prodError } = await prodSupabase
      .from('customers')
      .select('*');

    if (prodError) {
      console.error('❌ Erreur lors de la récupération PROD:', prodError);
      return;
    }

    console.log(`✅ ${prodData.length} enregistrements trouvés dans PROD`);

    if (prodData.length === 0) {
      console.log('ℹ️  Aucune donnée à cloner');
      return;
    }

    // 2. Insérer les données dans DEV
    console.log('📤 Insertion des données dans DEV...');
    const { data: devData, error: devError } = await devSupabase
      .from('customers')
      .insert(prodData)
      .select();

    if (devError) {
      console.error('❌ Erreur lors de l\'insertion DEV:', devError);
      return;
    }

    console.log(`✅ ${devData.length} enregistrements insérés dans DEV`);

    // 3. Vérification finale
    console.log('🔍 Vérification finale...');
    const { data: finalCheck, error: checkError } = await devSupabase
      .from('customers')
      .select('id, email, full_name')
      .limit(5);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
    } else {
      console.log('✅ Données dans DEV:');
      console.table(finalCheck);
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

cloneCustomersData();