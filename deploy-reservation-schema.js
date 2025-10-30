// Déployer le schéma de réservation client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deployReservationSchema() {
  console.log('🚀 Déploiement du schéma de réservation client...\n');

  try {
    // Lire le fichier SQL
    console.log('📖 Lecture du schéma...');
    const schemaSQL = readFileSync('database/client-reservation-booking-schema.sql', 'utf8');
    
    console.log('📊 Exécution du schéma...');
    
    // Diviser le SQL en commandes individuelles
    const commands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.length < 10) continue; // Skip très petites commandes
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Certaines erreurs sont acceptables (table existe déjà, etc.)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate')) {
            console.log(`⚠️  Commande ${i + 1}: ${error.message.substring(0, 100)}...`);
          } else {
            console.log(`❌ Commande ${i + 1}: ${error.message.substring(0, 100)}...`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Essayer d'exécuter directement si la fonction exec_sql n'existe pas
        try {
          await supabase.from('_temp_sql_exec').select(command);
        } catch (directError) {
          console.log(`⚠️  Commande ${i + 1}: Impossible d'exécuter directement`);
        }
      }
    }

    console.log(`\n📊 Résultats:`);
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);

    // Vérifier que les tables principales existent maintenant
    console.log('\n🔍 Vérification post-déploiement...');
    
    const tablesToCheck = ['reservations', 'customers', 'lofts'];
    
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
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error);
    return false;
  }
}

deployReservationSchema().then(success => {
  process.exit(success ? 0 : 1);
});