/**
 * Script pour exécuter l'étape 2: Migration des données vers owners
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateLoftOwners() {
  console.log('📦 Migration de owners vers owners...');
  
  const { data: loftOwners, error } = await supabase
    .from('owners')
    .select('*');

  if (error) {
    console.error('❌ Erreur lecture owners:', error.message);
    return 0;
  }

  let migrated = 0;
  for (const owner of loftOwners) {
    const { error: insertError } = await supabase
      .from('owners')
      .insert({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        address: owner.address,
        ownership_type: owner.ownership_type,
        verification_status: 'verified',
        created_at: owner.created_at,
        updated_at: owner.updated_at
      });

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`  ⚠️  ${owner.name} déjà migré`);
      } else {
        console.error(`  ❌ Erreur pour ${owner.name}:`, insertError.message);
      }
    } else {
      console.log(`  ✅ ${owner.name} migré`);
      migrated++;
    }
  }

  return migrated;
}

async function migratePartnerProfiles() {
  console.log('\n📦 Migration de partner_profiles vers owners...');
  
  const { data: partners, error } = await supabase
    .from('partner_profiles')
    .select('*');

  if (error) {
    console.error('❌ Erreur lecture partner_profiles:', error.message);
    return 0;
  }

  let migrated = 0;
  for (const partner of partners) {
    // Vérifier si déjà migré
    const { data: existing } = await supabase
      .from('owners')
      .select('id')
      .eq('id', partner.id)
      .single();

    if (existing) {
      console.log(`  ⚠️  ${partner.business_name || 'Partner'} déjà migré`);
      continue;
    }

    const { error: insertError } = await supabase
      .from('owners')
      .insert({
        id: partner.id,
        user_id: partner.user_id,
        name: partner.business_name || 'Partner',
        business_name: partner.business_name,
        phone: partner.phone,
        address: partner.address,
        business_type: partner.business_type,
        tax_id: partner.tax_id,
        verification_status: partner.verification_status || 'pending',
        verification_documents: partner.verification_documents || [],
        bank_details: partner.bank_details || {},
        portfolio_description: partner.portfolio_description,
        created_at: partner.created_at,
        updated_at: partner.updated_at
      });

    if (insertError) {
      console.error(`  ❌ Erreur pour ${partner.business_name}:`, insertError.message);
    } else {
      console.log(`  ✅ ${partner.business_name || 'Partner'} migré`);
      migrated++;
    }
  }

  return migrated;
}

async function updateEmailsFromProfiles() {
  console.log('\n📧 Mise à jour des emails depuis profiles...');
  
  const { data: ownersWithUserId, error } = await supabase
    .from('owners')
    .select('id, user_id, email')
    .not('user_id', 'is', null)
    .is('email', null);

  if (error) {
    console.error('❌ Erreur:', error.message);
    return 0;
  }

  let updated = 0;
  for (const owner of ownersWithUserId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', owner.user_id)
      .single();

    if (profile?.email) {
      const { error: updateError } = await supabase
        .from('owners')
        .update({ email: profile.email })
        .eq('id', owner.id);

      if (!updateError) {
        console.log(`  ✅ Email ajouté pour owner ${owner.id}`);
        updated++;
      }
    }
  }

  return updated;
}

async function updateLoftsTable() {
  console.log('\n🏠 Mise à jour de la table lofts...');
  
  // Copier owner_id vers new_owner_id
  const { data: loftsWithOwnerId, error: error1 } = await supabase
    .from('lofts')
    .select('id, owner_id')
    .not('owner_id', 'is', null);

  if (!error1 && loftsWithOwnerId) {
    for (const loft of loftsWithOwnerId) {
      await supabase
        .from('lofts')
        .update({ new_owner_id: loft.owner_id })
        .eq('id', loft.id);
    }
    console.log(`  ✅ ${loftsWithOwnerId.length} lofts mis à jour (owner_id)`);
  }

  // Copier partner_id vers new_owner_id
  const { data: loftsWithPartnerId, error: error2 } = await supabase
    .from('lofts')
    .select('id, partner_id, new_owner_id')
    .not('partner_id', 'is', null)
    .is('new_owner_id', null);

  if (!error2 && loftsWithPartnerId) {
    for (const loft of loftsWithPartnerId) {
      await supabase
        .from('lofts')
        .update({ new_owner_id: loft.partner_id })
        .eq('id', loft.id);
    }
    console.log(`  ✅ ${loftsWithPartnerId.length} lofts mis à jour (partner_id)`);
  }
}

async function verifyMigration() {
  console.log('\n📊 Vérification de la migration...\n');
  
  const { count: loftOwnersCount } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true });

  const { count: partnerProfilesCount } = await supabase
    .from('partner_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: ownersCount } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true });

  const { count: ownersWithEmail } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true })
    .not('email', 'is', null);

  const { count: loftsWithNewOwnerId } = await supabase
    .from('lofts')
    .select('*', { count: 'exact', head: true })
    .not('new_owner_id', 'is', null);

  console.log('┌─────────────────────────┬─────────┐');
  console.log('│ Métrique                │ Valeur  │');
  console.log('├─────────────────────────┼─────────┤');
  console.log(`│ owners             │ ${loftOwnersCount || 0}      │`);
  console.log(`│ partner_profiles        │ ${partnerProfilesCount || 0}       │`);
  console.log(`│ Total attendu           │ ${(loftOwnersCount || 0) + (partnerProfilesCount || 0)}      │`);
  console.log('├─────────────────────────┼─────────┤');
  console.log(`│ owners (nouveau)        │ ${ownersCount || 0}      │`);
  console.log(`│ owners avec email       │ ${ownersWithEmail || 0}      │`);
  console.log(`│ lofts avec new_owner_id │ ${loftsWithNewOwnerId || 0}      │`);
  console.log('└─────────────────────────┴─────────┘\n');

  const expectedTotal = (loftOwnersCount || 0) + (partnerProfilesCount || 0);
  if (ownersCount === expectedTotal) {
    console.log('✅ Migration réussie! Tous les propriétaires ont été migrés.\n');
    return true;
  } else {
    console.log(`⚠️  Migration incomplète: ${ownersCount}/${expectedTotal} propriétaires migrés.\n`);
    return false;
  }
}

async function executeMigration() {
  console.log('🚀 Démarrage de la migration...\n');
  console.log('═'.repeat(60));
  
  try {
    const loftOwnersMigrated = await migrateLoftOwners();
    const partnersMigrated = await migratePartnerProfiles();
    const emailsUpdated = await updateEmailsFromProfiles();
    await updateLoftsTable();
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n📈 Résumé de la migration:');
    console.log(`  - ${loftOwnersMigrated} propriétaires de owners migrés`);
    console.log(`  - ${partnersMigrated} partenaires de partner_profiles migrés`);
    console.log(`  - ${emailsUpdated} emails mis à jour depuis profiles`);
    
    const success = await verifyMigration();
    
    if (success) {
      console.log('🎉 Migration terminée avec succès!');
      console.log('\n📝 Prochaines étapes:');
      console.log('  1. Vérifier que le code fonctionne correctement');
      console.log('  2. Exécuter: node check-migration-status.js');
      console.log('  3. Exécuter: 04-add-rls-policies.sql (si pas encore fait)');
      console.log('  4. Tester la création/édition de lofts\n');
    } else {
      console.log('⚠️  Migration incomplète. Vérifiez les erreurs ci-dessus.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

executeMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
