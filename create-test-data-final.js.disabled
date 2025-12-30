// Créer des données de test avec la structure correcte
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDataFinal() {
  console.log('🏗️  Création des données de test finales...\n');

  try {
    // 1. Vérifier les lofts existants
    console.log('🏠 Vérification des lofts...');
    const { data: existingLofts } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(5);

    console.log(`✅ ${existingLofts?.length || 0} lofts trouvés`);
    
    if (!existingLofts || existingLofts.length === 0) {
      console.log('❌ Aucun loft disponible. Créons-en quelques-uns...');
      
      // Créer des lofts simples
      const { data: newLofts, error: loftsError } = await supabase
        .from('lofts')
        .insert([
          {
            name: 'Loft Test Centre-ville',
            description: 'Loft de test au centre d\'Alger',
            address: '15 Rue Didouche Mourad, Alger',
            price_per_night: 8500,
            max_guests: 4,
            status: 'available',
            is_published: true
          },
          {
            name: 'Studio Test Hydra',
            description: 'Studio de test à Hydra',
            address: '42 Chemin des Glycines, Hydra',
            price_per_night: 6000,
            max_guests: 2,
            status: 'available',
            is_published: true
          }
        ])
        .select();

      if (loftsError) {
        console.error('❌ Erreur création lofts:', loftsError);
        return false;
      }

      console.log(`✅ ${newLofts.length} nouveaux lofts créés`);
      existingLofts.push(...newLofts);
    }

    // 2. Créer des réservations de test
    console.log('\n📅 Création des réservations de test...');
    
    const testReservations = [
      {
        loft_id: existingLofts[0].id,
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-23',
        guest_name: 'Ahmed Benali',
        guest_email: 'ahmed.benali@example.com',
        guest_phone: '+213555123456',
        guest_nationality: 'Algérienne',
        status: 'confirmed',
        base_price: 25500.00,
        cleaning_fee: 2000.00,
        total_amount: 32087.50
      },
      {
        loft_id: existingLofts[0].id,
        check_in_date: '2024-12-25',
        check_out_date: '2024-12-28',
        guest_name: 'Fatima Khelifi',
        guest_email: 'fatima.khelifi@example.com',
        guest_phone: '+213555234567',
        guest_nationality: 'Française',
        status: 'pending',
        base_price: 25500.00,
        cleaning_fee: 2000.00,
        total_amount: 32087.50
      }
    ];

    if (existingLofts.length > 1) {
      testReservations.push({
        loft_id: existingLofts[1].id,
        check_in_date: '2024-12-30',
        check_out_date: '2025-01-02',
        guest_name: 'Karim Messaoudi',
        guest_email: 'karim.messaoudi@example.com',
        guest_phone: '+213555345678',
        guest_nationality: 'Canadienne',
        status: 'confirmed',
        base_price: 18000.00,
        cleaning_fee: 1500.00,
        total_amount: 23085.00
      });
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .insert(testReservations)
      .select();

    if (reservationsError) {
      console.error('❌ Erreur création réservations:', reservationsError);
      return false;
    }

    console.log(`✅ ${reservations.length} réservations créées`);

    // 3. Créer des clients de test
    console.log('\n👥 Création des clients de test...');
    
    const testCustomers = [
      {
        first_name: 'Ahmed',
        last_name: 'Benali',
        email: 'ahmed.benali.client@example.com',
        phone: '+213555123456',
        status: 'active'
      },
      {
        first_name: 'Fatima',
        last_name: 'Khelifi',
        email: 'fatima.khelifi.client@example.com',
        phone: '+213555234567',
        status: 'active'
      },
      {
        first_name: 'Karim',
        last_name: 'Messaoudi',
        email: 'karim.messaoudi.client@example.com',
        phone: '+213555345678',
        status: 'active'
      }
    ];

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert(testCustomers)
      .select();

    if (customersError) {
      console.error('❌ Erreur création clients:', customersError);
      return false;
    }

    console.log(`✅ ${customers.length} clients créés`);

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   - ${existingLofts.length} lofts disponibles`);
    console.log(`   - ${reservations.length} réservations créées`);
    console.log(`   - ${customers.length} clients créés`);
    
    console.log('\n📋 Détails des réservations:');
    reservations.forEach((res, index) => {
      console.log(`   ${index + 1}. ${res.guest_name} - ${res.check_in_date} à ${res.check_out_date} (${res.status})`);
    });

    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    return false;
  }
}

createTestDataFinal().then(success => {
  process.exit(success ? 0 : 1);
});