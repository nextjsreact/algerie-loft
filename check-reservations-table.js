// Vérifier la structure de la table reservations
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReservationsTable() {
  console.log('🔍 Vérification de la table reservations...\n');

  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return false;
    }

    if (reservations.length > 0) {
      console.log('✅ Table reservations existe avec des données');
      console.log('📋 Colonnes disponibles:', Object.keys(reservations[0]));
    } else {
      console.log('✅ Table reservations existe mais est vide');
      
      // Essayer d'insérer une réservation simple pour voir les colonnes requises
      const { error: insertError } = await supabase
        .from('reservations')
        .insert({
          check_in_date: '2024-12-20',
          check_out_date: '2024-12-23'
        });
      
      if (insertError) {
        console.log('📋 Erreur d\'insertion (révèle la structure):', insertError.message);
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

checkReservationsTable().then(success => {
  process.exit(success ? 0 : 1);
});