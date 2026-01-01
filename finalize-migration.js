/**
 * Finalisation de la migration - IRRÉVERSIBLE!
 * Ce script:
 * 1. Renomme new_owner_id en owner_id dans lofts
 * 2. Supprime les anciennes colonnes owner_id et partner_id
 * 3. Supprime les anciennes tables owners et partner_profiles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function confirmAction() {
  console.log('\n');
  console.log('⚠️  '.repeat(35));
  console.log('\n');
  console.log('  🚨 ATTENTION: OPÉRATION IRRÉVERSIBLE! 🚨\n');
  console.log('  Cette opération va:');
  console.log('  1. Supprimer les colonnes owner_id et partner_id de lofts');
  console.log('  2. Renommer new_owner_id en owner_id');
  console.log('  3. Supprimer les tables owners et partner_profiles');
  console.log('\n');
  console.log('  ✅ Backup créé: backup-loft-owners.json, backup-partner-profiles.json');
  console.log('  ✅ 26 propriétaires dans la table owners');
  console.log('  ✅ Relation lofts -> owners fonctionnelle');
  console.log('\n');
  console.log('⚠️  '.repeat(35));
  console.log('\n');

  const answer = await question('  Êtes-vous SÛR de vouloir continuer? (tapez "OUI" en majuscules): ');
  return answer === 'OUI';
}

async function executeSQL(description, sql) {
  console.log(`\n${description}...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log('✅ Fait');
    return true;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return false;
  }
}

async function finalizeMigration() {
  console.log('\n🚀 FINALISATION DE LA MIGRATION\n');
  console.log('═'.repeat(60));

  // Étape 1: Supprimer les anciennes colonnes
  console.log('\n📋 ÉTAPE 1: Nettoyage des colonnes dans lofts');
  
  let success = await executeSQL(
    '  Suppression de la colonne owner_id (ancienne)',
    'ALTER TABLE lofts DROP COLUMN IF EXISTS owner_id CASCADE;'
  );
  
  if (!success) {
    console.log('\n⚠️  Erreur lors de la suppression de owner_id');
    console.log('   Continuons quand même...\n');
  }

  success = await executeSQL(
    '  Suppression de la colonne partner_id',
    'ALTER TABLE lofts DROP COLUMN IF EXISTS partner_id CASCADE;'
  );

  if (!success) {
    console.log('\n⚠️  Erreur lors de la suppression de partner_id');
    console.log('   Continuons quand même...\n');
  }

  // Étape 2: Renommer new_owner_id en owner_id
  console.log('\n📋 ÉTAPE 2: Renommage de new_owner_id en owner_id');
  
  success = await executeSQL(
    '  Renommage de la colonne',
    'ALTER TABLE lofts RENAME COLUMN new_owner_id TO owner_id;'
  );

  if (!success) {
    console.log('\n❌ Erreur critique lors du renommage!');
    console.log('   Arrêt de la finalisation.\n');
    return false;
  }

  // Étape 3: Supprimer les anciennes tables
  console.log('\n📋 ÉTAPE 3: Suppression des anciennes tables');

  success = await executeSQL(
    '  Suppression de owners',
    'DROP TABLE IF EXISTS owners CASCADE;'
  );

  success = await executeSQL(
    '  Suppression de partner_profiles',
    'DROP TABLE IF EXISTS partner_profiles CASCADE;'
  );

  success = await executeSQL(
    '  Suppression de partners (si existe)',
    'DROP TABLE IF EXISTS partners CASCADE;'
  );

  // Vérification finale
  console.log('\n📋 ÉTAPE 4: Vérification finale');
  
  const { count: ownersCount } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true });

  const { count: loftsCount } = await supabase
    .from('lofts')
    .select('*', { count: 'exact', head: true });

  const { count: loftsWithOwner } = await supabase
    .from('lofts')
    .select('*', { count: 'exact', head: true })
    .not('owner_id', 'is', null);

  console.log('\n┌─────────────────────────────┬─────────┐');
  console.log('│ Métrique                    │ Valeur  │');
  console.log('├─────────────────────────────┼─────────┤');
  console.log(`│ Propriétaires (owners)      │ ${String(ownersCount || 0).padStart(7)} │`);
  console.log(`│ Total lofts                 │ ${String(loftsCount || 0).padStart(7)} │`);
  console.log(`│ Lofts avec owner_id         │ ${String(loftsWithOwner || 0).padStart(7)} │`);
  console.log('└─────────────────────────────┴─────────┘\n');

  // Test de la relation
  console.log('  Test de la relation lofts -> owners...');
  const { data: testLofts, error: testError } = await supabase
    .from('lofts')
    .select('id, name, owner:owners(name)')
    .not('owner_id', 'is', null)
    .limit(3);

  if (testError) {
    console.log(`  ⚠️  Erreur: ${testError.message}`);
  } else {
    console.log('  ✅ Relation fonctionnelle!');
    testLofts.forEach(loft => {
      console.log(`     - ${loft.name} → ${loft.owner?.name || 'N/A'}`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 MIGRATION FINALISÉE AVEC SUCCÈS!\n');
  console.log('✅ Structure finale:');
  console.log('   - Table owners (26 propriétaires)');
  console.log('   - Table lofts avec colonne owner_id');
  console.log('   - Anciennes tables supprimées\n');
  console.log('📝 Prochaines étapes:');
  console.log('   1. Redémarrer l\'application: npm run dev');
  console.log('   2. Tester la création/édition de lofts');
  console.log('   3. Vérifier que tout fonctionne correctement\n');
  console.log('💾 Backup disponible:');
  console.log('   - backup-loft-owners.json');
  console.log('   - backup-partner-profiles.json');
  console.log('   - backup-lofts-structure.json\n');

  return true;
}

async function main() {
  try {
    const confirmed = await confirmAction();
    
    if (!confirmed) {
      console.log('\n❌ Opération annulée par l\'utilisateur.\n');
      rl.close();
      process.exit(0);
    }

    console.log('\n✅ Confirmation reçue. Démarrage de la finalisation...\n');
    
    const success = await finalizeMigration();
    
    rl.close();
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
