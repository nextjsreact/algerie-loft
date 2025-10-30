// Vérifier la structure de la base de données
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Vérification du schéma de la base de données...\n');

  try {
    // Vérifier les tables existantes
    console.log('📋 Tables disponibles:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');

    if (tablesError) {
      console.log('⚠️  Impossible de récupérer la liste des tables via RPC');
      
      // Essayer une approche alternative
      const { data: lofts, error: loftsError } = await supabase
        .from('lofts')
        .select('*')
        .limit(1);
      
      if (loftsError) {
        console.error('❌ Table lofts:', loftsError.message);
      } else {
        console.log('✅ Table lofts existe');
        if (lofts.length > 0) {
          console.log('   Colonnes disponibles:', Object.keys(lofts[0]));
        }
      }

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);
      
      if (customersError) {
        console.error('❌ Table customers:', customersError.message);
      } else {
        console.log('✅ Table customers existe');
        if (customers.length > 0) {
          console.log('   Colonnes disponibles:', Object.keys(customers[0]));
        }
      }

      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .limit(1);
      
      if (reservationsError) {
        console.error('❌ Table reservations:', reservationsError.message);
      } else {
        console.log('✅ Table reservations existe');
        if (reservations.length > 0) {
          console.log('   Colonnes disponibles:', Object.keys(reservations[0]));
        }
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

checkSchema().then(success => {
  process.exit(success ? 0 : 1);
});