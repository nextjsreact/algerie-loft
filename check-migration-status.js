/**
 * Script pour vérifier l'état de la migration vers la table owners
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrationStatus() {
  console.log('🔍 Vérification de l\'état de la migration...\n');

  try {
    // Vérifier si la table owners existe
    const { count: ownersCount, error: ownersError } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true });

    const ownersExists = !ownersError;

    // Vérifier loft_owners
    const { count: loftOwnersCount, error: loftOwnersError } = await supabase
      .from('loft_owners')
      .select('*', { count: 'exact', head: true });

    // Vérifier partner_profiles
    const { count: partnerProfilesCount, error: partnerProfilesError } = await supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true });

    // Vérifier la colonne new_owner_id dans lofts
    const { data: loftsData, error: loftsError } = await supabase
      .from('lofts')
      .select('id, owner_id, partner_id, new_owner_id')
      .limit(1);

    const hasNewOwnerIdColumn = loftsData && 'new_owner_id' in (loftsData[0] || {});

    console.log('📊 État actuel de la base de données:\n');
    console.log('┌─────────────────────────┬────────┬─────────┐');
    console.log('│ Table                   │ Existe │ Nombre  │');
    console.log('├─────────────────────────┼────────┼─────────┤');
    console.log(`│ owners                  │ ${ownersExists ? '✅' : '❌'}     │ ${ownersCount || 0}       │`);
    console.log(`│ loft_owners             │ ${!loftOwnersError ? '✅' : '❌'}     │ ${loftOwnersCount || 0}      │`);
    console.log(`│ partner_profiles        │ ${!partnerProfilesError ? '✅' : '❌'}     │ ${partnerProfilesCount || 0}       │`);
    console.log('└─────────────────────────┴────────┴─────────┘\n');

    console.log('📋 Colonnes dans lofts:');
    console.log(`  - owner_id: ${loftsData?.[0]?.owner_id ? '✅ (utilisée)' : '⚠️  (vide)'}`);
    console.log(`  - partner_id: ${loftsData?.[0]?.partner_id ? '✅ (utilisée)' : '⚠️  (vide)'}`);
    console.log(`  - new_owner_id: ${hasNewOwnerIdColumn ? '✅ (existe)' : '❌ (n\'existe pas)'}\n`);

    // Déterminer l'état de la migration
    console.log('🎯 État de la migration:\n');

    if (!ownersExists) {
      console.log('❌ ÉTAPE 1 NON FAITE: La table owners n\'existe pas');
      console.log('   → Exécuter: 01-create-owners-table.sql\n');
      return 'step1_needed';
    }

    if (ownersCount === 0) {
      console.log('⚠️  ÉTAPE 2 NON FAITE: La table owners est vide');
      console.log('   → Exécuter: 02-migrate-data-FIXED.sql\n');
      return 'step2_needed';
    }

    const expectedTotal = (loftOwnersCount || 0) + (partnerProfilesCount || 0);
    if (ownersCount < expectedTotal) {
      console.log(`⚠️  MIGRATION PARTIELLE: ${ownersCount}/${expectedTotal} propriétaires migrés`);
      console.log('   → Ré-exécuter: 02-migrate-data-FIXED.sql\n');
      return 'step2_incomplete';
    }

    if (!hasNewOwnerIdColumn) {
      console.log('⚠️  ÉTAPE 3 NON FAITE: La colonne new_owner_id n\'existe pas dans lofts');
      console.log('   → Exécuter: 03-update-lofts-table.sql\n');
      return 'step3_needed';
    }

    console.log('✅ MIGRATION COMPLÈTE!');
    console.log(`   - ${ownersCount} propriétaires dans la table owners`);
    console.log('   - Colonne new_owner_id créée dans lofts');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Vérifier que le code utilise bien la table owners');
    console.log('   2. Tester la création/édition de lofts');
    console.log('   3. Exécuter 04-add-rls-policies.sql si pas encore fait');
    console.log('   4. Finaliser avec l\'étape 6 (supprimer anciennes tables)\n');
    return 'complete';

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return 'error';
  }
}

checkMigrationStatus()
  .then(status => {
    console.log(`\n🏁 Statut: ${status}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
