// Test d'insertion de réservation avec la bonne structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReservationInsert() {
  console.log('🧪 Test d\'insertion de réservation...\n');

  try {
    // Récupérer un loft existant
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id')
      .limit(1);
    
    if (!lofts || lofts.length === 0) {
      console.log('❌ Aucun loft disponible pour le test');
      return false;
    }

    const loftId = lofts[0].id;
    console.log(`🏠 Utilisation du loft: ${loftId}`);

    // Essayer d'insérer une réservation avec les champs de base
    console.log('📝 Insertion de réservation...');
    
    const reservationData = {
      loft_id: loftId,
      check_in_date: '2024-12-20',
      check_out_date: '2024-12-23',
      guest_name: 'Ahmed Benali',
      guest_email: 'ahmed.test@example.com',
      guest_phone: '+213555123456',
      status: 'pending'
    };

    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      
      // Essayer sans certains champs
      console.log('\n📝 Essai avec champs minimaux...');
      const minimalData = {
        loft_id: loftId,
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-23',
        guest_name: 'Ahmed Benali'
      };

      const { data: minReservation, error: minError } = await supabase
        .from('reservations')
        .insert(minimalData)
        .select()
        .single();
      
      if (minError) {
        console.log('❌ Erreur avec champs minimaux:', minError.message);
      } else {
        console.log('✅ Insertion réussie avec champs minimaux !');
        console.log('📋 Structure de la réservation créée:');
        console.log('Colonnes:', Object.keys(minReservation));
        
        // Nettoyer
        await supabase
          .from('reservations')
          .delete()
          .eq('id', minReservation.id);
        
        console.log('🧹 Réservation de test supprimée');
      }
    } else {
      console.log('✅ Insertion réussie !');
      console.log('📋 Structure de la réservation créée:');
      console.log('Colonnes:', Object.keys(reservation));
      console.log('\n📄 Données:');
      console.log(JSON.stringify(reservation, null, 2));
      
      // Nettoyer
      await supabase
        .from('reservations')
        .delete()
        .eq('id', reservation.id);
      
      console.log('\n🧹 Réservation de test supprimée');
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

testReservationInsert().then(success => {
  process.exit(success ? 0 : 1);
});