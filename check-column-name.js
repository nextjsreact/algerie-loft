/**
 * Script pour vérifier quel nom de colonne est utilisé dans lofts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnName() {
  console.log('🔍 Vérification du nom de la colonne owner dans lofts...\n');

  try {
    // Essayer de récupérer un loft avec new_owner_id
    const { data: loftWithNew, error: errorNew } = await supabase
      .from('lofts')
      .select('id, new_owner_id')
      .limit(1)
      .single();

    // Essayer de récupérer un loft avec owner_id
    const { data: loftWithOld, error: errorOld } = await supabase
      .from('lofts')
      .select('id, owner_id')
      .limit(1)
      .single();

    console.log('📊 Résultats:\n');

    if (!errorNew && loftWithNew) {
      console.log('✅ Colonne "new_owner_id" existe');
      console.log(`   Valeur: ${loftWithNew.new_owner_id || 'NULL'}\n`);
    } else {
      console.log('❌ Colonne "new_owner_id" n\'existe pas');
      console.log(`   Erreur: ${errorNew?.message}\n`);
    }

    if (!errorOld && loftWithOld) {
      console.log('✅ Colonne "owner_id" existe');
      console.log(`   Valeur: ${loftWithOld.owner_id || 'NULL'}\n`);
    } else {
      console.log('❌ Colonne "owner_id" n\'existe pas');
      console.log(`   Erreur: ${errorOld?.message}\n`);
    }

    // Déterminer quelle colonne utiliser
    console.log('═'.repeat(60));
    console.log('\n💡 Recommandation:\n');

    if (!errorNew) {
      console.log('📌 Utiliser "new_owner_id" dans le code');
      console.log('   La finalisation n\'a pas encore été exécutée.\n');
      console.log('📝 Actions:');
      console.log('   1. Le code doit utiliser "new_owner_id"');
      console.log('   2. Ou exécuter finalize-migration.sql pour renommer\n');
      return 'new_owner_id';
    } else if (!errorOld) {
      console.log('📌 Utiliser "owner_id" dans le code');
      console.log('   La finalisation a été exécutée.\n');
      console.log('✅ Tout est OK, le code doit utiliser "owner_id"\n');
      return 'owner_id';
    } else {
      console.log('❌ Aucune colonne owner trouvée!');
      console.log('   Problème avec la migration.\n');
      return null;
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

checkColumnName()
  .then(columnName => {
    if (columnName) {
      console.log(`\n🎯 Colonne à utiliser: "${columnName}"\n`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
