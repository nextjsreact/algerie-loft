// Obtenir la structure exacte de la table reservations
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getReservationStructure() {
  console.log('🔍 Analyse de la structure de la table reservations...\n');

  try {
    // Essayer d'insérer une réservation minimale pour voir les champs requis
    console.log('📝 Test d\'insertion pour découvrir les champs requis...');
    
    const { error } = await supabase
      .from('reservations')
      .insert({
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-23'
      });
    
    if (error) {
      console.log('❌ Erreur (révèle les champs requis):', error.message);
      
      // Analyser le message d'erreur pour comprendre les champs requis
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`🔍 Champ requis détecté: ${match[1]}`);
        }
      }
    }

    // Essayer avec plus de champs
    console.log('\n📝 Test avec champs supplémentaires...');
    
    const { error: error2 } = await supabase
      .from('reservations')
      .insert({
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-23',
        guest_name: 'Test Guest',
        guest_email: 'test@example.com',
        guest_phone: '+213555123456',
        total_guests: 2,
        status: 'pending'
      });
    
    if (error2) {
      console.log('❌ Erreur avec champs supplémentaires:', error2.message);
    } else {
      console.log('✅ Insertion réussie ! Récupération de la structure...');
      
      // Récupérer la réservation créée pour voir sa structure
      const { data: reservations, error: selectError } = await supabase
        .from('reservations')
        .select('*')
        .eq('guest_email', 'test@example.com')
        .limit(1);
      
      if (!selectError && reservations.length > 0) {
        console.log('\n📋 Structure de la table reservations:');
        console.log('Colonnes disponibles:', Object.keys(reservations[0]));
        console.log('\n📄 Exemple de données:');
        console.log(JSON.stringify(reservations[0], null, 2));
        
        // Nettoyer la réservation de test
        await supabase
          .from('reservations')
          .delete()
          .eq('id', reservations[0].id);
        
        console.log('\n🧹 Réservation de test supprimée');
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

getReservationStructure().then(success => {
  process.exit(success ? 0 : 1);
});