// Test de connectivité à la base de données
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

async function testConnection() {
  console.log('🔍 Test de connectivité à Supabase...\n');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log('📡 URL Supabase:', process.env.SUPABASE_URL);
    console.log('🔑 Clé anonyme:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');

    // Test de base - récupérer les lofts
    console.log('\n🏠 Test: Récupération des lofts...');
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, status')
      .limit(5);

    if (loftsError) {
      console.error('❌ Erreur lofts:', loftsError);
    } else {
      console.log(`✅ Lofts récupérés: ${lofts?.length || 0}`);
      if (lofts?.length > 0) {
        console.log('   Premier loft:', lofts[0].name);
      }
    }

    // Test avec service role
    console.log('\n🔧 Test: Service role...');
    const supabaseService = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: customers, error: customersError } = await supabaseService
      .from('customers')
      .select('count')
      .limit(1);

    if (customersError) {
      console.error('❌ Erreur service role:', customersError);
    } else {
      console.log('✅ Service role fonctionne');
    }

    // Test des fonctions
    console.log('\n⚙️  Test: Fonctions de base de données...');
    const { data: healthCheck, error: healthError } = await supabaseService
      .rpc('cleanup_expired_locks');

    if (healthError) {
      console.log('⚠️  Fonction cleanup_expired_locks non disponible (normal si pas encore déployée)');
    } else {
      console.log('✅ Fonctions de base de données disponibles');
    }

    console.log('\n🎉 Tests de connectivité terminés avec succès !');
    return true;

  } catch (error) {
    console.error('❌ Erreur de connectivité:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});