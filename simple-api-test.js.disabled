// Test simple de l'API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function testAPI() {
  console.log('🧪 Test simple de l\'API...\n');

  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  try {
    // Test 1: Page d'accueil
    console.log('🏠 Test: Page d\'accueil...');
    const homeResponse = await fetch(baseURL);
    
    if (homeResponse.ok) {
      console.log(`✅ Page d'accueil accessible (${homeResponse.status})`);
    } else {
      console.log(`❌ Page d'accueil inaccessible (${homeResponse.status})`);
    }

    // Test 2: API Health
    console.log('\n🔍 Test: API Health...');
    try {
      const healthResponse = await fetch(`${baseURL}/api/health`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ API Health OK');
        console.log('   Réponse:', JSON.stringify(healthData, null, 2));
      } else {
        console.log(`❌ API Health échoué (${healthResponse.status})`);
      }
    } catch (healthError) {
      console.log('⚠️  Endpoint /api/health non disponible (normal si pas implémenté)');
    }

    // Test 3: Base de données via Supabase
    console.log('\n🗄️  Test: Accès base de données...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, status')
      .limit(3);

    if (loftsError) {
      console.log('❌ Erreur base de données:', loftsError.message);
    } else {
      console.log(`✅ Base de données accessible - ${lofts.length} lofts trouvés`);
      lofts.forEach((loft, index) => {
        console.log(`   ${index + 1}. ${loft.name} (${loft.status})`);
      });
    }

    // Test 4: Réservations
    console.log('\n📅 Test: Accès réservations...');
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('id, guest_name, status, check_in_date, check_out_date')
      .limit(3);

    if (resError) {
      console.log('❌ Erreur réservations:', resError.message);
    } else {
      console.log(`✅ Réservations accessibles - ${reservations.length} réservations trouvées`);
      reservations.forEach((res, index) => {
        console.log(`   ${index + 1}. ${res.guest_name} - ${res.check_in_date} à ${res.check_out_date} (${res.status})`);
      });
    }

    console.log('\n🎉 Tests simples terminés avec succès !');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return false;
  }
}

testAPI().then(success => {
  process.exit(success ? 0 : 1);
});