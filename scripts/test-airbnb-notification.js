/**
 * Script de test pour créer une notification Airbnb
 * Usage: node scripts/test-airbnb-notification.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestNotification() {
  try {
    console.log('🔍 Récupération d\'un loft...');
    
    // Récupérer un loft
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(1)
      .single();

    if (loftError || !loft) {
      console.error('❌ Erreur lors de la récupération du loft:', loftError);
      return;
    }

    console.log('✅ Loft trouvé:', loft.name);

    // Créer une notification de test
    const testNotification = {
      reservation_id: crypto.randomUUID(),
      loft_id: loft.id,
      type: 'new',
      title: `🎉 Nouvelle réservation - ${loft.name}`,
      message: `Jean Dupont • 15 juin 2026 → 18 juin 2026 (3 nuits) • 45 000 DA`,
      metadata: {
        guest_name: 'Jean Dupont',
        check_in: '2026-06-15',
        check_out: '2026-06-18',
        total_price: 45000,
        status: 'confirmed',
        loft_name: loft.name,
        test: true,
        created_by_script: true,
        created_at: new Date().toISOString()
      },
      is_read: false
    };

    console.log('📝 Création de la notification...');

    const { data, error } = await supabase
      .from('airbnb_notifications')
      .insert(testNotification)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création:', error);
      return;
    }

    console.log('\n✅ Notification créée avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Détails de la notification:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:        ${data.id}`);
    console.log(`Type:      ${data.type}`);
    console.log(`Titre:     ${data.title}`);
    console.log(`Message:   ${data.message}`);
    console.log(`Loft:      ${loft.name}`);
    console.log(`Invité:    Jean Dupont`);
    console.log(`Dates:     15 juin 2026 → 18 juin 2026`);
    console.log(`Prix:      45 000 DA`);
    console.log(`Créée le:  ${new Date(data.created_at).toLocaleString('fr-FR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔔 Vérifiez la cloche de notification dans l\'interface !');
    console.log('   La notification devrait apparaître dans la section "🏠 Airbnb"');
    console.log('\n💡 Pour tester:');
    console.log('   1. Cliquez sur la cloche de notification');
    console.log('   2. Vérifiez que la notification apparaît');
    console.log('   3. Cliquez sur la notification pour la marquer comme lue');
    console.log('   4. Vérifiez qu\'elle disparaît et que le badge se met à jour');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
createTestNotification();
