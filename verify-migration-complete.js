/**
 * Verify Migration Completion
 * Run this AFTER executing finalize-migration.sql in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('\n🔍 VERIFICATION DE LA MIGRATION\n');
  console.log('='.repeat(50));

  try {
    // Check if old tables still exist
    console.log('\n📋 Vérification des anciennes tables...\n');
    
    const { data: loftOwnersCheck, error: loftOwnersError } = await supabase
      .from('loft_owners')
      .select('id')
      .limit(1);

    if (loftOwnersError && loftOwnersError.code === '42P01') {
      console.log('✅ Table loft_owners supprimée');
    } else {
      console.log('⚠️  Table loft_owners existe encore');
    }

    const { data: partnerProfilesCheck, error: partnerProfilesError } = await supabase
      .from('partner_profiles')
      .select('id')
      .limit(1);

    if (partnerProfilesError && partnerProfilesError.code === '42P01') {
      console.log('✅ Table partner_profiles supprimée');
    } else {
      console.log('⚠️  Table partner_profiles existe encore');
    }

    // Check owners table
    console.log('\n📋 Vérification de la table owners...\n');
    
    const { count: ownersCount, error: ownersError } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true });

    if (ownersError) {
      console.log('❌ Erreur:', ownersError.message);
    } else {
      console.log(`✅ Table owners: ${ownersCount} propriétaires`);
    }

    // Check lofts table columns
    console.log('\n📋 Vérification de la table lofts...\n');
    
    const { data: loftSample, error: loftError } = await supabase
      .from('lofts')
      .select('id, owner_id')
      .limit(1)
      .single();

    if (loftError) {
      console.log('❌ Erreur:', loftError.message);
    } else {
      console.log('✅ Colonne owner_id existe');
      console.log(`   Valeur: ${loftSample.owner_id || 'NULL'}`);
    }

    // Check for new_owner_id (should not exist)
    const { data: newOwnerCheck, error: newOwnerError } = await supabase
      .from('lofts')
      .select('id, new_owner_id')
      .limit(1);

    if (newOwnerError && newOwnerError.message.includes('new_owner_id')) {
      console.log('✅ Colonne new_owner_id supprimée');
    } else if (!newOwnerError) {
      console.log('⚠️  Colonne new_owner_id existe encore');
    }

    // Check for partner_id (should not exist)
    const { data: partnerIdCheck, error: partnerIdError } = await supabase
      .from('lofts')
      .select('id, partner_id')
      .limit(1);

    if (partnerIdError && partnerIdError.message.includes('partner_id')) {
      console.log('✅ Colonne partner_id supprimée');
    } else if (!partnerIdError) {
      console.log('⚠️  Colonne partner_id existe encore');
    }

    // Test the relationship
    console.log('\n📋 Test de la relation lofts -> owners...\n');
    
    const { data: loftsWithOwners, error: relationError } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        owner:owners(name, email)
      `)
      .not('owner_id', 'is', null)
      .limit(5);

    if (relationError) {
      console.log('❌ Erreur:', relationError.message);
    } else {
      console.log(`✅ Relation fonctionnelle! ${loftsWithOwners.length} lofts testés\n`);
      loftsWithOwners.forEach((loft, i) => {
        console.log(`   ${i + 1}. ${loft.name}`);
        console.log(`      Propriétaire: ${loft.owner?.name || 'N/A'}`);
      });
    }

    // Final statistics
    console.log('\n📊 STATISTIQUES FINALES\n');
    console.log('='.repeat(50));
    
    const { count: totalLofts } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true });

    const { count: loftsWithOwner } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .not('owner_id', 'is', null);

    console.log(`\nTotal lofts:           ${totalLofts || 0}`);
    console.log(`Lofts avec owner:      ${loftsWithOwner || 0}`);
    console.log(`Lofts sans owner:      ${(totalLofts || 0) - (loftsWithOwner || 0)}`);
    console.log(`Total owners:          ${ownersCount || 0}`);

    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 MIGRATION VERIFICATION COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
}

verifyMigration();
