/**
 * Backup des anciennes tables avant finalisation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupTables() {
  console.log('💾 Backup des anciennes tables avant finalisation...\n');

  try {
    // Backup loft_owners
    console.log('1️⃣  Backup de loft_owners...');
    const { data: loftOwners, error: error1 } = await supabase
      .from('loft_owners')
      .select('*');

    if (error1) {
      console.error('❌ Erreur:', error1.message);
    } else {
      fs.writeFileSync(
        'backup-loft-owners.json',
        JSON.stringify(loftOwners, null, 2)
      );
      console.log(`✅ ${loftOwners.length} enregistrements sauvegardés dans backup-loft-owners.json\n`);
    }

    // Backup partner_profiles
    console.log('2️⃣  Backup de partner_profiles...');
    const { data: partnerProfiles, error: error2 } = await supabase
      .from('partner_profiles')
      .select('*');

    if (error2) {
      console.error('❌ Erreur:', error2.message);
    } else {
      fs.writeFileSync(
        'backup-partner-profiles.json',
        JSON.stringify(partnerProfiles, null, 2)
      );
      console.log(`✅ ${partnerProfiles.length} enregistrements sauvegardés dans backup-partner-profiles.json\n`);
    }

    // Backup de la structure actuelle de lofts
    console.log('3️⃣  Backup de la structure lofts...');
    const { data: lofts, error: error3 } = await supabase
      .from('lofts')
      .select('id, name, owner_id, partner_id, new_owner_id');

    if (error3) {
      console.error('❌ Erreur:', error3.message);
    } else {
      fs.writeFileSync(
        'backup-lofts-structure.json',
        JSON.stringify(lofts, null, 2)
      );
      console.log(`✅ ${lofts.length} lofts sauvegardés dans backup-lofts-structure.json\n`);
    }

    console.log('═'.repeat(60));
    console.log('✅ Backup terminé!\n');
    console.log('📁 Fichiers créés:');
    console.log('   - backup-loft-owners.json');
    console.log('   - backup-partner-profiles.json');
    console.log('   - backup-lofts-structure.json\n');
    console.log('🔒 Ces fichiers permettent de restaurer les données si nécessaire.\n');

    return true;

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    return false;
  }
}

backupTables()
  .then(success => {
    if (success) {
      console.log('✅ Prêt pour la finalisation!');
      console.log('\n📝 Prochaine étape:');
      console.log('   Exécuter: node finalize-migration.js\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
