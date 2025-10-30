// Script pour créer des données de test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestData() {
  console.log('🏗️  Création des données de test...\n');

  try {
    // 1. Créer des lofts de test
    console.log('🏠 Création des lofts de test...');
    
    const testLofts = [
      {
        name: 'Loft Moderne Centre-ville',
        description: 'Magnifique loft au cœur d\'Alger avec vue sur la mer',
        address: '15 Rue Didouche Mourad, Alger Centre',
        price_per_night: 8500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        status: 'available',
        amenities: ['wifi', 'kitchen', 'parking', 'air_conditioning'],
        cleaning_fee: 2000,
        tax_rate: 19.0,
        is_published: true
      },
      {
        name: 'Studio Cosy Hydra',
        description: 'Studio élégant dans le quartier résidentiel d\'Hydra',
        address: '42 Chemin des Glycines, Hydra, Alger',
        price_per_night: 6000,
        max_guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        status: 'available',
        amenities: ['wifi', 'kitchen', 'balcony'],
        cleaning_fee: 1500,
        tax_rate: 19.0,
        is_published: true
      },
      {
        name: 'Appartement Familial Bab Ezzouar',
        description: 'Grand appartement parfait pour les familles',
        address: '78 Cité AADL, Bab Ezzouar, Alger',
        price_per_night: 12000,
        max_guests: 6,
        bedrooms: 3,
        bathrooms: 2,
        status: 'available',
        amenities: ['wifi', 'kitchen', 'parking', 'washing_machine', 'playground'],
        cleaning_fee: 3000,
        tax_rate: 19.0,
        is_published: true
      }
    ];

    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .insert(testLofts)
      .select();

    if (loftsError) {
      console.error('❌ Erreur création lofts:', loftsError);
      return false;
    }

    console.log(`✅ ${lofts.length} lofts créés`);

    // 2. Créer des clients de test
    console.log('\n👥 Création des clients de test...');
    
    const testCustomers = [
      {
        first_name: 'Ahmed',
        last_name: 'Benali',
        email: 'ahmed.benali@example.com',
        phone: '+213555123456',
        status: 'active'
      },
      {
        first_name: 'Fatima',
        last_name: 'Khelifi',
        email: 'fatima.khelifi@example.com',
        phone: '+213555234567',
        status: 'active'
      },
      {
        first_name: 'Karim',
        last_name: 'Messaoudi',
        email: 'karim.messaoudi@example.com',
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

    // 3. Créer quelques réservations de test
    console.log('\n📅 Création des réservations de test...');
    
    const testReservations = [
      {
        loft_id: lofts[0].id,
        customer_id: customers[0].id,
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-23',
        guest_info: {
          primary_guest: {
            first_name: 'Ahmed',
            last_name: 'Benali',
            email: 'ahmed.benali@example.com',
            phone: '+213555123456'
          },
          total_guests: 2,
          adults: 2,
          children: 0,
          infants: 0
        },
        pricing: {
          base_price: 25500,
          nights: 3,
          nightly_rate: 8500,
          cleaning_fee: 2000,
          service_fee: 2750,
          taxes: 5737.5,
          total_amount: 35987.5,
          currency: 'DZD'
        },
        status: 'confirmed',
        payment_status: 'paid',
        terms_accepted: true
      }
    ];

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .insert(testReservations)
      .select();

    if (reservationsError) {
      console.error('❌ Erreur création réservations:', reservationsError);
      return false;
    }

    console.log(`✅ ${reservations.length} réservations créées`);

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   - ${lofts.length} lofts`);
    console.log(`   - ${customers.length} clients`);
    console.log(`   - ${reservations.length} réservations`);
    
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    return false;
  }
}

setupTestData().then(success => {
  process.exit(success ? 0 : 1);
});