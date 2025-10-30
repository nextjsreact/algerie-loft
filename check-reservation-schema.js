// Vérifier si le schéma de réservation client est déployé
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReservationSchema() {
  console.log('🔍 Vérification du schéma de réservation client...\n');

  const tablesToCheck = [
    'reservations',
    'reservation_audit_log', 
    'reservation_communications',
    'reservation_payments',
    'reservation_locks'
  ];

  const functionsToCheck = [
    'check_loft_availability',
    'calculate_reservation_pricing',
    'create_reservation_lock',
    'cleanup_expired_locks'
  ];

  try {
    console.log('📋 Vérification des tables...');
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
          if (data.length > 0) {
            console.log(`   Colonnes: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    console.log('\n⚙️  Vérification des fonctions...');
    for (const func of functionsToCheck) {
      try {
        // Test simple pour voir si la fonction existe
        const { error } = await supabase.rpc(func, {});
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ Fonction ${func}: N'existe pas`);
        } else {
          console.log(`✅ Fonction ${func}: Existe`);
        }
      } catch (err) {
        if (err.message.includes('function') && err.message.includes('does not exist')) {
          console.log(`❌ Fonction ${func}: N'existe pas`);
        } else {
          console.log(`✅ Fonction ${func}: Existe (erreur de paramètres attendue)`);
        }
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

checkReservationSchema().then(success => {
  process.exit(success ? 0 : 1);
});